/**
 * FILE: controllers/companionController.js
 * 1. WHAT: AccessAI Internet Companion — processes URL/text into structured insight.
 * 2. WHY:  Isolated from all existing controllers. No existing routes affected.
 * 3. HOW:  Called by companionRoutes.js → POST /api/companion/analyze
 *          Also handles follow-up chat via POST /api/companion/chat
 */
const axios = require('axios');

// ── Analyze: main entry point ──────────────────────────────────────────────────
exports.analyze = async (req, res) => {
  try {
    const { text, url } = req.body;

    const inputText = (text || '').trim();
    const inputUrl  = (url  || '').trim();

    if (!inputText && !inputUrl) {
      return res.status(400).json({
        success: false,
        error: 'Please give me some text or a link to look at!',
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Server API key not configured.',
      });
    }

    // If URL provided without text, let the AI acknowledge it and work with the URL context
    const contentToAnalyze = inputText
      ? inputText.slice(0, 4000)
      : `[URL provided — no page content extracted]: ${inputUrl}`;

    const systemPrompt = `You are AccessAI Internet Companion — a smart friend who helps people understand things online.
Your job is to explain anything — like bills, contracts, emails, or news — in a way that is extremely simple and easy to read.

ALWAYS respond in this EXACT JSON format (no markdown, no code fences, pure JSON):
{
  "understanding": "2-3 very simple sentences. Use basic English. Explain what this is and why it matters like you are talking to a friend.",
  "points": ["easy point 1", "easy point 2", "easy point 3", "easy point 4"],
  "alerts": ["simple warning 1", "simple warning 2"],
  "noAlerts": false,
  "actions": ["simple step 1", "simple step 2"],
  "contentType": "Short label like: Bill / Contract / News / Job Offer / Medicine / Email / Other"
}

Rules:
- "understanding": Use natural, daily-life words. No robotic or formal AI talk.
- "points": Keep them very short (under 10 words). Use basic vocabulary.
- "alerts": Only mention real dangers like hidden costs, scams, or health risks. If it's safe, set "noAlerts": true.
- "actions": Give 2-3 very easy steps the user can do.
- "contentType": Keep the label simple.
- Think: "Could a kid understand this?" If not, simplify it more.
- NEVER use markdown headers or bold text inside the JSON.
- Just return the JSON. No extra talk.`;

    const userPrompt = `Analyze this content:\n\n${contentToAnalyze}`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
        max_tokens: 700,
        temperature: 0.35,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 25000,
      }
    );

    const raw = response.data?.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error('Empty response from AI');

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Fallback: extract JSON from response if extra text slipped through
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }

    if (!parsed) {
      return res.status(500).json({ success: false, error: 'Could not parse AI response. Please try again.' });
    }

    // Normalize and sanitize
    const result = {
      contentType:   String(parsed.contentType  || 'Content').trim(),
      understanding: String(parsed.understanding || '').trim(),
      points:        Array.isArray(parsed.points)  ? parsed.points.slice(0,5).map(p => String(p).trim()) : [],
      noAlerts:      parsed.noAlerts === true,
      alerts:        Array.isArray(parsed.alerts)  ? parsed.alerts.slice(0,5).map(a => String(a).trim()) : [],
      actions:       Array.isArray(parsed.actions) ? parsed.actions.slice(0,4).map(a => String(a).trim()) : [],
    };

    // If alerts array empty, set noAlerts true
    if (result.alerts.length === 0) result.noAlerts = true;

    return res.json({ success: true, data: result });

  } catch (err) {
    console.error('[Companion] analyze error:', err.response?.data || err.message);
    const isTimeout = err.code === 'ECONNABORTED' || err.name === 'AbortError';
    return res.status(500).json({
      success: false,
      error: isTimeout
        ? 'Request timed out. Please try again.'
        : "I couldn't analyze this right now. Let's try again in a bit!",
    });
  }
};

// ── Follow-up Chat ─────────────────────────────────────────────────────────────
exports.chat = async (req, res) => {
  try {
    const { question, context } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ success: false, error: 'Please ask me a question!' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ success: false, error: 'Server API key not configured.' });
    }

    const trimmedContext  = (context  || '').slice(0, 2000);
    const trimmedQuestion = (question || '').slice(0, 300);

    const systemPrompt = `You are AccessAI Internet Companion — a smart and friendly friend.
The user is asking a follow-up question about something they just read.
Answer directly, clearly, and very simply. Use basic English and short sentences.
Sound like a helpful friend. No robotic AI talk. No long explanations.
Maximum 2-3 short sentences. If you need to translate or check safety, do it simply.`;

    const userPrompt = trimmedContext
      ? `Original content context:\n${trimmedContext}\n\nUser question: ${trimmedQuestion}`
      : `User question: ${trimmedQuestion}`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
        max_tokens: 250,
        temperature: 0.4,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const answer = response.data?.choices?.[0]?.message?.content?.trim() || "I couldn't think of an answer. Let's try again!";
    return res.json({ success: true, answer });

  } catch (err) {
    console.error('[Companion] chat error:', err.response?.data || err.message);
    return res.status(500).json({ success: false, error: "I can't answer right now. Let's try again later!" });
  }
};
