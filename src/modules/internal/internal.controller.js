const { createNotification, createNotifications } = require('../../utils/notification.helper');
const { sendSuccess } = require('../../utils/response');

const sendNotification = async (req, res, next) => {
  try {
    const { user_id, title, content, type } = req.body;
    await createNotification(user_id, title, content, type);
    return sendSuccess(res, 201, null, 'Notification sent');
  } catch (e) { next(e); }
};

const sendBulkNotifications = async (req, res, next) => {
  try {
    await createNotifications(req.body.notifications);
    return sendSuccess(res, 201, null, `${req.body.notifications.length} notifications sent`);
  } catch (e) { next(e); }
};

// Typed notification helpers — all delegate to sendNotification with a fixed type
const makeTypedHandler = (defaultType) => async (req, res, next) => {
  try {
    const { user_id, title, content } = req.body;
    await createNotification(user_id, title || defaultType.replace(/_/g, ' '), content, defaultType);
    return sendSuccess(res, 201, null, 'Notification sent');
  } catch (e) { next(e); }
};

const sendRankingWarning = async (req, res, next) => {
  try {
    const { user_ids, series_id, message } = req.body;
    const notifications = (user_ids || []).map((uid) => ({
      userId: uid,
      title: 'Ranking Risk Warning',
      content: message || `Series ${series_id} is at risk in ranking.`,
      type: 'ranking_warning',
    }));
    await createNotifications(notifications);
    return sendSuccess(res, 201, null, `${notifications.length} ranking warnings sent`);
  } catch (e) { next(e); }
};

module.exports = {
  sendNotification,
  sendBulkNotifications,
  sendTaskAssigned: makeTypedHandler('task_assigned'),
  sendTaskSubmitted: makeTypedHandler('task_submitted'),
  sendTaskUpdated: makeTypedHandler('task_updated'),
  sendTaskOverdue: makeTypedHandler('task_overdue'),
  sendFeedbackCreated: makeTypedHandler('feedback_created'),
  sendUserMentioned: makeTypedHandler('user_mentioned'),
  sendChapterPublished: makeTypedHandler('chapter_published'),
  sendManuscriptSubmitted: makeTypedHandler('manuscript_submitted'),
  sendDecisionResult: makeTypedHandler('decision_result'),
  sendRankingWarning,
};
