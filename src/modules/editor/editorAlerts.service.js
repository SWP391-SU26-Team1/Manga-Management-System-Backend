const editorMockStore = require("./editorMockStore");

const listAlerts = async ({ type } = {}) => editorMockStore.getAlerts({ type });

const resolveAlert = async (alertId) => editorMockStore.resolveAlert(alertId);

module.exports = { listAlerts, resolveAlert };
