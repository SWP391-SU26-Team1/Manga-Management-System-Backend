const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const pageIds = [
    '21becbba-da38-4994-ab97-e4bfcf9e7b92',
    '6d9bf44d-d5a5-4efa-8ca7-ed9204dd428c'
  ];

  for (const pid of pageIds) {
    const hashNum = parseInt(pid.substring(0, 8), 16) % 1000000000;
    const newPageNum = -1 - hashNum;
    console.log(`Setting page ${pid} page_number to ${newPageNum}`);
    const { error } = await supabase
      .from('page')
      .update({ page_number: newPageNum })
      .eq('page_id', pid);
    if (error) {
      console.error(`Error updating page ${pid}:`, error);
    } else {
      console.log(`Successfully updated page ${pid}!`);
    }
  }
}

run();
