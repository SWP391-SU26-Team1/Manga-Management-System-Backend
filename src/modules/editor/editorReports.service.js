const editorMockStore = require('./editorMockStore');

const listReports = async ({ status } = {}) => editorMockStore.getReports({ status });

const createReport = async ({ title, type, content }) => editorMockStore.addReport({ title, type, content });

const updateReport = async (reportId, payload) => editorMockStore.updateReport(reportId, payload);

const submitReport = async (reportId) => editorMockStore.submitReport(reportId);

module.exports = { listReports, createReport, updateReport, submitReport };
