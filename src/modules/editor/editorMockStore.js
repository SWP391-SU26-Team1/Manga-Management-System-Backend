const { randomUUID } = require("crypto");

const now = () => new Date().toISOString();

const state = {
  alerts: [
    {
      alert_id: "00000000-0000-4000-8000-000000000001",
      type: "HIGH",
      title: "Cảnh báo Tiến độ Bản thảo",
      series_id: "e6ea07e5-9123-47ff-8a32-0378d900d7d0",
      series_title: "Tăng nhân và Tên trộm",
      detail:
        "Bản thảo của chương mới đang có dấu hiệu trễ so với lịch trình dự kiến. Cần gửi nhắc nhở cho Mangaka.",
      time: now(),
      action: "Gửi Nhắc Nhở",
      action_path: "/dashboard/tantou-editor/series-defense?tab=deadline&series=Tăng nhân và Tên trộm",
      is_resolved: false,
    }
  ],
  reports: [
    {
      report_id: "00000000-0000-4000-8000-000000000101",
      title: "Báo cáo Tổng kết Tháng 5/2026",
      type: "MONTHLY",
      status: "DRAFT",
      created_at: "2026-05-31T10:00:00.000Z",
      updated_at: "2026-05-31T10:00:00.000Z",
      series_count: 5,
      content:
        "Đã tổng hợp điểm mạnh và điểm yếu của các series trong tháng 5.",
    },
    {
      report_id: "00000000-0000-4000-8000-000000000102",
      title: "Đánh giá Chương 12 - Long Kiếm",
      type: "CHAPTER",
      status: "PENDING_REVIEW",
      created_at: "2026-06-08T14:15:00.000Z",
      updated_at: "2026-06-08T14:15:00.000Z",
      series_count: 1,
      content:
        "Cần nâng cao chất lượng hình ảnh và gia tăng tempo cho chương 12.",
    },
    {
      report_id: "00000000-0000-4000-8000-000000000103",
      title: "Cảnh báo giảm hạng tập trung",
      type: "ALERT",
      status: "APPROVED",
      created_at: "2026-06-05T09:30:00.000Z",
      updated_at: "2026-06-06T11:20:00.000Z",
      series_count: 3,
      content: "Đề nghị xem xét bảo vệ các series có xếp hạng giảm đột ngột.",
    },
  ],
  proposals: [],
  team: [
    {
      user_id: "00000000-0000-4000-8000-000000000301",
      name: "Trần Anh",
      role: "Mangaka",
      series_title: "Huyền Thoại Kiếm Vũ",
      series_id: "11111111-1111-4111-8111-111111111111",
      status: "ACTIVE",
      workload: 72,
      next_deadline: "2026-06-22T18:00:00.000Z",
      avatar_url: null,
      performance_score: 88,
    },
    {
      user_id: "00000000-0000-4000-8000-000000000302",
      name: "Nguyễn Mai",
      role: "Assistant",
      series_title: "Ngọc Long Ký",
      series_id: "22222222-2222-4222-8222-222222222222",
      status: "WARNING",
      workload: 85,
      next_deadline: "2026-06-19T12:00:00.000Z",
      avatar_url: null,
      performance_score: 76,
    },
  ],
  meetings: [],
};

const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, 'editor_mock_db.json');

const loadState = () => {
  if (fs.existsSync(DB_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      Object.assign(state, data);
    } catch (e) {
      console.error('Error loading mock db:', e);
    }
  }
};

const saveState = () => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('Error saving mock db:', e);
  }
};

loadState();

const getAlerts = ({ type } = {}) => {
  const items = state.alerts;
  return type ? items.filter((alert) => alert.type === type) : items;
};

const resolveAlert = (alertId) => {
  const alert = state.alerts.find((item) => item.alert_id === alertId);
  if (!alert) return null;
  alert.is_resolved = true;
  saveState();
  return alert;
};

const getReports = ({ status } = {}) => {
  const items = state.reports;
  return status ? items.filter((report) => report.status === status) : items;
};

const addReport = ({ title, type, content }) => {
  const report = {
    report_id: randomUUID(),
    title,
    type,
    status: "DRAFT",
    created_at: now(),
    updated_at: now(),
    series_count: 0,
    content,
  };
  state.reports.unshift(report);
  saveState();
  return report;
};

const updateReport = (reportId, payload) => {
  const report = state.reports.find((item) => item.report_id === reportId);
  if (!report) return null;
  if (payload.title !== undefined) report.title = payload.title;
  if (payload.content !== undefined) report.content = payload.content;
  if (payload.status !== undefined) report.status = payload.status;
  report.updated_at = now();
  saveState();
  return report;
};

const submitReport = (reportId) => {
  const report = state.reports.find((item) => item.report_id === reportId);
  if (!report) return null;
  report.status = "PENDING_REVIEW";
  report.updated_at = now();
  saveState();
  return report;
};

const getProposals = ({ type } = {}) => {
  const items = state.proposals;
  return type ? items.filter((proposal) => proposal.type === type) : items;
};

const addProposal = ({ type, series_title, details, metadata }) => {
  const proposal = {
    proposal_id: randomUUID(),
    type,
    series_title,
    details,
    status: "PENDING",
    created_at: now(),
    metadata,
    rejection_reason: null,
  };
  state.proposals.unshift(proposal);
  saveState();
  return proposal;
};

const updateProposalStatusBySeriesTitle = (seriesTitle, type, status) => {
  const proposal = state.proposals.find(p => p.series_title === seriesTitle && p.type === type && p.status === 'PENDING');
  if (proposal) {
    proposal.status = status;
    saveState();
    return proposal;
  }
  return null;
};

const deleteProposalsBySeriesTitle = (seriesTitle, type) => {
  state.proposals = state.proposals.filter(p => !(p.series_title === seriesTitle && p.type === type));
  saveState();
};

const getTeam = ({ role } = {}) => {
  const items = state.team;
  return role ? items.filter((member) => member.role === role) : items;
};

const addTeamMember = ({
  user_id,
  name,
  role,
  series_id,
  workload,
  next_deadline,
}) => {
  const member = {
    user_id: user_id || randomUUID(),
    name,
    role,
    series_title: `Series ${series_id.slice(0, 8)}`,
    series_id,
    status: "ACTIVE",
    workload,
    next_deadline,
    avatar_url: null,
    performance_score: Math.min(
      100,
      Math.max(0, 60 + Math.floor(Math.random() * 30)),
    ),
  };
  state.team.unshift(member);
  saveState();
  return member;
};

const updateTeamMember = (userId, payload) => {
  const member = state.team.find((item) => item.user_id === userId);
  if (!member) return null;
  if (payload.role !== undefined) member.role = payload.role;
  if (payload.series_id !== undefined) {
    member.series_id = payload.series_id;
    member.series_title = `Series ${payload.series_id.slice(0, 8)}`;
  }
  if (payload.status !== undefined) member.status = payload.status;
  if (payload.workload !== undefined) member.workload = payload.workload;
  if (payload.next_deadline !== undefined)
    member.next_deadline = payload.next_deadline;
  saveState();
  return member;
};

const removeTeamMember = (userId) => {
  const index = state.team.findIndex((item) => item.user_id === userId);
  if (index === -1) return false;
  state.team.splice(index, 1);
  saveState();
  return true;
};

const nudgeTeamMember = (userId) => {
  const member = state.team.find((item) => item.user_id === userId);
  if (!member) return null;
  return { user_id: member.user_id, nudged_at: now() };
};

const addMeeting = ({ user_id, meeting_date, meeting_time, notes }) => {
  const meeting = {
    meeting_id: randomUUID(),
    user_id,
    meeting_date,
    meeting_time,
    notes: notes || null,
    created_at: now(),
  };
  state.meetings.unshift(meeting);
  saveState();
  return meeting;
};

module.exports = {
  getAlerts,
  resolveAlert,
  getReports,
  addReport,
  updateReport,
  submitReport,
  getProposals,
  addProposal,
  getTeam,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  nudgeTeamMember,
  addMeeting,
  updateProposalStatusBySeriesTitle,
  deleteProposalsBySeriesTitle,
};
 
