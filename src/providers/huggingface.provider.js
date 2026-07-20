const AppError = require('../utils/appError');
const { Client, handle_file } = require('@gradio/client');

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
    const buffer = Buffer.from(imageBuffer);
    console.log(`[HF Provider] Image downloaded successfully, size: ${buffer.byteLength} bytes`);

    // 1.5 Handle Gradio Space Manga Colorizer
    if (activeModel === 'sharky172/manga-light-colorizer') {
      console.log(`[HF Provider] Connecting to Gradio Space: ${activeModel}`);
      const app = await Client.connect(activeModel, {
        hf_token: HF_API_KEY
      });
      console.log(`[HF Provider] Submitting colorization job to Space...`);
      const result = await app.predict('/colorize_image', [
        handle_file(buffer),
        768 // High quality resolution
      ]);
      const colorizedUrl = result.data[0].url;
      console.log(`[HF Provider] Gradio Space colorization complete. Fetching colorized image from: ${colorizedUrl}`);
      const outputRes = await fetch(colorizedUrl);
      if (!outputRes.ok) {
        throw new Error(`Failed to download colorized image from Gradio Space: ${outputRes.status}`);
      }
      const outputBuffer = await outputRes.arrayBuffer();
      return Buffer.from(outputBuffer);
    }

    // 2. Call HuggingFace Inference API
    const hfUrl = `https://router.huggingface.co/hf-inference/models/${activeModel}`;
    console.log(`[HF Provider] Sending request to Hugging Face URL: ${hfUrl}`);
    
    // Determine if we should perform Text-to-Image or Image-to-Image
    // Flux is strictly Text-to-Image on the HF Inference API
    const isFlux = activeModel.toLowerCase().includes('flux');
    const hasImage = !!imageBuffer;
    let requestPayload;

    if (hasImage && !isFlux) {
      console.log(`[HF Provider] Image-to-image mode. Model: ${activeModel}. Sending base64 input image and prompt.`);
      requestPayload = {
        inputs: Buffer.from(imageBuffer).toString('base64'),
        parameters: {
          prompt: prompt
        }
      };
    } else {
      console.log(`[HF Provider] Text-to-image mode. Model: ${activeModel}. Sending prompt only.`);
      requestPayload = {
        inputs: prompt
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
