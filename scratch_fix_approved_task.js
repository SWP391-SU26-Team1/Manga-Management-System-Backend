const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const submissionId = '5f1e67c1-fc5b-49c1-9079-350a6b2c5f20';
const pageId = 'ecb1ee6e-e5dc-4709-87a4-0a4fb0412415';
const fileUrl = 'https://res.cloudinary.com/daiqbvy5y/image/upload/v1783016832/submissions/cplf7titigdoe68der8w.png';

async function run() {
  console.log(`Fixing already approved task's database state...`);
  
  // 1. Update submission status to 'approved'
  const { data: subData, error: subErr } = await supabase
    .from('page_submission')
    .update({ submission_status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('submission_id', submissionId)
    .select();
    
  if (subErr) {
    console.error('Error updating submission:', subErr);
    return;
  }
  console.log('Submission updated:', subData);

  // 2. Update page image URL and status to 'completed'
  const { data: pgData, error: pgErr } = await supabase
    .from('page')
    .update({ image_url: fileUrl, status: 'completed', updated_at: new Date().toISOString() })
    .eq('page_id', pageId)
    .select();

  if (pgErr) {
    console.error('Error updating page:', pgErr);
    return;
  }
  console.log('Page updated:', pgData);
}

run();
