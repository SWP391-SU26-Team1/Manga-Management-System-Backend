const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: users, error } = await supabase.from('users').select('user_id, username, name, role, status, email');
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  console.log('--- Users ---');
  console.log(users);
}

run();
