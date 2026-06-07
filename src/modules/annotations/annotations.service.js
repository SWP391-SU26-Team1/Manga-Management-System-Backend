const annotationsRepo = require('./annotations.repository');
const pagesRepo = require('../pages/pages.repository');
const regionsRepo = require('../pageRegions/pageRegions.repository');
const tasksRepo = require('../pageTasks/pageTasks.repository');
const usersRepo = require('../users/users.repository');
const AppError = require('../../utils/appError');

const listAnnotations = async (filters) => annotationsRepo.findAll(filters);

const getAnnotationById = async (annotationId) => {
  const annotation = await annotationsRepo.findById(annotationId);
  if (!annotation) throw new AppError('Annotation not found', 404);
  return annotation;
};

const createAnnotation = async (payload) => {
  const pageExists = await pagesRepo.existsById(payload.page_id);
  if (!pageExists) throw new AppError('Page not found', 404);

  const userExists = await usersRepo.existsById(payload.user_id);
  if (!userExists) throw new AppError('User not found', 404);

  if (payload.region_id) {
    const belongs = await regionsRepo.existsByIdAndPageId(payload.region_id, payload.page_id);
    if (!belongs) throw new AppError('Region does not belong to this page', 400);
  }

  if (payload.task_id) {
    const task = await tasksRepo.findById(payload.task_id);
    if (!task) throw new AppError('Task not found', 404);
    if (task.page_id !== payload.page_id) throw new AppError('Task does not belong to this page', 400);
  }

  return annotationsRepo.create(payload);
};

const updateAnnotation = async (annotationId, payload) => {
  const annotation = await annotationsRepo.findById(annotationId);
  if (!annotation) throw new AppError('Annotation not found', 404);
  return annotationsRepo.update(annotationId, { ...payload, updated_at: new Date().toISOString() });
};

const updateAnnotationStatus = async (annotationId, status) => {
  const annotation = await annotationsRepo.findById(annotationId);
  if (!annotation) throw new AppError('Annotation not found', 404);
  return annotationsRepo.update(annotationId, { status, updated_at: new Date().toISOString() });
};

const deleteAnnotation = async (annotationId) => {
  const annotation = await annotationsRepo.findById(annotationId);
  if (!annotation) throw new AppError('Annotation not found', 404);
  await annotationsRepo.deleteById(annotationId);
};

module.exports = { listAnnotations, getAnnotationById, createAnnotation, updateAnnotation, updateAnnotationStatus, deleteAnnotation };
