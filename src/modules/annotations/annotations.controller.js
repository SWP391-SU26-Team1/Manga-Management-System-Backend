const service = require('./annotations.service');
const { sendSuccess } = require('../../utils/response');

const listAnnotations = async (req, res, next) => {
  try {
    const pageId = req.params.pageId;
    const taskId = req.params.taskId;
    const data = await service.listAnnotations({ pageId, taskId });
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const getAnnotationById = async (req, res, next) => {
  try {
    const data = await service.getAnnotationById(req.params.annotationId);
    return sendSuccess(res, 200, data, 'Success');
  } catch (error) { next(error); }
};

const createAnnotation = async (req, res, next) => {
  try {
    const payload = req.params.pageId ? { ...req.body, page_id: req.params.pageId } : req.body;
    const data = await service.createAnnotation(payload);
    return sendSuccess(res, 201, data, 'Annotation created');
  } catch (error) { next(error); }
};

const updateAnnotation = async (req, res, next) => {
  try {
    const data = await service.updateAnnotation(req.params.annotationId, req.body);
    return sendSuccess(res, 200, data, 'Annotation updated');
  } catch (error) { next(error); }
};

const updateAnnotationStatus = async (req, res, next) => {
  try {
    const data = await service.updateAnnotationStatus(req.params.annotationId, req.body.status);
    return sendSuccess(res, 200, data, 'Status updated');
  } catch (error) { next(error); }
};

const deleteAnnotation = async (req, res, next) => {
  try {
    await service.deleteAnnotation(req.params.annotationId);
    return sendSuccess(res, 200, null, 'Annotation deleted');
  } catch (error) { next(error); }
};

module.exports = { listAnnotations, getAnnotationById, createAnnotation, updateAnnotation, updateAnnotationStatus, deleteAnnotation };
