const aiRepo = require('./ai.repository');
const pagesRepo = require('../pages/pages.repository');
const pageVersionsRepo = require('../pageVersions/pageVersions.repository');
const pageTasksRepo = require('../pageTasks/pageTasks.repository');
const chaptersRepo = require('../chapters/chapters.repository');
const seriesRepo = require('../series/series.repository');
const groqProvider = require('../../providers/groq.provider');
const hfProvider = require('../../providers/huggingface.provider');
const cloudinaryProvider = require('../../providers/cloudinary.provider');
const { getPanelDetectionPrompt, getSmartColoringPrompt } = require('../../utils/aiPrompt');
const AppError = require('../../utils/appError');

const runPanelDetectionJob = async (suggestionId, imageUrl, customPrompt, customModel) => {
  const startTime = Date.now();
  try {
    const prompt = customPrompt || getPanelDetectionPrompt();
    const panels = await groqProvider.detectPanels(imageUrl, prompt);
    const processingTimeMs = Date.now() - startTime;

    await aiRepo.updateCompleted(suggestionId, {
      resultData: { panels },
      processingTimeMs,
      aiModel: customModel || process.env.GROQ_VISION_MODEL || 'llama-3.2-11b-vision-preview',
    });
  } catch (err) {
    const processingTimeMs = Date.now() - startTime;
    console.error(`❌ Panel Detection Background Job Failed (ID: ${suggestionId}):`, err.message || err);
    await aiRepo.updateFailed(suggestionId, {
      errorMessage: err.message || 'Panel detection failed during AI processing',
      processingTimeMs,
    });
  }
};

const runSmartColoringJob = async (suggestionId, imageUrl, customPrompt, customModel, taskContent, mangaContext = {}) => {
  const startTime = Date.now();
  try {
    // 1. Expand the prompt using Groq LLM (passing metadata context)
    console.log(`[AI Service] Expanding prompt. Custom Prompt: "${customPrompt || ''}", Task Content: "${taskContent || ''}", Context: ${JSON.stringify(mangaContext)}`);
    const expandedPrompt = await groqProvider.expandColoringPrompt(customPrompt, taskContent, mangaContext);
    const prompt = getSmartColoringPrompt(expandedPrompt);

    // 2. Generate coloring
    const imageBuffer = await hfProvider.generateColoring(imageUrl, prompt, customModel);
    const uploadResult = await cloudinaryProvider.uploadAIImage(imageBuffer, 'manga-ai-suggestions');
    const processingTimeMs = Date.now() - startTime;

    // 3. Save completed job and update the prompt to the expanded prompt
    await aiRepo.updateCompleted(suggestionId, {
      resultData: {
        type: 'smart_coloring',
        image_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      },
      processingTimeMs,
      aiModel: customModel || process.env.HF_COLORING_MODEL || 'black-forest-labs/FLUX.1-schnell',
      prompt: expandedPrompt,
    });
  } catch (err) {
    const processingTimeMs = Date.now() - startTime;
    console.error(`❌ Smart Coloring Background Job Failed (ID: ${suggestionId}):`, err.message || err);
    await aiRepo.updateFailed(suggestionId, {
      errorMessage: err.message || 'Smart coloring failed during AI processing or image upload',
      processingTimeMs,
    });
  }
};

const createPanelDetection = async (pageId, userId, { prompt, ai_model } = {}) => {
  const page = await pagesRepo.findById(pageId);
  if (!page) {
    throw new AppError('Page not found', 404);
  }

  const versions = await pageVersionsRepo.findByPageId(pageId);
  if (!versions || versions.length === 0) {
    throw new AppError('No image version found for this page to perform panel detection', 400);
  }

  const latestVersion = versions[versions.length - 1];
  const imageUrl = latestVersion.image_url;
  if (!imageUrl) {
    throw new AppError('Latest page version has no valid image URL', 400);
  }

  const attemptNumber = (await aiRepo.countAttemptsByPage(pageId)) + 1;

  const suggestion = await aiRepo.create({
    page_id: pageId,
    requested_by_id: userId,
    attempt_number: attemptNumber,
    status: 'processing',
    prompt: prompt || getPanelDetectionPrompt(),
    reference_image_url: imageUrl,
    ai_model: ai_model || process.env.GROQ_VISION_MODEL || 'llama-3.2-11b-vision-preview',
  });

  // Trigger background job asynchronously (non-blocking)
  runPanelDetectionJob(suggestion.suggestion_id, imageUrl, prompt, ai_model).catch((err) => {
    console.error('❌ Unhandled error in runPanelDetectionJob:', err);
  });

  return suggestion;
};

const createSmartColoring = async (taskId, userId, userRole, { prompt, ai_model, reference_image_url } = {}) => {
  const task = await pageTasksRepo.findById(taskId);
  if (!task) {
    throw new AppError('Page task not found', 404);
  }

  if (userRole === 'assistant' && task.assistant_id !== userId) {
    throw new AppError('You are not assigned to this task', 403);
  }

  let imageUrl = reference_image_url;
  if (!imageUrl) {
    const versions = await pageVersionsRepo.findByPageId(task.page_id);
    if (versions && versions.length > 0) {
      imageUrl = versions[versions.length - 1].image_url;
    }
  }

  if (!imageUrl) {
    throw new AppError('No reference image URL found or provided for smart coloring', 400);
  }

  const attemptNumber = (await aiRepo.countAttemptsByTask(taskId)) + 1;

  // Retrieve rich metadata context about this manga page for the AI pre-processor
  let seriesTitle = '';
  let seriesGenre = '';
  let chapterTitle = '';
  try {
    const page = await pagesRepo.findById(task.page_id);
    if (page && page.chapter_id) {
      const chapter = await chaptersRepo.findById(page.chapter_id);
      if (chapter) {
        chapterTitle = chapter.title || '';
        if (chapter.series_id) {
          const series = await seriesRepo.findById(chapter.series_id);
          if (series) {
            seriesTitle = series.title || '';
            seriesGenre = series.genre || '';
          }
        }
      }
    }
  } catch (err) {
    console.error('[AI Service] Failed to retrieve series/chapter metadata context for smart coloring:', err.message);
  }

  const suggestion = await aiRepo.create({
    page_id: task.page_id,
    task_id: taskId,
    region_id: task.region_id || null,
    requested_by_id: userId,
    attempt_number: attemptNumber,
    status: 'processing',
    prompt: prompt || getSmartColoringPrompt(),
    reference_image_url: imageUrl,
    ai_model: ai_model || process.env.HF_COLORING_MODEL || 'stabilityai/stable-diffusion-3-medium-diffusers',
  });

  // Trigger background job asynchronously (non-blocking) with metadata context
  runSmartColoringJob(suggestion.suggestion_id, imageUrl, prompt, ai_model, task.content, {
    seriesTitle,
    seriesGenre,
    chapterTitle
  }).catch((err) => {
    console.error('❌ Unhandled error in runSmartColoringJob:', err);
  });

  return suggestion;
};

const getSuggestionById = async (suggestionId) => {
  const suggestion = await aiRepo.findByIdWithDetail(suggestionId);
  if (!suggestion) {
    throw new AppError('AI suggestion not found', 404);
  }
  return suggestion;
};

const rejectSuggestion = async (suggestionId, userId, userRole) => {
  const suggestion = await aiRepo.findById(suggestionId);
  if (!suggestion) {
    throw new AppError('AI suggestion not found', 404);
  }

  if (userRole !== 'admin' && suggestion.requested_by_id !== userId) {
    throw new AppError('You do not have permission to reject this AI suggestion', 403);
  }

  if (suggestion.status === 'applied') {
    throw new AppError('Cannot reject an AI suggestion that has already been applied', 400);
  }

  return aiRepo.reject(suggestionId);
};

const cleanupOldSuggestions = async (daysOld = 7) => {
  console.log(`🧹 Starting AI cleanup job for failed/rejected suggestions older than ${daysOld} days...`);
  const oldItems = await aiRepo.findOldFailedOrRejected(daysOld);
  let count = 0;

  for (const item of oldItems) {
    const publicId = item.result_data?.public_id || item.result_data?.image_url;
    if (publicId) {
      try {
        await cloudinaryProvider.deleteAIImage(publicId);
        count++;
      } catch (err) {
        console.error(`⚠️ Failed to delete Cloudinary image for suggestion ${item.suggestion_id}:`, err.message);
      }
    }
  }

  console.log(`✅ AI cleanup job completed. Deleted ${count} orphaned images from Cloudinary.`);
  return { deletedCount: count, totalChecked: oldItems.length };
};

module.exports = {
  createPanelDetection,
  createSmartColoring,
  getSuggestionById,
  rejectSuggestion,
  cleanupOldSuggestions,
};
