require('dotenv').config();
const supabase = require('./src/config/supabase');
const svc = require('./src/modules/rankings/rankings.service');

async function test() {
  try {
    // Let's find the user first
    const { data: user } = await supabase.from('users').select('*').eq('username', 'LuanHuynh296').single();
    console.log("User:", user);
    
    // Call service getTopSeries with filters
    const res = await svc.getTopSeries({
      limit: 20,
      editorId: user.user_id
    });
    
    console.log("API Result with editorId filter:", res);
  } catch (err) {
    console.error("Test error:", err);
  }
}

test();
