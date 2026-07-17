require('dotenv').config();
const taskReviewSvc = require('./src/modules/editor/editorTaskReview.service');
const supabase = require('./src/config/supabase');

async function main() {
  const chapterId = '6e209076-e7e7-479b-85af-e0ea739f5e51';
  
  // Find page 1 of this chapter
  const { data: page, error: pageErr } = await supabase
    .from('page')
    .select('page_id')
    .eq('chapter_id', chapterId)
    .eq('page_number', 1)
    .single();

  if (pageErr) {
    console.error('Page lookup error:', pageErr);
    return;
  }

  // Find the latest task for this page
  const { data: tasks, error: taskErr } = await supabase
    .from('page_task')
    .select('*')
    .eq('page_id', page.page_id)
    .order('created_at', { ascending: false });

  if (taskErr) {
    console.error('Task lookup error:', taskErr);
    return;
  }

  const latestTask = tasks[0];
  console.log('Latest task found:', {
    task_id: latestTask.task_id,
    status: latestTask.status,
    assistant_id: latestTask.assistant_id
  });

  try {
    console.log('1. Overriding status to in_review...');
    const res1 = await taskReviewSvc.performWorkflow(
      latestTask.task_id,
      'b11fbddd-0c1d-44e6-b07d-e2bebcee1d1e', // editorId placeholder (editor user LuanHuynh298 or assistant)
      'override-status',
      { status: 'in_review' }
    );
    console.log('Override success!', res1);

    console.log('2. Approving task...');
    const res2 = await taskReviewSvc.performWorkflow(
      latestTask.task_id,
      'b11fbddd-0c1d-44e6-b07d-e2bebcee1d1e',
      'approve',
      {}
    );
    console.log('Approve success!', res2);
  } catch (err) {
    console.error('❌ CATCH ERROR STACK TRACE:');
    console.error(err);
  }
}

main().catch(console.error);
