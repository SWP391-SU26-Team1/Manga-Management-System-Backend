const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: notifs, error } = await supabase
    .from('notification')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('Error fetching notifications:', error);
  } else {
    console.log('Latest 10 notifications:');
    notifs.forEach(n => {
      console.log(`- ID: ${n.notification_id}, Title: "${n.title}", User ID: ${n.user_id}, Type: "${n.type}", Created: ${n.created_at}`);
      console.log(`  Content: "${n.content}"`);
    });
  }
}

run();
