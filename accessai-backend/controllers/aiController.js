/**
 * FILE: controllers/aiController.js
 * 1. WHAT: AI processing logic with history saving.
 * 2. WHY: Handles simplification, explanation, summarization, alt text, and translation using Groq API.
 * 3. HOW: Called by aiRoutes.js.
 */
const axios = require('axios');
const supabase = require('../lib/supabaseClient');

const saveHistory = async (userId, type, inputText, outputText) => {
  if (!supabase) {
    console.warn('Skipping history save: Supabase not available');
    return;
  }
  try {
    console.log("Saving history:", inputText);
    const { error } = await supabase.from('history').insert([{
      user_id: userId,
      type,
      input: inputText,
      output: outputText,
      created_at: new Date()
    }]);
    if (error) console.error(error);
  } catch (error) {
    console.error('Failed to save history:', error);
  }
};

exports.chat = async (req, res) => {
  try {
    const { text, type } = req.body;
    const userId = req.user?.id;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ result: 'Error: Text is required.' });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error('Missing GROQ_API_KEY');
      return res.status(500).json({ result: 'Error: Server API key not configured.' });
    }

    let activeMode = type;
    if (type === 'summarize') activeMode = 'summary';
    if (!activeMode) activeMode = 'explain';

    // Trim input to max 1500 chars to reduce token cost and speed up response
    const trimmedText = text.trim().slice(0, 1500);

    // Compact per-mode prompts — fewer tokens = faster response
    const PROMPTS = {
      simplify: `Simplify this text so a 10-year-old understands it easily. Use very short sentences. One idea per line. No jargon.\n\nText: ${trimmedText}`,
      explain:  `Explain this text clearly like a friendly teacher. Use short sentences. Break into simple logical steps. One idea per line.\n\nText: ${trimmedText}`,
      summary:  `Summarize this text into 3–5 bullet points. Each bullet must start with ●. One idea per bullet. No explanations.\n\nText: ${trimmedText}`,
    };

    const userPrompt = PROMPTS[activeMode] || PROMPTS.simplify;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a clarity expert. Give short, simple, clean responses. No intro phrases. No repetition. Respond immediately and directly.'
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
        timeout: 15000
      }
    );

    const replyText = response.data?.choices?.[0]?.message?.content?.trim() || 'No response generated';

    // Save history async — don't await, never block the response
    if (userId && type) {
      saveHistory(userId, type, trimmedText, replyText).catch(() => {});
    }

    return res.json({ result: replyText });
  } catch (error) {
    console.error('GROQ API ERROR:', error.response?.data || error.message);
    return res.status(500).json({ result: 'Unable to process request. Please try again.' });
  }
};

exports.simplify = (req, res) => { req.body.type = 'simplify'; exports.chat(req, res); };
exports.explain = (req, res) => { req.body.type = 'explain'; exports.chat(req, res); };
exports.summarize = (req, res) => { req.body.type = 'summarize'; exports.chat(req, res); };

exports.translate = async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    const userId = req.user?.id;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ result: 'Error: Text is required.' });
    }
    if (!targetLanguage || typeof targetLanguage !== 'string' || !targetLanguage.trim()) {
      return res.status(400).json({ result: 'Error: Target language is required.' });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error('Missing GROQ_API_KEY');
      return res.status(500).json({ result: 'Error: Server API key not configured.' });
    }

    console.log(`[TRANSLATE] Target: ${targetLanguage}, Text length: ${text.length}`);

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given text accurately into the requested language. Return ONLY the translated text. Do not add any explanation, notes, or commentary. Do not include the original text.`
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
      await saveHistory(userId, 'translate', text, translatedText);
    }

    return res.json({ result: translatedText });
  } catch (error) {
    console.error('TRANSLATE ERROR:', error.response?.data || error.message);
    return res.status(500).json({ result: 'Error: Unable to process translation. Please try again.' });
  }
};



