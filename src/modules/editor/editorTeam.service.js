const editorMockStore = require("./editorMockStore");

const listTeam = async ({ role } = {}) => editorMockStore.getTeam({ role });

const createTeamMember = async ({
  user_id,
  name,
  role,
  series_id,
  workload,
  next_deadline,
}) =>
  editorMockStore.addTeamMember({
    user_id,
    name,
    role,
    series_id,
    workload,
    next_deadline,
  });

const updateTeamMember = async (userId, payload) =>
  editorMockStore.updateTeamMember(userId, payload);

const deleteTeamMember = async (userId) =>
  editorMockStore.removeTeamMember(userId);

const nudgeTeamMember = async (userId) =>
  editorMockStore.nudgeTeamMember(userId);

const createMeeting = async ({ user_id, meeting_date, meeting_time, notes }) =>
  editorMockStore.addMeeting({ user_id, meeting_date, meeting_time, notes });

module.exports = {
  listTeam,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  nudgeTeamMember,
  createMeeting,
};
