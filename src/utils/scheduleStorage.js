const fs = require('fs');
const path = require('path');

const SCHEDULE_FILE = path.join(__dirname, '../../../series_schedules.json');

const getSchedules = () => {
  try {
    if (fs.existsSync(SCHEDULE_FILE)) {
      return JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading schedules:', err);
  }
  return {};
};

const saveSchedules = (data) => {
  try {
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving schedules:', err);
  }
};

const getSeriesSchedule = (seriesId) => {
  const schedules = getSchedules();
  const entry = schedules[seriesId];
  if (entry && typeof entry === 'object') {
    return entry.schedule || 'Weekly';
  }
  return entry || 'Weekly';
};

const getSeriesProposedStartDate = (seriesId) => {
  const schedules = getSchedules();
  const entry = schedules[seriesId];
  if (entry && typeof entry === 'object') {
    return entry.proposedStartDate || null;
  }
  return null;
};

const setSeriesSchedule = (seriesId, schedule) => {
  if (!schedule) return;
  const schedules = getSchedules();
  const entry = schedules[seriesId];
  if (entry && typeof entry === 'object') {
    entry.schedule = schedule;
  } else {
    schedules[seriesId] = { schedule: schedule, proposedStartDate: null };
  }
  saveSchedules(schedules);
};

const setSeriesProposedStartDate = (seriesId, proposedStartDate) => {
  const schedules = getSchedules();
  const entry = schedules[seriesId];
  if (entry && typeof entry === 'object') {
    entry.proposedStartDate = proposedStartDate;
  } else {
    schedules[seriesId] = { schedule: typeof entry === 'string' ? entry : 'Weekly', proposedStartDate };
  }
  saveSchedules(schedules);
};

const getChapterExtension = (chapterId) => {
  const schedules = getSchedules();
  for (const seriesId in schedules) {
    const entry = schedules[seriesId];
    if (entry && entry.extensions && entry.extensions[chapterId]) {
      return entry.extensions[chapterId];
    }
  }
  return null;
};

const setChapterExtension = (seriesId, chapterId, extensionDateStr) => {
  const schedules = getSchedules();
  if (!schedules[seriesId]) {
    schedules[seriesId] = { schedule: 'Weekly', proposedStartDate: null };
  }
  if (!schedules[seriesId].extensions) {
    schedules[seriesId].extensions = {};
  }
  schedules[seriesId].extensions[chapterId] = extensionDateStr;
  saveSchedules(schedules);
};

module.exports = {
  getSeriesSchedule,
  setSeriesSchedule,
  getSeriesProposedStartDate,
  setSeriesProposedStartDate,
  getChapterExtension,
  setChapterExtension,
  getSchedules
};

