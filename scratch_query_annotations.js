const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: annotations, error } = await supabase.from('annotation').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('--- Annotations ---');
  console.log(annotations.map(a => ({
    annotation_id: a.annotation_id,
    page_id: a.page_id,
    content: a.content,
    status: a.status,
    created_at: a.created_at
  })));

  // Let's also check manuscript files to see which files belong to which manuscripts
  const { data: manuscriptFiles } = await supabase.from('manuscript_file').select('*');
  console.log('--- Manuscript Files ---');
  console.log(manuscriptFiles.map(f => ({
    file_id: f.file_id,
    manuscript_id: f.manuscript_id,
    file_url: f.file_url,
    created_at: f.created_at
  })));
}

run();
