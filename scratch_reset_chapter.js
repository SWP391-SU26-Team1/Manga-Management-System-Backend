const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const chapterId = 'bdc3d3af-1547-4d8c-bbfe-590eb071a954'; // Khởi đầu nhiệm vụ
  
  console.log('Resetting chapter status to pending_review...');
  const { error: chErr } = await supabase
    .from('chapter')
    .update({ status: 'pending_review' })
    .eq('chapter_id', chapterId);
    
  if (chErr) {
    console.error('Error resetting chapter:', chErr);
    return;
  }
  
  console.log('Fetching pages for this chapter...');
  const { data: pages, error: pErr } = await supabase
    .from('page')
    .select('page_id')
    .eq('chapter_id', chapterId);
    
  if (pErr) {
    console.error('Error fetching pages:', pErr);
    return;
  }
  
  const pageIds = pages.map(p => p.page_id);
  console.log('Page IDs:', pageIds);
  
  if (pageIds.length > 0) {
    console.log('Resetting page statuses to completed...');
    await supabase
      .from('page')
      .update({ status: 'completed' })
      .in('page_id', pageIds);
      
    console.log('Resetting page task statuses to completed (from assistant)...');
    await supabase
      .from('page_task')
      .update({ status: 'completed' })
      .in('page_id', pageIds);
  }
  
  console.log('Deleting previous test notifications for this chapter submission...');
  const { error: notifErr } = await supabase
    .from('notification')
    .delete()
    .in('type', ['request_chapter_vote', 'chapter_approved_to_board']);
    
  if (notifErr) {
    console.error('Error deleting notifications:', notifErr);
  }
  
  console.log('Reset complete! Please refresh the browser (F5) and try again.');
}

run();
