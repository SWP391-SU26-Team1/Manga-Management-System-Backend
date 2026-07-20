const Groq = require('groq-sdk');
const AppError = require('../utils/appError');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_VISION_MODEL || 'llama-3.2-11b-vision-preview';

const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

// Parse PNG, JPEG, GIF dimensions directly from buffer bytes
function getImageDimensions(buffer) {
  try {
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let i = 2;
      while (i < buffer.length - 8) {
        if (buffer[i] === 0xFF) {
          const marker = buffer[i + 1];
          if (
            (marker >= 0xC0 && marker <= 0xC3) ||
            (marker >= 0xC5 && marker <= 0xC7) ||
            (marker >= 0xC9 && marker <= 0xCB) ||
            (marker >= 0xCD && marker <= 0xCF)
          ) {
            const height = buffer.readUInt16BE(i + 5);
            const width = buffer.readUInt16BE(i + 7);
            return { width, height };
          }
          i += 2 + buffer.readUInt16BE(i + 2);
        } else {
          i++;
        }
      }
    }
    const gifHeader = buffer.toString('ascii', 0, 6);
    if (gifHeader === 'GIF87a' || gifHeader === 'GIF89a') {
      const width = buffer.readUInt16LE(6);
      const height = buffer.readUInt16LE(8);
      return { width, height };
    }
  } catch (err) {
    console.error('Failed to parse image dimensions from buffer:', err);
  }
  return null;
}

const detectPanels = async (imageUrl, prompt) => {
  if (!groq) {
    throw new AppError('Groq API is not configured on the server (missing GROQ_API_KEY)', 500);
  }

  // Fetch the image first to determine its true size for coordinate scaling
  let actualWidth = 1000;
  let actualHeight = 1000;
  try {
    console.log(`[Groq Provider] Fetching reference image to determine original dimensions: ${imageUrl}`);
    const imgRes = await fetch(imageUrl);
    if (imgRes.ok) {
      const arrayBuf = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const dims = getImageDimensions(buffer);
      if (dims) {
        actualWidth = dims.width;
        actualHeight = dims.height;
        console.log(`[Groq Provider] Image dimensions parsed: ${actualWidth}x${actualHeight}`);
      }
    }
  } catch (err) {
    console.error('[Groq Provider] Failed to parse image dimensions, using 1000x1000 fallback:', err.message);
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

    // Validate and format each coordinate, denormalizing from 1000x1000 to actual size
    const validPanels = panels.map((p, idx) => {
      const x = Number(p.x);
      const y = Number(p.y);
      const width = Number(p.width ?? p.w);
      const height = Number(p.height ?? p.h);

      if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
        throw new Error(`Panel at index ${idx} has invalid numeric coordinates: ${JSON.stringify(p)}`);
      }

      // Denormalize from 1000x1000 grid to actual dimensions
      const realX = Math.round((x / 1000) * actualWidth);
      const realY = Math.round((y / 1000) * actualHeight);
      const realWidth = Math.round((width / 1000) * actualWidth);
      const realHeight = Math.round((height / 1000) * actualHeight);

      return {
        x: realX,
        y: realY,
        width: realWidth,
        height: realHeight,
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

const expandColoringPrompt = async (userPrompt, taskContent, mangaContext = {}) => {
  if (!groq) {
    return userPrompt || '';
  }

  const { seriesTitle, seriesGenre, chapterTitle } = mangaContext;

  const systemInstruction = `You are an expert prompt pre-processor for Stable Diffusion and FLUX models.
Your job is to translate and compile a user prompt, a task description, and manga metadata into a clean, comma-separated list of English tags/keywords that the image generator can easily process without needing to reason about complex sentences.

Strict Rules:
1. Translate all Vietnamese terms into standard, high-quality English image generation tags (e.g., "sửa mắt" -> "detailed eyes", "tô màu rực rỡ" -> "vibrant colors", "hoàng hôn" -> "sunset lighting").
2. NEVER output abstract layout references, spatial terms, or coordinate labels like "Vùng 1", "Region 2", "box 3", "panel" etc. The image generator does not understand these textual labels. Instead, extract only the visual subjects described (e.g., "detailed eyes", "colored hair", "highly-detailed background").
3. DO NOT output paragraphs, conversational prose, explanations, introduction, or quotes. Output ONLY the final list of comma-separated tags.
4. Keep tags concise, descriptive, and separate them by commas.
5. Use the provided Manga Metadata to intelligently infer artistic style guidance, character styling, and color palettes matching the specific manga series title, genre, and chapter context.
6. Add standard quality enhancers suitable for manga coloring: e.g., "clean cel shading, digital coloring, high resolution, masterpiece, line art preservation".`;

  const userContent = `Manga Metadata:
- Series/Manga Title: ${seriesTitle || 'Unknown'}
- Genre: ${seriesGenre || 'Unknown'}
- Chapter Title: ${chapterTitle || 'Unknown'}

User Prompt: ${userPrompt || 'None'}
Task Description: ${taskContent || 'None'}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userContent }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 256,
    });

    const result = chatCompletion.choices?.[0]?.message?.content?.trim();
    console.log('🤖 Expanded Prompt via Groq LLM:', result);
    return result || userPrompt || '';
  } catch (err) {
    console.error('⚠️ Failed to expand prompt via Groq LLM, using fallback:', err.message);
    return userPrompt || '';
  }
};


module.exports = {
  detectPanels,
  expandColoringPrompt,
};
