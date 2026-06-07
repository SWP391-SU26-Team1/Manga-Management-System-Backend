const annotationsRepo = require('../annotations/annotations.repository');
const { sendSuccess } = require('../../utils/response');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const supabase = require('../../config/supabase');
const AppError = require('../../utils/appError');

const listAnnotations = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, error, count } = await supabase
      .from('annotation')
      .select('*', { count: 'exact' })
      .eq('page_id', req.params.pageId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return res.status(200).json({ success: true, message: 'Success', data, pagination: buildPaginationMeta(page, limit, count) });
  } catch (e) { next(e); }
};

const getAnnotationById = async (req, res, next) => {
  try {
    const annotation = await annotationsRepo.findById(req.params.annotationId);
    if (!annotation || annotation.page_id !== req.params.pageId) return next(new AppError('Annotation not found', 404));
    return sendSuccess(res, 200, annotation, 'Success');
  } catch (e) { next(e); }
};

const createAnnotation = async (req, res, next) => {
  try {
    const data = await annotationsRepo.create({ ...req.body, page_id: req.params.pageId, created_by: req.user.user_id });
    return sendSuccess(res, 201, data, 'Annotation created');
  } catch (e) { next(e); }
};

const updateAnnotation = async (req, res, next) => {
  try {
    const annotation = await annotationsRepo.findById(req.params.annotationId);
    if (!annotation || annotation.page_id !== req.params.pageId) return next(new AppError('Annotation not found', 404));
    const data = await annotationsRepo.update(req.params.annotationId, { ...req.body, updated_at: new Date().toISOString() });
    return sendSuccess(res, 200, data, 'Annotation updated');
  } catch (e) { next(e); }
};

const deleteAnnotation = async (req, res, next) => {
  try {
    const annotation = await annotationsRepo.findById(req.params.annotationId);
    if (!annotation || annotation.page_id !== req.params.pageId) return next(new AppError('Annotation not found', 404));
    await annotationsRepo.deleteById(req.params.annotationId);
    return sendSuccess(res, 200, null, 'Annotation deleted');
  } catch (e) { next(e); }
};

module.exports = { listAnnotations, getAnnotationById, createAnnotation, updateAnnotation, deleteAnnotation };
