const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: chapters, error } = await supabase
    .from('chapter')
    .select(`
      *,
      series:series_id(
        series_id,
        title,
        series_member(
          role_in_series,
          users:user_id(
            user_id,
            username
          )
        )
      )
    `);
    
  if (error) {
    console.error('Error:', error);
  } else {
    chapters.forEach(ch => {
      console.log(`\nChapter: ${ch.title} (ID: ${ch.chapter_id})`);
      const ownerMember = ch.series?.series_member?.find(m => m.role_in_series === 'owner');
      console.log('Owner Member:', ownerMember);
      const mangakaId = ownerMember?.users?.user_id || ownerMember?.user_id || null;
      console.log('Resolved mangakaId:', mangakaId);
    });
  }
}

run();
