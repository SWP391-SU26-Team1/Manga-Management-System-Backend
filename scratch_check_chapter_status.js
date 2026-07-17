const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: chapters } = await supabase
    .from('chapter')
    .select('chapter_id, title, chapter_number, status')
    .eq('series_id', 'd7f2baa4-1c95-4775-9500-ecc321483688');
  
  console.log('Chapters status:', chapters);
}

run();
