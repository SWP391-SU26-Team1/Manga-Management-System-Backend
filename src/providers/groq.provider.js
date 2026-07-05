const Groq = require('groq-sdk');
const AppError = require('../utils/appError');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';

const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

const detectPanels = async (imageUrl, prompt) => {
  if (!groq) {
    throw new AppError('Groq API is not configured on the server (missing GROQ_API_KEY)', 500);
  }

  let apiPrompt = prompt || '';
  if (!apiPrompt.toLowerCase().includes('json')) {
    apiPrompt += '\n\nReturn the response in JSON format.';
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: apiPrompt },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      model: GROQ_MODEL,
      temperature: 0.1,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    });

    const content = chatCompletion.choices?.[0]?.message?.content || '';
    console.log('🤖 Groq raw response:', content.slice(0, 300));

    // Strategy 1: Try parsing the whole response as JSON
    let parsed = null;
    try {
      parsed = JSON.parse(content.trim());
    } catch (_) {
      // Strategy 2: Strip markdown code fences then parse
      let cleaned = content.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
      else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
      if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
      cleaned = cleaned.trim();
      try {
        parsed = JSON.parse(cleaned);
      } catch (_2) {
        // Strategy 3: Use regex to extract first JSON array from text
        const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          parsed = JSON.parse(arrayMatch[0]);
        }
      }
    }

    if (!parsed) {
      throw new Error(`Model returned non-JSON response: "${content.slice(0, 200)}"`);
    }

    // Handle both direct array and {panels: [...]} object formats
    let panels = Array.isArray(parsed) ? parsed : (parsed.panels || parsed.data || parsed.regions || null);
    if (!Array.isArray(panels)) {
      throw new Error('Could not find a panels array in the AI response');
    }

    // Validate and format each coordinate
    const validPanels = panels.map((p, idx) => {
      const x = Number(p.x);
      const y = Number(p.y);
      const width = Number(p.width ?? p.w);
      const height = Number(p.height ?? p.h);

      if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
        throw new Error(`Panel at index ${idx} has invalid numeric coordinates: ${JSON.stringify(p)}`);
      }

      return {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
      };
    });

    return validPanels;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('❌ Groq Vision API Error:', error.message || error);
    throw new AppError(`Groq AI Panel Detection failed: ${error.message || 'Unknown error'}`, 502);
  }
};


module.exports = {
  detectPanels,
};
