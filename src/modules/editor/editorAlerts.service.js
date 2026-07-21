const supabase = require("../../config/supabase");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const scheduleStorage = require("../../utils/scheduleStorage");

// Local file to store resolved alerts for the prototype
const RESOLVED_ALERTS_FILE = path.join(__dirname, "../../../../resolved_alerts.json");

const getResolvedAlerts = () => {
  try {
    if (fs.existsSync(RESOLVED_ALERTS_FILE)) {
      return JSON.parse(fs.readFileSync(RESOLVED_ALERTS_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Error reading resolved alerts:", err);
  }
  return {};
};

const saveResolvedAlerts = (data) => {
  try {
    fs.writeFileSync(RESOLVED_ALERTS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error saving resolved alerts:", err);
  }
};

const resolveAlert = async (alertId, editorId) => {
  const resolved = getResolvedAlerts();
  if (!resolved[editorId]) resolved[editorId] = [];
  if (!resolved[editorId].includes(alertId)) {
    resolved[editorId].push(alertId);
    saveResolvedAlerts(resolved);
  }

  // Delete the notification associated with this alert for the Editor
  try {
    await supabase
      .from('notification')
      .delete()
      .eq('user_id', editorId)
      .eq('type', alertId);
    console.log(`Deleted notification for resolved alert: ${alertId}`);
  } catch (e) {
    console.error(`Error deleting notification on resolveAlert:`, e.message);
  }

  // ALSO delete the corresponding warning notification on the Mangaka's side!
  try {
    let seriesId = null;
    if (alertId.startsWith("rank_drop_")) {
      seriesId = alertId.replace("rank_drop_", "");
    } else if (alertId.startsWith("task_overdue_")) {
      const taskId = alertId.replace("task_overdue_", "");
      const { data: taskData } = await supabase
        .from('page_task')
        .select('page_id')
        .eq('task_id', taskId)
        .single();
      if (taskData?.page_id) {
        const { data: pageData } = await supabase
          .from('page')
          .select('chapter_id')
          .eq('page_id', taskData.page_id)
          .single();
        if (pageData?.chapter_id) {
          const { data: chapData } = await supabase
            .from('chapter')
            .select('series_id')
            .eq('chapter_id', pageData.chapter_id)
            .single();
          if (chapData?.series_id) {
            seriesId = chapData.series_id;
          }
        }
      }
    } else if (alertId.startsWith("virtual_chapter_overdue_")) {
      seriesId = alertId.replace("virtual_chapter_overdue_", "");
    }

    if (seriesId) {
      // Find series title to delete proposals
      const { data: seriesData } = await supabase
        .from('series')
        .select('title')
        .eq('series_id', seriesId)
        .single();
      if (seriesData?.title) {
        try {
          const mockStore = require('./editorMockStore');
          const proposalType = alertId.startsWith("rank_drop_") ? 'RECOVERY' : 'DEADLINE_REMINDER';
          mockStore.deleteProposalsBySeriesTitle(seriesData.title, proposalType);
          console.log(`Successfully deleted ${proposalType} proposals for series: ${seriesData.title}`);
        } catch (err) {
          console.error('Error deleting proposals:', err.message);
        }
      }

      // Find the owner (Mangaka) of this series
      const { data: members } = await supabase
        .from('series_member')
        .select('user_id')
        .eq('series_id', seriesId)
        .eq('role_in_series', 'owner');
        
      if (members && members.length > 0) {
        const mangakaIds = members.map(m => m.user_id);
        // Delete all notifications for these Mangaka users that are related to this series
        const { error: delErr } = await supabase
          .from('notification')
          .delete()
          .in('user_id', mangakaIds)
          .in('type', ['ranking_warning', 'ranking_warning_acknowledged']);
          
        if (delErr) {
          console.error(`Failed to delete Mangaka warning notifications:`, delErr.message);
        } else {
          console.log(`Successfully cleared Mangaka warnings for series ${seriesId}`);
        }
      }
    }
  } catch (e) {
    console.error(`Error deleting Mangaka notifications on resolveAlert:`, e.message);
  }

  // If this is a task overdue alert, extend the task deadline and reset status if not completed
  if (alertId && alertId.startsWith("task_overdue_")) {
    const taskId = alertId.replace("task_overdue_", "");
    
    const { data: taskData } = await supabase
      .from("page_task")
      .select("status")
      .eq("task_id", taskId)
      .maybeSingle();

    if (taskData && !['completed', 'approved'].includes(taskData.status)) {
      // Calculate new deadline: today + 7 days
      const newDeadline = new Date();
      newDeadline.setDate(newDeadline.getDate() + 7);
      
      const { error } = await supabase
        .from("page_task")
        .update({ 
          deadline: newDeadline.toISOString(),
          status: "in_progress" 
        })
        .eq("task_id", taskId);
        
      if (error) {
        console.error("Failed to extend task deadline on resolveAlert:", error.message);
      } else {
        console.log(`Successfully extended task ${taskId} deadline to ${newDeadline.toISOString()}`);
      }
    } else {
      console.log(`Task ${taskId} is already completed or approved. Skipping deadline extension.`);
    }
  }

  return { success: true };
};

const listAlerts = async ({ type, editorId }) => {
  if (!editorId) return [];
  const resolvedList = getResolvedAlerts()[editorId] || [];
  const alerts = [];

  // 1. Fetch series managed by the editor
  const { data: members, error: memErr } = await supabase
    .from("series_member")
    .select("series_id, series:series(*)")
    .eq("user_id", editorId)
    .eq("role_in_series", "editor");

  if (memErr || !members || members.length === 0) return [];
  
  const allSeriesList = members.map(m => m.series).filter(s => s != null);
  if (allSeriesList.length === 0) return [];
  const allSeriesIds = allSeriesList.map(s => s.series_id);

  // 2. Fetch chapters for all series
  const { data: chapters } = await supabase
    .from("chapter")
    .select("chapter_id, title, series_id, created_at, status, chapter_number")
    .in("series_id", allSeriesIds);
    
  const allChapters = chapters || [];

  // Filter unpublished series and their chapters to check for task overdue alerts
  const seriesList = allSeriesList.filter(s => s.status !== 'published');
  const seriesIds = seriesList.map(s => s.series_id);
  const unpublishedChaps = allChapters.filter(c => seriesIds.includes(c.series_id));
  const chapterIds = unpublishedChaps.map(c => c.chapter_id);

  // 3. Fetch overdue tasks
  if (chapterIds.length > 0) {
    const { data: pages } = await supabase
      .from("page")
      .select("page_id, chapter_id")
      .in("chapter_id", chapterIds);

    const pageIds = (pages || []).map(p => p.page_id);

    if (pageIds.length > 0) {
      const { data: tasks } = await supabase
        .from("page_task")
        .select("task_id, task_type, deadline, page_id, status")
        .in("page_id", pageIds)
        .neq("status", "completed")
        .lt("deadline", new Date().toISOString());

      if (tasks) {
        for (const task of tasks) {
          const page = pages.find(p => p.page_id === task.page_id);
          if (!page) continue;
          const chap = allChapters.find(c => c.chapter_id === page.chapter_id);
          console.log('Evaluating chap:', chap ? chap.title : 'None', chap ? chap.status : 'None', 'Series?', seriesList.find(s => chap && s.series_id === chap.series_id) ? 'Yes' : 'No');
          // If chapter is completed/published, don't alert on its tasks
          if (!chap || ['completed', 'published'].includes(chap.status.toLowerCase())) continue;
          const series = seriesList.find(s => s.series_id === chap.series_id);
          
          const daysLate = Math.floor((new Date() - new Date(task.deadline)) / (1000 * 60 * 60 * 24));
          const alertId = `task_overdue_${task.task_id}`;
          console.log('Pushing alert for:', chap.title, alertId);
          alerts.push({
            alert_id: alertId,
            type: "CRITICAL",
            title: "Trễ Deadline Bản Thảo",
            series_id: series.series_id,
            series_title: series.title,
            detail: `Bản thảo chương '${chap.title}' đã quá hạn nộp vào ${new Date(task.deadline).toLocaleDateString("vi-VN")}. Vui lòng nhắc nhở tác giả ngay!`,
            time: task.deadline,
            action: "Nhắc nhở Mangaka",
            action_path: `/dashboard/tantou-editor/series-defense?tab=deadline&series=${encodeURIComponent(series.title)}&chapter=${encodeURIComponent(chap.title)}&msg=late&daysLate=${daysLate}`,
            is_resolved: false
          });
        }
      }
    }
  }

  // 4. Check for abandoned series (WARNING) - Disabled temporarily
  /*
  const now = new Date();
  for (const series of seriesList) {
    const seriesChaps = allChapters.filter(c => c.series_id === series.series_id);
    let lastUpdate = new Date(series.created_at);
    if (seriesChaps.length > 0) {
      const latest = seriesChaps.reduce((max, c) => new Date(c.created_at) > max ? new Date(c.created_at) : max, new Date(0));
      lastUpdate = latest;
    }
    const daysSinceUpdate = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
    let schedule = "Weekly";
    if (scheduleStorage && scheduleStorage.getSeriesSchedule) {
      schedule = scheduleStorage.getSeriesSchedule(series.series_id) || "Weekly";
    }
    let threshold = 15; // default
    if (schedule.includes('Weekly')) threshold = 10;
    else if (schedule.includes('Bi-weekly')) threshold = 20;
    else if (schedule.includes('Monthly')) threshold = 40;

    if (daysSinceUpdate > threshold) {
      const alertId = `abandoned_${series.series_id}_${daysSinceUpdate}`;
      alerts.push({
        alert_id: alertId,
        type: "WARNING",
        title: "Nguy cơ bỏ bê Series",
        series_id: series.series_id,
        series_title: series.title,
        detail: `Cam kết ${schedule} nhưng đã ${daysSinceUpdate} ngày trôi qua mà series này chưa có chương mới nào được tạo.`,
        time: new Date().toISOString(),
        action: "Nhắc nhở Mangaka",
        action_path: `/dashboard/tantou-editor/series-defense?tab=deadline&series=${encodeURIComponent(series.title)}`,
        is_resolved: false
      });
    }
  }
  
  // 4.1. Check for virtual chapter overdue in published series (CRITICAL)
  const publishedSeries = allSeriesList.filter(s => s.status === 'published');
  const now = new Date();
  for (const series of publishedSeries) {
    const seriesChaps = allChapters.filter(c => c.series_id === series.series_id);
    const hasActiveChapter = seriesChaps.some(c => !['approved', 'completed', 'published'].includes(c.status.toLowerCase()));
    
    if (!hasActiveChapter) {
      let lastUpdate = new Date(series.created_at);
      let latestChapNum = 0;
      
      const publishedChaps = seriesChaps.filter(c => ['approved', 'completed', 'published'].includes(c.status.toLowerCase()));
      if (publishedChaps.length > 0) {
        publishedChaps.sort((a, b) => (b.chapter_number || 0) - (a.chapter_number || 0));
        const latest = publishedChaps[0];
        lastUpdate = new Date(latest.created_at || latest.updated_at);
        latestChapNum = latest.chapter_number || 0;
      }
      
      let schedule = "Weekly";
      if (scheduleStorage && scheduleStorage.getSeriesSchedule) {
        schedule = scheduleStorage.getSeriesSchedule(series.series_id) || "Weekly";
      }
      let intervalDays = 7;
      if (schedule.includes('Bi-weekly')) intervalDays = 14;
      else if (schedule.includes('Monthly')) intervalDays = 30;
      
      const virtualDeadlineDate = new Date(lastUpdate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
      
      if (now > virtualDeadlineDate) {
        const daysLate = Math.floor((now - virtualDeadlineDate) / (1000 * 60 * 60 * 24));
        const alertId = `virtual_chapter_overdue_${series.series_id}`;
        
        alerts.push({
          alert_id: alertId,
          type: "CRITICAL",
          title: "Trễ hạn chuẩn bị chương mới",
          series_id: series.series_id,
          series_title: series.title,
          detail: `Bộ truyện '${series.title}' đã xuất bản chương ${latestChapNum} nhưng chưa khởi tạo bản thảo chương tiếp theo (Chương ${latestChapNum + 1}). Dự kiến ra mắt tiếp theo là ngày ${virtualDeadlineDate.toLocaleDateString("vi-VN")}.`,
          time: virtualDeadlineDate.toISOString(),
          action: "Nhắc nhở Mangaka",
          action_path: `/dashboard/tantou-editor/series-defense?tab=deadline&series=${encodeURIComponent(series.title)}&chapter=${encodeURIComponent(`Chương ${latestChapNum + 1}`)}&msg=late&daysLate=${daysLate}`,
          is_resolved: false
        });
      }
    }
  }
  

  // 5. Check for low interaction / high risk (HIGH) - Disabled temporarily
  /*
  const nowForLowViews = new Date();
  for (const series of seriesList) {
    if (series.view_count < 50) {
      const daysSinceCreation = Math.floor((nowForLowViews - new Date(series.created_at)) / (1000 * 60 * 60 * 24));
      if (daysSinceCreation > 7) {
        const alertId = `low_views_${series.series_id}`;
        alerts.push({
          alert_id: alertId,
          type: "HIGH",
          title: "Tương tác độc giả thấp",
          series_id: series.series_id,
          series_title: series.title,
          detail: `Series đã xuất bản được hơn 1 tuần nhưng lượt đọc rất thấp (${series.view_count} views). Cần kế hoạch bảo vệ.`,
          time: new Date().toISOString(),
          action: "Lập Hồ Sơ Bảo Vệ",
          action_path: `/dashboard/tantou-editor/recovery`,
          is_resolved: false
        });
      }
    }
  }
  */

  // 6. Check for rank drop of 5 or more positions compared to previous period (HIGH)
  for (const series of seriesList) {
    // Get all ranking entries for this series
    const { data: rankHistory, error: rankErr } = await supabase
      .from("series_ranking")
      .select("*, ranking_period:period_id(start_date)")
      .eq("series_id", series.series_id);
      
    if (!rankErr && rankHistory && rankHistory.length >= 2) {
      // Sort by period start_date descending
      rankHistory.sort((a, b) => new Date(b.ranking_period?.start_date) - new Date(a.ranking_period?.start_date));
      
      const currentRank = rankHistory[0].rank_position;
      const prevRank = rankHistory[1].rank_position;
      const dropAmount = currentRank - prevRank;
      
      if (dropAmount >= 5) {
        const alertId = `rank_drop_${series.series_id}`;
        alerts.push({
          alert_id: alertId,
          type: "HIGH",
          title: "Tụt hạng nghiêm trọng",
          series_id: series.series_id,
          series_title: series.title,
          detail: `Series '${series.title}' đã bị tụt ${dropAmount} hạng so với tuần trước (từ hạng ${prevRank} xuống hạng ${currentRank}). Vui lòng nhắc nhở tác giả ngay!`,
          time: new Date().toISOString(),
          action: "Nhắc nhở Mangaka",
          action_path: `/dashboard/tantou-editor/series-defense?tab=recovery&series=${encodeURIComponent(series.title)}`,
          is_resolved: false
        });
      }
    }
  }

  // Filter out resolved alerts and return
  console.log('ALERTS AT END:', JSON.stringify(alerts, null, 2));
  console.log('RESOLVED LIST:', resolvedList);
  const finalAlerts = alerts.filter(a => !resolvedList.includes(a.alert_id));

  // Sync finalAlerts with notification table
  for (const alert of finalAlerts) {
    try {
      const { data: existing } = await supabase
        .from('notification')
        .select('notification_id')
        .eq('user_id', editorId)
        .eq('type', alert.alert_id)
        .limit(1);
        
      if (!existing || existing.length === 0) {
        await supabase.from('notification').insert({
          user_id: editorId,
          title: alert.title,
          content: alert.detail,
          type: alert.alert_id,
          is_read: false,
          created_at: new Date().toISOString()
        });
        console.log(`Inserted notification for alert: ${alert.alert_id}`);
      }
    } catch (e) {
      console.error(`Failed to sync notification for alert ${alert.alert_id}:`, e.message);
    }
  }
  
  if (type) {
    return finalAlerts.filter(a => a.type === type);
  }
  
  // Sort by severity (CRITICAL > HIGH > WARNING > MEDIUM)
  const severityOrder = { "CRITICAL": 0, "HIGH": 1, "WARNING": 2, "MEDIUM": 3 };
  finalAlerts.sort((a, b) => severityOrder[a.type] - severityOrder[b.type]);
  
  return finalAlerts;
};

module.exports = { listAlerts, resolveAlert };