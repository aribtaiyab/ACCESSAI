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
    await supabase.from('history').insert([{
      user_id: userId,
      type,
      input_text: inputText,
      output_text: outputText
    }]);
  } catch (error) {
    console.error('Failed to save history:', error);
  }
};

exports.chat = async (req, res) => {
  try {
    const { text, type } = req.body;
    const userId = req.user?.id;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ reply: 'Error: Text is required.' });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error('Missing GROQ_API_KEY');
      return res.status(500).json({ reply: 'Error: Server API key not configured.' });
    }

    let activeMode = type;
    if (type === 'summarize') activeMode = 'summary';
    if (!activeMode) activeMode = 'explain';

    const systemPrompt = `You are a world-class AI designed for maximum clarity, simplicity, and human understanding.

Your #1 goal is EASY UNDERSTANDING FOR EVERY HUMAN — children, students, adults, elderly people, and non-technical users.

# 🧠 CORE THINKING RULE
Before answering, think like a teacher explaining to a 10-year-old.
Remove complexity. Convert all ideas into simple real-life meaning.

# ⚙️ UNIVERSAL OUTPUT RULE
✔ Clean spacing
✔ Proper new lines
✔ Easy structure
✔ No dense paragraphs
✔ No merged sentences
✔ One idea per line

# 🟢 IF MODE = "simplify"
GOAL: Make it so simple that even a child understands instantly.
● Use very short sentences.
● One idea per line.
● No technical words unless necessary.
● Explain meaning only.
● Use real-life simple thinking.
FORMAT: Each line must be short, clear, and on a new line.

# 🔵 IF MODE = "explain"
GOAL: Explain like a friendly teacher, not a textbook.
● Break concept into small logical parts.
● Explain "why" and "how" in simple way.
● Use step-by-step natural thinking.
● Keep language easy and human.
FORMAT: Each idea MUST be on a new line. No long paragraphs. No merging of concepts.

# 🟣 IF MODE = "summary"
GOAL: Quick revision for anyone.
● Only key points. No explanations. No extra words.
FORMAT (STRICT): Each point must start with "●", be on a NEW LINE, and contain only ONE idea.
❌ NEVER merge bullets. ❌ NEVER use comma-separated points.

# 🚨 HARD FORMATTING GUARANTEE
✔ Use real line breaks.
✔ Never merge multiple points in one line.
✔ Never compress output.
✔ Always prioritize readability over length.

# 🧠 HUMAN-FIRST LOGIC RULE
Every answer must pass this test:
👉 "Can a 10-year-old understand this in 5 seconds?"
If NO → simplify more.

# 💡 FINAL PRINCIPLE
Make AI feel like a friendly teacher sitting next to the user.
Clarity > Intelligence. Simplicity > Complexity. Understanding > Everything else.

# 🧠 MODE ISOLATION RULE
ONLY ONE mode applies at a time.
NEVER mix simplify/explain/summary.
FOLLOW ONLY THE SELECTED MODE.`;

    let finalUserPrompt = `Mode: ${activeMode}\n\nText:\n${text}`;

    if (activeMode === 'alttext') {
      finalUserPrompt = `Mode: explain\n\nTask: Create a simple alternative text description for this content.\n\nText:\n${text}`;
    }

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: finalUserPrompt }
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

    const replyText = response.data?.choices?.[0]?.message?.content?.trim() || 'No response generated';

    if (userId && type) {
      await saveHistory(userId, type, text, replyText);
    }

    return res.json({ reply: replyText });
  } catch (error) {
    console.error('GROQ API ERROR:', error.response?.data || error.message);
    return res.status(500).json({ reply: 'Unable to process request. Please try again.' });
  }
};

exports.translate = async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    const userId = req.user?.id;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, data: 'Error: Text is required.' });
    }
    if (!targetLanguage || typeof targetLanguage !== 'string' || !targetLanguage.trim()) {
      return res.status(400).json({ success: false, data: 'Error: Target language is required.' });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error('Missing GROQ_API_KEY');
      return res.status(500).json({ success: false, data: 'Unable to process request. Please try again.' });
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

    return res.json({ success: true, data: translatedText });
  } catch (error) {
    console.error('TRANSLATE ERROR:', error.response?.data || error.message);
    return res.status(500).json({ success: false, data: 'Unable to process request. Please try again.' });
  }
};

exports.altText = async (req, res) => {
  try {
    const { image } = req.body;
    const userId = req.user?.id;

    if (!image) {
      return res.status(400).json({ reply: 'Error: Image is required.' });
    }

    if (!process.env.HF_API_KEY || !process.env.GROQ_API_KEY) {
      return res.status(500).json({ reply: 'Error: Server API keys not configured.' });
    }

    let hfData;
    if (image.startsWith('http')) {
      const imgRes = await axios.get(image, { responseType: 'arraybuffer' });
      hfData = imgRes.data;
    } else if (image.startsWith('data:image')) {
      const base64Data = image.split(',')[1];
      hfData = Buffer.from(base64Data, 'base64');
    } else {
      return res.status(400).json({ reply: 'Error: Invalid image format.' });
    }

    // Step 1: Hugging Face Caption
    let caption = '';
    try {
      const hfResponse = await axios.post(
        'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base',
        hfData,
        {
          headers: {
            Authorization: `Bearer ${process.env.HF_API_KEY}`,
            'Content-Type': 'application/octet-stream',
          },
        }
      );
      caption = hfResponse.data?.[0]?.generated_text;
    } catch (err) {
      console.error('HF Error:', err.response?.data || err.message);
      return res.json({ reply: 'Image description not available' });
    }

    if (!caption) {
      return res.json({ reply: 'Image description not available' });
    }

    // Step 2: Groq Refinement
    let altText = caption;
    try {
      const groqResponse = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'mixtral-8x7b-32768',
          messages: [
            { role: 'user', content: `Convert this image caption into a clear, concise alt text under 120 characters. Make it accessible and descriptive: ${caption}` }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      const groqText = groqResponse.data?.choices?.[0]?.message?.content?.trim();
      if (groqText) {
        altText = groqText;
      }
    } catch (err) {
      console.error('Groq Error in alt-text:', err.message);
      altText = caption.length > 120 ? caption.substring(0, 117) + '...' : caption;
    }

    // Save to history
    if (userId) {
      await saveHistory(userId, 'alt-text', image.startsWith('http') ? image : 'uploaded image', altText);
    }

    return res.json({ reply: altText });
  } catch (error) {
    console.error('ALT TEXT ERROR:', error.message);
    return res.status(500).json({ reply: 'Unable to process request. Please try again.' });
  }
};

