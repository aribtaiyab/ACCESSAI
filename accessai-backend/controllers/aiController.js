/**
 * FILE: controllers/aiController.js
 * 1. WHAT: AI processing logic with history saving.
 * 2. WHY: Handles simplification, explanation, summarization, alt text, and translation using Groq API.
 * 3. HOW: Called by aiRoutes.js.
 */
const axios = require('axios');
const crypto = require('crypto');
const db = require('../config/database');

const saveHistory = async (userId, type, inputText, outputText) => {
  if (!userId || !type || !inputText || !outputText) {
    return;
  }
  try {
    const historyId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    await db.run(
      `INSERT INTO history (id, user_id, type, input, output, created_at) 
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [historyId, userId, type, inputText, outputText]
    );
  } catch (error) {
    console.error('[History] Failed to save history:', error.message);
  }
};

exports.chat = async (req, res) => {
  try {
    const { text, type } = req.body;
    const userId = req.user?.id;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please give me some text to work with!',
        result: 'Please give me some text to work with!'
      });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error('Missing GROQ_API_KEY');
      return res.status(500).json({
        success: false,
        error: 'Server API key not configured.',
        result: 'Error: Server API key not configured.'
      });
    }

    let activeMode = type;
    if (type === 'summarize') activeMode = 'summary';
    if (!activeMode) activeMode = 'explain';

    // Trim input to max 1500 chars to reduce token cost and speed up response
    const trimmedText = text.trim().slice(0, 1500);

    // Compact per-mode prompts — extremely simple, human-friendly style
    const PROMPTS = {
      simplify: `Explain this text like you are talking to a 10-year-old friend. Use very basic words and very short sentences. One simple idea per line. No difficult words at all.\n\nText: ${trimmedText}`,
      explain:  `Explain this like a smart friend who makes things easy to understand. Use daily-life words and short sentences. Break it down into very simple steps. One idea per line.\n\nText: ${trimmedText}`,
      summary:  `Tell me the most important parts of this text in 3 to 5 simple bullet points. Use very easy English. Each bullet must start with ●. No big words.\n\nText: ${trimmedText}`,
    };

    const userPrompt = PROMPTS[activeMode] || PROMPTS.simplify;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a smart friend who explains things simply. Use very basic English, short sentences, and a friendly tone. Avoid technical words or formal language. Make sure a kid or a beginner can understand you instantly. No intro phrases like "Here is the summary". Just give the simple answer.'
          },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 400,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );

    const replyText = response.data?.choices?.[0]?.message?.content?.trim() || 'No response generated';

    // Save history async — don't await, never block the response
    if (userId && type) {
      saveHistory(userId, type, trimmedText, replyText).catch(() => {});
    }

    return res.json({
      success: true,
      data: replyText,
      result: replyText
    });
  } catch (error) {
    console.error('GROQ API ERROR:', error.response?.data || error.message);
    const errorMsg = "I couldn't process that right now. Please try again in a moment!";
    return res.status(500).json({
      success: false,
      error: errorMsg,
      result: errorMsg
    });
  }
};

exports.simplify = (req, res) => { req.body.type = 'simplify'; exports.chat(req, res); };
exports.explain = (req, res) => { req.body.type = 'explain'; exports.chat(req, res); };
exports.summarize = (req, res) => { req.body.type = 'summarize'; exports.chat(req, res); };

/**
 * askPage — Voice Page Assistant
 * Accepts: { question, pageContext, pageTitle, pageUrl }
 * Returns: { success: true, data: "...", result: "..." }
 */
exports.askPage = async (req, res) => {
  try {
    const { question, pageContext, pageTitle, pageUrl } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please ask me a question!',
        result: 'Please ask me a question!'
      });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error('Missing GROQ_API_KEY');
      return res.status(500).json({
        success: false,
        error: 'Server API key not configured.',
        result: 'Error: Server API key not configured.'
      });
    }

    const trimmedContext  = (pageContext || '').trim().slice(0, 3500);
    const trimmedQuestion = question.trim().slice(0, 400);
    const title           = (pageTitle || 'Unknown Page').slice(0, 120);
    const url             = (pageUrl   || '').slice(0, 200);

    const systemPrompt = `You are AccessAI, a smart and friendly friend who helps explain webpages.
The user is on a webpage and wants to know something about it.
Explain things simply, like you are talking to a kid or a beginner.
Use basic English and very short sentences. Avoid robotic or formal words.

Always format your answer exactly like this:

✨ Summary
(One simple sentence that explains the answer)

📌 Key Points
• one easy point
• one easy point
• one easy point (max 4 points)

🎯 Main Insight
(One very short, helpful tip or meaning)

Rules:
- Use only common, daily-use words
- Keep it very short and easy to read
- No complex sentences or big words
- No markdown headers (like #)
- If the page doesn't have the answer, just say "I can't find that here" in a friendly way.`;

    const userPrompt = `Page Title: ${title}\nPage URL: ${url}\n\nPage Content:\n${trimmedContext}\n\n---\nUser Question: ${trimmedQuestion}`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
        max_tokens: 500,
        temperature: 0.4,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    const answer = response.data?.choices?.[0]?.message?.content?.trim() || 'No answer generated.';
    return res.json({
      success: true,
      data: answer,
      result: answer
    });

  } catch (error) {
    console.error('ASK-PAGE ERROR:', error.response?.data || error.message);
    const errorMsg = "I can't answer that right now. Let's try again in a bit!";
    return res.status(500).json({
      success: false,
      error: errorMsg,
      result: errorMsg
    });
  }
};

exports.translate = async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    const userId = req.user?.id;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Text is required for translation.',
        result: 'Error: Text is required.'
      });
    }
    if (!targetLanguage || typeof targetLanguage !== 'string' || !targetLanguage.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Target language is required.',
        result: 'Error: Target language is required.'
      });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error('Missing GROQ_API_KEY');
      return res.status(500).json({
        success: false,
        error: 'Server API key not configured.',
        result: 'Error: Server API key not configured.'
      });
    }

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a helpful translator. Translate the text accurately, but use the simplest possible words in the target language so it is easy for anyone to read. Return ONLY the translated text. Do not add any notes or extra talk.`
          },
          {
            role: 'user',
            content: `Translate the following text into ${targetLanguage}:\n\n${text}`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const translatedText = response.data?.choices?.[0]?.message?.content?.trim() || 'Translation unavailable.';

    if (userId) {
      await saveHistory(userId, 'translate', text, translatedText).catch(() => {});
    }

    return res.json({
      success: true,
      data: translatedText,
      result: translatedText
    });
  } catch (error) {
    console.error('TRANSLATE ERROR:', error.response?.data || error.message);
    const errorMsg = "I couldn't translate that right now. Let's try again!";
    return res.status(500).json({
      success: false,
      error: errorMsg,
      result: errorMsg
    });
  }
};




