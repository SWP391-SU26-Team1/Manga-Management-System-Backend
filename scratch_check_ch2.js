const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Find chapters
  const { data: chapters, error: err1 } = await supabase
    .from('chapter')
    .select('*');
  console.log('Chapters in DB:', chapters);

  // Find manuscripts
  const { data: manuscripts, error: err2 } = await supabase
    .from('manuscript')
    .select('*');
  console.log('Manuscripts in DB:', manuscripts);

  // Query annotations for all pages of rejected manuscripts
  for (const m of manuscripts) {
    if (m.status === 'rejected' || m.status === 'needs_revision') {
      const { data: files } = await supabase
        .from('manuscript_file')
        .select('*')
        .eq('manuscript_id', m.manuscript_id);
      console.log(`Files for rejected manuscript ${m.title} (${m.manuscript_id}):`, files);
      if (files) {
        for (const f of files) {
          const { data: anns } = await supabase
            .from('annotation')
            .select('*')
            .eq('page_id', f.file_id);
          console.log(`Annotations for file ${f.file_name} (${f.file_id}):`, anns);
        }
      }
    }
  }
}

run();
