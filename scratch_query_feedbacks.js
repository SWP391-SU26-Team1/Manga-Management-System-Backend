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
  console.log(feedbacks);

  const { data: submissions } = await supabase.from('page_submission').select('*');
  console.log('--- Page Submissions ---');
  console.log(submissions);
}

run();
