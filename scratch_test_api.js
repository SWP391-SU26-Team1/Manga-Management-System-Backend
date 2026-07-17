const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const chapterId = '8d114f87-6e40-401e-84fd-8dae8b13a39d';
  
  // Find all pages for this chapter
  const { data: pages, error } = await supabase
    .from('page')
    .select('*')
    .eq('chapter_id', chapterId);
    
  if (error) {
    console.error(error);
    return;
  }
  
  console.log('Total pages in DB:', pages.length);
  console.log('Active pages (status !== deleted):', pages.filter(p => p.status !== 'deleted').map(p => ({
    page_id: p.page_id,
    page_number: p.page_number,
    status: p.status,
    image_url: p.image_url
  })));
}

run();
