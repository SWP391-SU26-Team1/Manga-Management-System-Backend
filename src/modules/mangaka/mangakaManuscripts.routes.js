const express = require('express');
const router = express.Router({ mergeParams: true });
const { validate } = require('../../middlewares/validate.middleware');
const { z } = require('zod');
const ctrl = require('./mangakaManuscripts.controller');
const { requireSeriesMembership } = require('./mangaka.middleware');

const uuid = z.string().uuid();
const seriesP = z.object({ seriesId: uuid });
const manuscriptP = z.object({ seriesId: uuid, manuscriptId: uuid });
const fileP = z.object({ seriesId: uuid, manuscriptId: uuid, fileId: uuid });

const manuscriptBody = z.object({ title: z.string().min(1).max(255), description: z.string().optional(), version: z.string().max(50).optional() });
const fileBody = z.object({ file_url: z.string().url(), file_name: z.string().min(1).max(255), file_type: z.string().max(50).optional(), cloudinary_public_id: z.string().optional() });

router.use(requireSeriesMembership);

router.get('/', ctrl.listManuscripts);
router.get('/:manuscriptId', validate(z.object({ params: manuscriptP })), ctrl.getManuscriptById);
router.post('/', validate(z.object({ params: seriesP, body: manuscriptBody })), ctrl.createManuscript);
router.patch('/:manuscriptId', validate(z.object({ params: manuscriptP, body: manuscriptBody.partial() })), ctrl.updateManuscript);
router.patch('/:manuscriptId/submit', validate(z.object({ params: manuscriptP })), ctrl.workflow('submit'));
router.patch('/:manuscriptId/approve', validate(z.object({ params: manuscriptP })), ctrl.workflow('approve'));
router.patch('/:manuscriptId/reject', validate(z.object({ params: manuscriptP })), ctrl.workflow('reject'));
router.patch('/:manuscriptId/publish', validate(z.object({ params: manuscriptP })), ctrl.workflow('publish'));
router.patch('/:manuscriptId/archive', validate(z.object({ params: manuscriptP })), ctrl.workflow('archive'));
router.patch('/:manuscriptId/revise', validate(z.object({ params: manuscriptP })), ctrl.workflow('revise'));
router.patch('/:manuscriptId/withdraw', validate(z.object({ params: manuscriptP })), ctrl.workflow('withdraw'));
router.delete('/:manuscriptId', validate(z.object({ params: manuscriptP })), ctrl.deleteManuscript);

// Files
router.get('/:manuscriptId/files', validate(z.object({ params: manuscriptP })), ctrl.listFiles);
router.post('/:manuscriptId/files', validate(z.object({ params: manuscriptP, body: fileBody })), ctrl.addFile);
router.post('/:manuscriptId/files/bulk', validate(z.object({ params: manuscriptP, body: z.object({ files: z.array(fileBody).min(1) }) })), ctrl.bulkAddFiles);
router.patch('/:manuscriptId/files/:fileId', validate(z.object({ params: fileP, body: fileBody.partial() })), ctrl.updateFile);
router.delete('/:manuscriptId/files/:fileId', validate(z.object({ params: fileP })), ctrl.deleteFile);

module.exports = router;
