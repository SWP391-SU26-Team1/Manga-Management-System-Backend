const supabase = require('../../config/supabase');
const rankingPeriodsRepo = require('../rankingPeriods/rankingPeriods.repository');
const { createNotifications } = require('../../utils/notification.helper');
const AppError = require('../../utils/appError');

// --- Period CRUD ---
const listPeriods = async (filters) => {
  let query = supabase.from('ranking_period').select('*', { count: 'exact' });
  if (filters.status) query = query.eq('status', filters.status);
  query = query.order('start_date', { ascending: false }).range(filters.offset, filters.offset + filters.limit - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data, total: count };
};

const getPeriodById = async (periodId) => {
  const p = await rankingPeriodsRepo.findById(periodId);
  if (!p) throw new AppError('Ranking period not found', 404);
  return p;
};

const createPeriod = async (payload) => {
  return rankingPeriodsRepo.create({ ...payload, status: payload.status || 'pending' });
};

const updatePeriod = async (periodId, payload) => {
  return rankingPeriodsRepo.update(periodId, { ...payload, updated_at: new Date().toISOString() });
};

const updatePeriodStatus = async (periodId, status) => {
  return rankingPeriodsRepo.update(periodId, { status, updated_at: new Date().toISOString() });
};

const deletePeriod = async (periodId) => {
  await rankingPeriodsRepo.deleteById(periodId);
};

// --- Calculation ---
const calculateRankings = async (periodId) => {
  const period = await getPeriodById(periodId);

  // Get votes in period date range
  const { data: votes, error: vErr } = await supabase
    .from('vote')
    .select('session:session_id(series_id, chapter_id), score, status')
    .gte('created_at', period.start_date)
    .lte('created_at', period.end_date)
    .eq('status', 'submitted');
  if (vErr) throw vErr;

  // Aggregate by series
  const seriesScores = {};
  const chapterScores = {};
  for (const vote of votes || []) {
    const sid = vote.session?.series_id;
    const cid = vote.session?.chapter_id;
    if (sid) {
      if (!seriesScores[sid]) seriesScores[sid] = { total: 0, count: 0 };
      seriesScores[sid].total += vote.score || 0;
      seriesScores[sid].count++;
    }
    if (cid) {
      if (!chapterScores[cid]) chapterScores[cid] = { total: 0, count: 0 };
      chapterScores[cid].total += vote.score || 0;
      chapterScores[cid].count++;
    }
  }

  // Build series rankings
  const seriesRanked = Object.entries(seriesScores)
    .map(([sid, s]) => ({ series_id: sid, score: Math.round((s.total / s.count) * 10) / 10, total_vote: s.count }))
    .sort((a, b) => b.score - a.score)
    .map((item, idx) => ({ ...item, period_id: periodId, rank_position: idx + 1 }));

  const chapterRanked = Object.entries(chapterScores)
    .map(([cid, s]) => ({ chapter_id: cid, score: Math.round((s.total / s.count) * 10) / 10, total_vote: s.count }))
    .sort((a, b) => b.score - a.score)
    .map((item, idx) => ({ ...item, period_id: periodId, rank_position: idx + 1 }));

  // Upsert rankings
  if (seriesRanked.length) {
    await supabase.from('series_ranking').upsert(seriesRanked, { onConflict: 'series_id,period_id' });
  }
  if (chapterRanked.length) {
    await supabase.from('chapter_ranking').upsert(chapterRanked, { onConflict: 'chapter_id,period_id' });
  }

  await rankingPeriodsRepo.update(periodId, { status: 'completed', updated_at: new Date().toISOString() });

  return { period_id: periodId, series_ranked: seriesRanked.length, chapter_ranked: chapterRanked.length };
};

const getPeriodSummary = async (periodId) => {
  const [{ data: series }, { data: chapters }] = await Promise.all([
    supabase.from('series_ranking').select('*, series:series_id(title)').eq('period_id', periodId).order('rank_position').limit(10),
    supabase.from('chapter_ranking').select('*, chapter:chapter_id(title)').eq('period_id', periodId).order('rank_position').limit(10),
  ]);
  return { period_id: periodId, top_series: series || [], top_chapters: chapters || [] };
};

const getTopSeries = async (filters) => {
  // --- Tái cấu trúc theo yêu cầu: Lấy hạng Global theo Lượt đọc (view_count) ---
  if (filters.editorId) {
    // 1. Lấy tất cả series đã public xếp theo view_count
    const { data: allPublished, error: errAll } = await supabase
      .from('series')
      .select('series_id, title, status, genre, cover_image_url, view_count')
      .eq('status', 'published')
      .order('view_count', { ascending: false });
      
    if (errAll) throw errAll;
    if (!allPublished || allPublished.length === 0) return [];

    // Gán hạng Global
    allPublished.forEach((s, idx) => {
      s.global_rank = idx + 1;
    });

    // 2. Lọc ra những series do editor quản lý
    const { data: memberSeries } = await supabase
      .from('series_member')
      .select('series_id')
      .eq('user_id', filters.editorId)
      .eq('role_in_series', 'editor');
      
    const editorSeriesIds = memberSeries?.map(m => m.series_id) || [];
    if (editorSeriesIds.length === 0) return [];

    const editorSeries = allPublished.filter(s => editorSeriesIds.includes(s.series_id));
    if (editorSeries.length === 0) return [];

    // 3. Lấy thông tin Mangaka (owner) và Lượt thích
    const { data: members } = await supabase
      .from('series_member')
      .select('series_id, user:user_id(username, name)')
      .in('series_id', editorSeriesIds)
      .eq('role_in_series', 'owner');
      
    const ownerMap = {};
    (members || []).forEach(m => {
      if (m.user) ownerMap[m.series_id] = { username: m.user.username, fullName: m.user.name };
    });

    const { data: chaptersData } = await supabase
      .from('chapter')
      .select('series_id, chapter_like(count)')
      .in('series_id', editorSeriesIds);
      
    const seriesLikesMap = {};
    if (chaptersData) {
      for (const ch of chaptersData) {
        if (!seriesLikesMap[ch.series_id]) seriesLikesMap[ch.series_id] = 0;
        seriesLikesMap[ch.series_id] += ch.chapter_like?.length ? ch.chapter_like[0].count : 0;
      }
    }

    // 4. Trả về đúng format frontend cần
    return editorSeries.map(s => ({
      series_ranking_id: s.series_id,
      series_id: s.series_id,
      rank_position: s.global_rank, // Hạng trên bảng
      prev_rank: s.global_rank, // Khởi tạo prevRank = rank để ko bị lệch (-0)
      score: 0,
      series: {
        ...s,
        owner: ownerMap[s.series_id] || { username: '—' },
        like_count: seriesLikesMap[s.series_id] || 0
      }
    }));
  }

  // --- Logic cũ (cho các trang khác không truyền editorId) ---
  let query = supabase.from('series_ranking').select('*, series:series_id(series_id, title, status, genre, cover_image_url, view_count), ranking_period:period_id(name, start_date, end_date)');
  if (filters.periodId) query = query.eq('period_id', filters.periodId);
  if (filters.status) query = query.eq('series.status', filters.status);
  if (filters.genre) query = query.eq('series.genre', filters.genre);

  query = query.order('rank_position').limit(filters.limit || 20);
  const { data, error } = await query;
  if (error) throw error;

  if (!data || data.length === 0) return [];

  const seriesIds = data.map(r => r.series_id);
  const { data: members, error: memError } = await supabase
    .from('series_member')
    .select('series_id, user:user_id(username, name)')
    .in('series_id', seriesIds)
    .eq('role_in_series', 'owner');

  if (memError) {
    console.error("Error fetching series owners:", memError);
  }

  const ownerMap = {};
  (members || []).forEach(m => {
    if (m.user) {
      ownerMap[m.series_id] = {
        username: m.user.username,
        fullName: m.user.name
      };
    }
  });

  const { data: chaptersData } = await supabase
    .from('chapter')
    .select('series_id, chapter_like(count)')
    .in('series_id', seriesIds);

  const seriesLikesMap = {};
  if (chaptersData) {
    for (const ch of chaptersData) {
      if (!seriesLikesMap[ch.series_id]) seriesLikesMap[ch.series_id] = 0;
      const count = ch.chapter_like && ch.chapter_like.length > 0 ? ch.chapter_like[0].count : 0;
      seriesLikesMap[ch.series_id] += count;
    }
  }

  let prevPeriodId = null;
  if (data.length > 0 && data[0].ranking_period) {
    const currentStartDate = data[0].ranking_period.start_date;
    const { data: prevPeriods } = await supabase
      .from('ranking_period')
      .select('period_id')
      .lt('start_date', currentStartDate)
      .order('start_date', { ascending: false })
      .limit(1);
    if (prevPeriods && prevPeriods.length > 0) {
      prevPeriodId = prevPeriods[0].period_id;
    }
  }

  let prevRankMap = {};
  if (prevPeriodId && seriesIds.length > 0) {
    const { data: prevRankings } = await supabase
      .from('series_ranking')
      .select('series_id, rank_position')
      .eq('period_id', prevPeriodId)
      .in('series_id', seriesIds);
    if (prevRankings) {
      prevRankings.forEach(pr => {
        prevRankMap[pr.series_id] = pr.rank_position;
      });
    }
  }

  return data.map(r => {
    if (r.series) {
      r.series.owner = ownerMap[r.series_id] || { username: '—' };
      r.series.like_count = seriesLikesMap[r.series_id] || 0;
    }
    r.prev_rank = prevRankMap[r.series_id] || r.rank_position;
    return r;
  });
};

const getTopChapters = async (filters) => {
  let query = supabase.from('chapter_ranking').select('*, chapter:chapter_id(title, status), ranking_period:period_id(name)');
  if (filters.periodId) query = query.eq('period_id', filters.periodId);
  query = query.order('rank_position').limit(filters.limit || 20);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// --- History ---
const getSeriesHistory = async (seriesId) => {
  const { data, error } = await supabase.from('series_ranking').select('*, ranking_period:period_id(name, start_date, end_date)').eq('series_id', seriesId).order('rank_position');
  if (error) throw error;
  return data;
};

const getChapterHistory = async (chapterId) => {
  const { data, error } = await supabase.from('chapter_ranking').select('*, ranking_period:period_id(name, start_date, end_date)').eq('chapter_id', chapterId).order('rank_position');
  if (error) throw error;
  return data;
};

// --- Trend Analysis ---
const getSeriesTrend = async (seriesId) => {
  const history = await getSeriesHistory(seriesId);
  const trend = history.map((h, idx) => {
    const prev = history[idx - 1];
    return { period_id: h.period_id, period_name: h.ranking_period?.name, rank: h.rank_position, score: h.score, change: prev ? prev.rank_position - h.rank_position : 0 };
  });
  return { series_id: seriesId, trend };
};

const checkSeriesRisk = async (seriesId) => {
  const history = await getSeriesHistory(seriesId);
  const recent = history.slice(-3);
  const declining = recent.length >= 2 && recent.every((h, i) => i === 0 || h.rank_position > recent[i - 1].rank_position);
  const lowScore = recent.some((h) => h.score < 5);
  return { series_id: seriesId, at_risk: declining || lowScore, declining, low_score: lowScore, recent_rankings: recent };
};

const sendRiskWarning = async (seriesId) => {
  const risk = await checkSeriesRisk(seriesId);
  if (!risk.at_risk) return { sent: false, reason: 'Not at risk' };
  const { data: members } = await supabase.from('series_member').select('user_id').eq('series_id', seriesId);
  if (members?.length) {
    await createNotifications(members.map((m) => ({ userId: m.user_id, title: 'Ranking Risk Warning', content: `Series is at risk due to declining ranking.`, type: 'ranking_warning' })));
  }
  return { sent: true, notified: members?.length ?? 0 };
};

const checkRiskAll = async () => {
  const { data: series } = await supabase.from('series').select('series_id').eq('status', 'published');
  const results = await Promise.all((series || []).map((s) => checkSeriesRisk(s.series_id)));
  return results.filter((r) => r.at_risk);
};

module.exports = {
  listPeriods, getPeriodById, createPeriod, updatePeriod, updatePeriodStatus, deletePeriod,
  calculateRankings, getPeriodSummary,
  getTopSeries, getTopChapters,
  getSeriesHistory, getChapterHistory,
  getSeriesTrend, checkSeriesRisk, sendRiskWarning, checkRiskAll,
};
