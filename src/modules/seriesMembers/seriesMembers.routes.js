const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const v = require('./seriesMembers.validation');
const controller = require('./seriesMembers.controller');

router.get('/', authenticateToken, controller.listMembers);
router.get('/:seriesMemberId', authenticateToken, validate(v.memberIdParamSchema), controller.getMemberById);
router.post('/', authenticateToken, requireRole(['admin', 'mangaka']), validate(v.createMemberSchema), controller.addMember);
router.patch('/:seriesMemberId', authenticateToken, requireRole(['admin', 'mangaka']), validate(v.updateMemberSchema), controller.updateMember);
router.delete('/:seriesMemberId', authenticateToken, requireRole(['admin', 'mangaka']), validate(v.memberIdParamSchema), controller.removeMember);

module.exports = router;
