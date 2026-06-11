const USER_STATUS = ["active", "suspended", "banned", "inactive"];
const USER_ROLES = [
  "admin",
  "mangaka",
  "assistant",
  "editor",
  "board",
  "reviewer",
  "reader",
];
// Roles allowed to self-register (excludes privileged roles assigned by admin)
const SELF_REGISTER_ROLES = ["mangaka", "assistant"];

const SERIES_STATUS = [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "published",
  "archived",
  "hidden",
  "banned",
  "deleted",
];
const CHAPTER_STATUS = [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "published",
  "archived",
  "hidden",
  "banned",
  "deleted",
];
const PAGE_STATUS = [
  "draft",
  "in_progress",
  "review",
  "completed",
  "published",
  "archived",
  "hidden",
  "banned",
  "deleted",
];

const PAGE_TASK_STATUS = [
  "pending",
  "assigned",
  "in_progress",
  "submitted",
  "review",
  "approved",
  "needs_revision",
  "completed",
  "on_hold",
  "cancelled",
  "rejected",
];
const ANNOTATION_STATUS = ["active", "resolved", "closed", "archived"];

const PAGE_SUBMISSION_STATUS = [
  "pending",
  "approved",
  "rejected",
  "needs_revision",
];

const REVIEW_SESSION_STATUS = [
  "pending",
  "in_progress",
  "completed",
  "finished",
  "paused",
  "cancelled",
];
const VOTE_STATUS = ["submitted", "verified"];

const MANUSCRIPT_STATUS = [
  "draft",
  "submitted",
  "in_review",
  "needs_revision",
  "approved",
  "published",
  "archived",
  "hidden",
  "rejected",
  "deleted",
];
const MANUSCRIPT_FILE_STATUS = ["uploaded", "validated", "deleted"];

const RANKING_PERIOD_STATUS = [
  "pending",
  "calculating",
  "completed",
  "archived",
];

module.exports = {
  USER_STATUS,
  USER_ROLES,
  SELF_REGISTER_ROLES,
  SERIES_STATUS,
  CHAPTER_STATUS,
  PAGE_STATUS,
  PAGE_TASK_STATUS,
  ANNOTATION_STATUS,
  PAGE_SUBMISSION_STATUS,
  REVIEW_SESSION_STATUS,
  VOTE_STATUS,
  MANUSCRIPT_STATUS,
  MANUSCRIPT_FILE_STATUS,
  RANKING_PERIOD_STATUS,
};
