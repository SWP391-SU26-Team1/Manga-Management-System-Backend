const AppError = require('../utils/appError');

const HF_API_KEY = process.env.HF_API_KEY;
const DEFAULT_MODEL = process.env.HF_COLORING_MODEL || 'stabilityai/stable-diffusion-3-medium-diffusers';

const generateColoring = async (imageUrl, prompt, modelName) => {
  if (!HF_API_KEY) {
    throw new AppError('HuggingFace API is not configured on the server (missing HF_API_KEY)', 500);
  }

  const activeModel = modelName || DEFAULT_MODEL;

  try {
    // 1. Fetch reference image to pass as input buffer/data if needed
    console.log(`[HF Provider] Fetching reference image from URL: ${imageUrl}`);
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      throw new Error(`Failed to download reference image from ${imageUrl} (Status: ${imgRes.status})`);
    }
    const imageBuffer = await imgRes.arrayBuffer();
    console.log(`[HF Provider] Image downloaded successfully, size: ${imageBuffer.byteLength} bytes`);

    // 2. Call HuggingFace Inference API
    const hfUrl = `https://router.huggingface.co/hf-inference/models/${activeModel}`;
    console.log(`[HF Provider] Sending request to Hugging Face URL: ${hfUrl}`);
    
    const isTextToImage = activeModel.toLowerCase().includes('flux') || activeModel.toLowerCase().includes('stable-diffusion');
    let requestPayload;

    if (isTextToImage) {
      console.log(`[HF Provider] Text-to-image model detected. Sending text-to-image prompt without input image.`);
      requestPayload = {
        inputs: prompt
      };
    } else {
      console.log(`[HF Provider] Image-to-image model detected. Sending base64 input image and prompt parameters.`);
      requestPayload = {
        inputs: Buffer.from(imageBuffer).toString('base64'),
        parameters: {
          prompt: prompt
        }
      };
    }

    const response = await fetch(hfUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HuggingFace API returned status ${response.status}: ${errText}`);
    }

    const resultBuffer = await response.arrayBuffer();
    console.log(`[HF Provider] Successfully received coloring result from Hugging Face`);
    return Buffer.from(resultBuffer);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('❌ HuggingFace API Error Detail:', error);
    throw new AppError(`HuggingFace Smart Coloring failed: ${error.message || 'Unknown error'}`, 502);
  }
};

module.exports = {
  generateColoring,
};
