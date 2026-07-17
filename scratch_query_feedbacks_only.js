const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: feedbacks, error } = await supabase.from('page_task_feedback').select('*');
  if (error) {
    console.error('Error fetching feedbacks:', error);
    return;
  }
  console.log('--- Page Task Feedbacks ---');
  feedbacks.forEach(f => {
    console.log({
      feedback_id: f.feedback_id,
      task_id: f.task_id,
      submission_id: f.submission_id,
      content: f.content,
      created_at: f.created_at
    });
  });
}

run();
