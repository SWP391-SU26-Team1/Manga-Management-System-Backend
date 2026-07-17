const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const seriesId = '923a44e7-948e-4199-8b9d-382d180868e1';

async function run() {
  console.log(`Querying details for series: ${seriesId}`);
  
  const { data: series } = await supabase.from('series').select('*').eq('series_id', seriesId).single();
  console.log('Series details:', series);

  const { data: chapters } = await supabase.from('chapter').select('*').eq('series_id', seriesId);
  console.log(`Chapters found: ${chapters.length}`);

  for (const ch of chapters) {
    console.log(`\n--- Chapter CH.${ch.chapter_number}: "${ch.title}" (${ch.chapter_id}) | Status: ${ch.status} ---`);
    
    const { data: pages } = await supabase.from('page').select('*').eq('chapter_id', ch.chapter_id);
    console.log(`Pages count: ${pages.length}`);
    for (const pg of pages) {
      console.log(`  Page ${pg.page_number} (${pg.page_id}) | Status: ${pg.status} | Image URL: ${pg.image_url}`);
      
      const { data: tasks } = await supabase.from('page_task').select('*').eq('page_id', pg.page_id);
      console.log(`    Tasks:`);
      for (const t of tasks) {
        console.log(`      Task ID: ${t.task_id} | Type: ${t.task_type} | Status: ${t.status}`);
        
        const { data: subs } = await supabase.from('page_submission').select('*').eq('task_id', t.task_id);
        console.log(`        Submissions:`);
        for (const s of subs) {
          console.log(`          Sub ID: ${s.submission_id} | Status: ${s.submission_status} | File URL: ${s.file_url}`);
        }
      }
    }
  }
}

run();
