const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: pages, error } = await supabase.from('page').select('*').eq('chapter_id', '341259d5-9a21-430c-ba98-8e46fecc0d62');
  if (error) {
    console.error('Error fetching pages:', error);
    return;
  }
  console.log('--- Pages for Chapter 1 ---');
  console.log(pages.map(p => ({
    page_id: p.page_id,
    chapter_id: p.chapter_id,
    page_number: p.page_number,
    status: p.status,
    image_url: p.image_url
  })));
}

run();
