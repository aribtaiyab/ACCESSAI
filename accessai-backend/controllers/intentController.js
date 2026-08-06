/**
 * FILE: controllers/intentController.js
 * 1. WHAT: AI Reading Assistant controller.
 * 2. WHY:  Handles POST /api/reading-assistant requests.
 * 3. HOW:  Uses the AI backend to produce mode-specific summaries and key points.
 */
const axios = require('axios');
const FALLBACK_RESPONSE = {
  summary: "I couldn't read that properly. Please try again with less text or a different mode.",
  keyPoints: ['Use a shorter bit of text.', 'Pick a different mode.', 'Try again if you need to.'],
  nextSteps: ['Paste the text again', 'Choose a reading mode', 'Try analyzing again'],
  mode: 'Quick Read',
};

exports.analyzeReadingAssistant = async (req, res) => {
  try {
    const { text, mode } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text is required.', data: FALLBACK_RESPONSE });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error('[intentController] Missing GROQ_API_KEY');
      return res.status(500).json({ success: false, error: 'Server API key not configured.', data: FALLBACK_RESPONSE });
    }

    const trimmedText = text.trim().slice(0, 3000);
    const selectedMode = typeof mode === 'string' && mode.trim() ? mode.trim() : 'Quick Read';

    const prompt = `You are a smart friend helping someone read. Your goal is to make this text extremely easy to understand. Use very basic English and short sentences.

Text to read:
"""
${trimmedText}
"""

Mode: ${selectedMode}

READING MODES:
- Quick Read: Tell the main point in 1 or 2 very simple sentences.
- Student Mode: Explain the main ideas simply so they are easy to learn. No big academic words.
- Kid Mode: Explain like you are talking to a 7-year-old. Use very easy words and a simple example.
- Easy Mode: Use everyday English. No difficult or technical words.
- Professional Mode: Explain clearly and simply, but keep it polite and neat.
- Action Mode: Tell the user exactly what they need to do in simple steps.
- Focus Layer: Get rid of the fluff and show only the most important parts.

OUTPUT RULES:
- Return ONLY valid JSON.
- summary: 1-3 very simple sentences.
- keyPoints: 3-4 short points using basic words.
- nextSteps: 0-3 simple actions the user can take.
- mode: Use the exact mode name.

Think: "Can a kid or a beginner understand this in 5 seconds?" If not, make it simpler.

Return ONLY this JSON:
{
  "summary": "",
  "keyPoints": ["", "", "", ""],
  "nextSteps": ["", "", ""],
  "mode": ""
}`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a smart friend who makes reading easy. You explain things simply, naturally, and helpfully. Avoid robotic or formal language. Return ONLY JSON.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 600,
        temperature: 0.35,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    const rawContent = response.data?.choices?.[0]?.message?.content?.trim() || '';

    let parsed;
    try {
      const jsonStr = rawContent
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```\s*$/, '')
        .trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.warn('[intentController] JSON parse failed, using fallback. Raw:', rawContent);
      parsed = FALLBACK_RESPONSE;
    }

    const sanitized = {
      summary: String(parsed.summary || FALLBACK_RESPONSE.summary).slice(0, 400),
      keyPoints: Array.isArray(parsed.keyPoints)
        ? parsed.keyPoints.slice(0, 4).map((item) => String(item || '').slice(0, 180)).filter(Boolean)
        : FALLBACK_RESPONSE.keyPoints,
      nextSteps: Array.isArray(parsed.nextSteps)
        ? parsed.nextSteps.slice(0, 3).map((item) => String(item || '').slice(0, 180)).filter(Boolean)
        : FALLBACK_RESPONSE.nextSteps,
      mode: String(parsed.mode || selectedMode).slice(0, 40),
    };

    return res.json({ success: true, data: sanitized });

  } catch (error) {
    const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
    console.error('[intentController]', isTimeout ? 'Timeout' : error.response?.data || error.message);
    return res.status(isTimeout ? 408 : 500).json({
      success: false,
      error: isTimeout ? 'Request timed out. Please try again.' : "I couldn't analyze this text. Let's try again!",
      data: FALLBACK_RESPONSE,
    });
  }
};
