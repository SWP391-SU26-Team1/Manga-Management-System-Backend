const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const v = require('./votes.validation');
const controller = require('./votes.controller');

/**
 * @swagger
 * /api/votes:
 *   get:
 *     tags: [Votes]
 *     summary: List votes (also nested under /api/review-sessions/:sessionId/votes and /api/users/:userId/votes)
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: List of votes }
 *   post:
 *     tags: [Votes]
 *     summary: Cast a vote (reviewer, editor, admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, score]
 *             properties:
 *               sessionId: { type: string }
 *               score: { type: integer, minimum: 1, maximum: 10, example: 8 }
 *               comment: { type: string }
 *     responses:
 *       201: { description: Vote cast }
 *
 * /api/votes/{voteId}:
 *   get:
 *     tags: [Votes]
 *     summary: Get vote by ID
 *     parameters:
 *       - in: path
 *         name: voteId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Vote data }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Votes]
 *     summary: Update vote
 *     parameters:
 *       - in: path
 *         name: voteId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score: { type: integer }
 *               comment: { type: string }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Votes]
 *     summary: Delete vote (editor, admin)
 *     parameters:
 *       - in: path
 *         name: voteId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *
 * /api/votes/{voteId}/status:
 *   patch:
 *     tags: [Votes]
 *     summary: Update vote status (editor, admin)
 *     parameters:
 *       - in: path
 *         name: voteId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [active, retracted, invalid] }
 *     responses:
 *       200: { description: Status updated }
 */
router.get('/', authenticateToken, controller.listVotes);
router.get('/:voteId', authenticateToken, validate(v.voteIdParamSchema), controller.getVoteById);
router.post('/', authenticateToken, requireRole(['admin', 'reviewer', 'editor']), validate(v.createVoteSchema), controller.createVote);
router.patch('/:voteId', authenticateToken, validate(v.updateVoteSchema), controller.updateVote);
router.patch('/:voteId/status', authenticateToken, requireRole(['admin', 'editor']), validate(v.updateVoteStatusSchema), controller.updateVoteStatus);
router.delete('/:voteId', authenticateToken, requireRole(['admin', 'editor']), validate(v.voteIdParamSchema), controller.deleteVote);

module.exports = router;
