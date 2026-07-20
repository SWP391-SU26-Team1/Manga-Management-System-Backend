const getPanelDetectionPrompt = () => {
  return `You are an expert manga assistant specializing in computer vision and layout analysis.
Analyze the provided manga page image and detect all rectangular reading panels (frames/boxes) on the page.

Return a JSON object with a single key "panels" containing an array of bounding boxes in reading order (top-to-bottom, right-to-left or left-to-right as appropriate for manga/comic).

Each panel coordinate MUST be normalized to a 1000x1000 grid where the top-left corner is (0,0) and the bottom-right corner is (1000,1000).

Each panel object MUST have exactly these four integer properties:
- x: horizontal starting coordinate (0 to 1000)
- y: vertical starting coordinate (0 to 1000)
- width: width of the panel (0 to 1000)
- height: height of the panel (0 to 1000)

Example response format:
{"panels": [{"x": 50, "y": 50, "width": 400, "height": 300}, {"x": 480, "y": 50, "width": 470, "height": 300}]}

If no panels are detected, return: {"panels": []}
Output ONLY valid JSON. No explanations or markdown.`;
};

const getSmartColoringPrompt = (userPrompt = '') => {
  const basePrompt = 'masterpiece, best quality, highly detailed manga page coloring, vibrant anime colors, professional digital painting, clean shading';
  if (!userPrompt || !userPrompt.trim()) {
    return basePrompt;
  }
  return `${basePrompt}, ${userPrompt.trim()}`;
};

module.exports = {
  getPanelDetectionPrompt,
  getSmartColoringPrompt,
};
