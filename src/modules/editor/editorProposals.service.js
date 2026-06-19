const editorMockStore = require("./editorMockStore");

const listProposals = async ({ type } = {}) =>
  editorMockStore.getProposals({ type });

const createProposal = async (payload) => editorMockStore.addProposal(payload);

module.exports = { listProposals, createProposal };
