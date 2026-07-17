const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('review_session')
    .select(`*, series:series_id(series_id, title), chapter:chapter_id(chapter_id, chapter_number, title)`);
    
  if (error) {
    console.error(error);
    return;
  }
  
  console.log('Review Sessions in DB:', data.map(s => ({
    session_id: s.session_id,
    series_title: s.series?.title,
    chapter_title: s.chapter?.title,
    chapter_number: s.chapter?.chapter_number,
    status: s.status,
    created_at: s.created_at
  })));
}

run();
