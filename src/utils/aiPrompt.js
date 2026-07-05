const getPanelDetectionPrompt = () => {
  return `You are an expert manga assistant specializing in computer vision and layout analysis.
Analyze the provided manga page image and detect all rectangular reading panels (frames/boxes) on the page.

Return a JSON object with a single key "panels" containing an array of bounding boxes in reading order (top-to-bottom, right-to-left or left-to-right as appropriate for manga/comic).

Each panel object MUST have exactly these four integer properties:
- x: horizontal starting coordinate of top-left corner
- y: vertical starting coordinate of top-left corner
- width: width of the panel in pixels
- height: height of the panel in pixels

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
