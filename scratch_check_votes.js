const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sessionIds = [
    '11458bcd-7d93-4203-8b11-57e9d0ca4dec', // Cầm đao chém thầy
    '5d20c45f-6958-4497-97a6-bc1f3869f0ac'  // Chiên Binh Trở Lại
  ];
  
  for (const sessionId of sessionIds) {
    console.log(`\n=== Session: ${sessionId} ===`);
    const { data: session } = await supabase
      .from('review_session')
      .select('*')
      .eq('session_id', sessionId)
      .single();
      
    if (session) {
      console.log('Review Session:', {
        session_id: session.session_id,
        name: session.name,
        status: session.status,
        chapter_id: session.chapter_id,
        series_id: session.series_id,
        ended_at: session.ended_at
      });
      
      const { data: votes } = await supabase
        .from('vote')
        .select('*')
        .eq('session_id', sessionId);
        
      console.log('Votes:', votes);
    }
  }
}

run();
