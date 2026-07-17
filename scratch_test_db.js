const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('SUPABASE_URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: chapters, error: err1 } = await supabase.from('chapter').select('chapter_id, title, status');
  if (err1) {
    console.error('Error fetching chapters:', err1);
  } else {
    console.log('Chapters:', chapters);
  }

  const { data: series, error: err2 } = await supabase.from('series').select('series_id, title, status');
  if (err2) {
    console.error('Error fetching series:', err2);
  } else {
    console.log('Series:', series);
  }
}

run();
