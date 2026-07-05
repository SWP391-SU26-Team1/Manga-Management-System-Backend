const AppError = require('../utils/appError');

const HF_API_KEY = process.env.HF_API_KEY;
const HF_COLORING_MODEL = process.env.HF_COLORING_MODEL || 'black-forest-labs/FLUX.1-schnell';

const generateColoring = async (imageUrl, prompt) => {
  if (!HF_API_KEY) {
    throw new AppError('HuggingFace API is not configured on the server (missing HF_API_KEY)', 500);
  }

  try {
    // 1. Fetch reference image to pass as input buffer/data if needed
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      throw new Error(`Failed to download reference image from ${imageUrl}`);
    }
    const imageBuffer = await imgRes.arrayBuffer();

    // 2. Call HuggingFace Inference API
    const response = await fetch(`https://api-inference.huggingface.co/models/${HF_COLORING_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          image: Buffer.from(imageBuffer).toString('base64'),
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HuggingFace API returned status ${response.status}: ${errText}`);
    }

    const resultBuffer = await response.arrayBuffer();
    return Buffer.from(resultBuffer);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('❌ HuggingFace API Error:', error.message || error);
    throw new AppError(`HuggingFace Smart Coloring failed: ${error.message || 'Unknown error'}`, 502);
  }
};

module.exports = {
  generateColoring,
};
