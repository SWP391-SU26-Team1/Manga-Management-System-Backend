const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const seriesIds = [
    '6b97fca5-f7df-4229-a512-cc185ad7f24e', // Người Chơi Mới Cấp Tối Đa
    '241862ea-fb36-458d-b23e-24cbf84d0201'  // Ngã Lão Ma Thần
  ];

  for (const sid of seriesIds) {
    console.log(`\n==================================================`);
    const { data: ser } = await supabase.from('series').select('*').eq('series_id', sid).single();
    console.log(`Series: "${ser.title}" | Status: ${ser.status}`);

    const { data: chapters } = await supabase.from('chapter').select('*').eq('series_id', sid);
    console.log(`Chapters found: ${chapters.length}`);
    for (const ch of chapters) {
      console.log(`  Chapter CH.${ch.chapter_number}: "${ch.title}" | Status: ${ch.status}`);
      const { data: pages } = await supabase.from('page').select('*').eq('chapter_id', ch.chapter_id);
      console.log(`    Pages: ${pages.length}`);
      for (const pg of pages) {
        console.log(`      Page ${pg.page_number} | Status: ${pg.status} | Image: ${pg.image_url ? 'Yes' : 'No'}`);
      }
    }
  }
}

run();
