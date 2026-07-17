const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: manuscripts, error: err1 } = await supabase
    .from('manuscript')
    .select('manuscript_id, title, status, file_url, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (err1) {
    console.error('Error fetching manuscripts:', err1);
  } else {
    console.log('Manuscripts:', manuscripts);
    for (const m of manuscripts) {
      const { data: files, error: err2 } = await supabase
        .from('manuscript_file')
        .select('*')
        .eq('manuscript_id', m.manuscript_id);
      if (err2) {
        console.error(`Error fetching files for ${m.manuscript_id}:`, err2);
      } else {
        console.log(`Files for manuscript "${m.title}" (${m.manuscript_id}):`, files);
      }
    }
  }
}

run();
