const express = require('express');
const router = express.Router();
const { validate } = require('../../middlewares/validate.middleware');
const { z } = require('zod');
const { SERIES_STATUS } = require('../../constants/status');
const ctrl = require('./mangakaSeries.controller');

const uuid = z.string().uuid();

const createSchema = z.object({ body: z.object({ title: z.string().min(1).max(255), description: z.string().optional(), cover_image_url: z.string().url().optional(), genre: z.string().max(100).optional(), status: z.enum(SERIES_STATUS).default('draft') }) });
const updateSchema = z.object({ params: z.object({ seriesId: uuid }), body: z.object({ title: z.string().min(1).max(255).optional(), description: z.string().optional(), cover_image_url: z.string().url().optional(), genre: z.string().max(100).optional() }) });
const statusSchema = z.object({ params: z.object({ seriesId: uuid }), body: z.object({ status: z.enum(SERIES_STATUS) }) });
const idSchema = z.object({ params: z.object({ seriesId: uuid }) });
const memberSchema = z.object({ params: z.object({ seriesId: uuid }), body: z.object({ user_id: uuid, role_in_series: z.string().min(1).max(50) }) });
const updateMemberSchema = z.object({ params: z.object({ seriesId: uuid, seriesMemberId: uuid }), body: z.object({ role_in_series: z.string().min(1).max(50) }) });
const memberIdSchema = z.object({ params: z.object({ seriesId: uuid, seriesMemberId: uuid }) });

// Series CRUD
router.get('/', ctrl.listMySeries);
router.get('/:seriesId', validate(idSchema), ctrl.getSeriesById);
router.get('/:seriesId/detail', validate(idSchema), ctrl.getSeriesDetail);
router.post('/', validate(createSchema), ctrl.createSeries);
router.patch('/:seriesId', validate(updateSchema), ctrl.updateSeries);
router.patch('/:seriesId/status', validate(statusSchema), ctrl.updateSeriesStatus);
router.delete('/:seriesId', validate(idSchema), ctrl.deleteSeries);

// Workflow
router.patch('/:seriesId/submit-review', validate(idSchema), ctrl.workflow('submit-review'));
router.patch('/:seriesId/publish', validate(idSchema), ctrl.workflow('publish'));
router.patch('/:seriesId/hide', validate(idSchema), ctrl.workflow('hide'));
router.patch('/:seriesId/archive', validate(idSchema), ctrl.workflow('archive'));
router.patch('/:seriesId/republish', validate(idSchema), ctrl.workflow('republish'));

// Members
router.get('/:seriesId/members', validate(idSchema), ctrl.listMembers);
router.post('/:seriesId/members', validate(memberSchema), ctrl.addMember);
router.patch('/:seriesId/members/:seriesMemberId', validate(updateMemberSchema), ctrl.updateMember);
router.delete('/:seriesId/members/:seriesMemberId', validate(memberIdSchema), ctrl.removeMember);

module.exports = router;
