const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Database Synchronization Starting ---');

  // 1. Transition all 'approved' series to 'published'
  const { data: approvedSeries, error: sErr } = await supabase
    .from('series')
    .select('series_id, title, status')
    .eq('status', 'approved');

  if (sErr) {
    console.error('Error fetching approved series:', sErr);
  } else if (approvedSeries && approvedSeries.length > 0) {
    console.log(`Found ${approvedSeries.length} approved series. Upgrading to published...`);
    for (const ser of approvedSeries) {
      const { data: updatedSer, error: upSerErr } = await supabase
        .from('series')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('series_id', ser.series_id)
        .select();

      if (upSerErr) {
        console.error(`Error updating series "${ser.title}":`, upSerErr);
      } else {
        console.log(`Series "${ser.title}" is now published.`);
      }
    }
  } else {
    console.log('No approved series found.');
  }

  // 2. Fetch all completed chapter review sessions
  const { data: sessions, error: sesErr } = await supabase
    .from('review_session')
    .select('*, chapter:chapter_id(chapter_id, title, status)')
    .in('status', ['completed', 'finished'])
    .not('chapter_id', 'is', null);

  if (sesErr) {
    console.error('Error fetching sessions:', sesErr);
    return;
  }

  console.log(`\nFound ${sessions.length} completed/finished chapter review sessions.`);

  for (const s of sessions) {
    const ch = s.chapter;
    if (!ch) {
      console.log(`Session "${s.name}" (${s.session_id}) has no matching chapter in DB`);
      continue;
    }

    console.log(`\nAnalyzing Session: "${s.name}" (Status: ${s.status}) | Chapter: "${ch.title}" (Status: ${ch.status})`);
    
    if (ch.status !== 'published') {
      console.log(`-> Mismatch detected! Upgrading Chapter "${ch.title}" (${ch.chapter_id}) to published...`);
      
      // Update Chapter status to published
      const { data: upCh, error: upChErr } = await supabase
        .from('chapter')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('chapter_id', ch.chapter_id)
        .select();

      if (upChErr) {
        console.error(`Error updating chapter "${ch.title}":`, upChErr);
        continue;
      }
      console.log(`-> Chapter "${ch.title}" is now published.`);

      // Update associated manuscript status to published
      const { data: manuscripts } = await supabase
        .from('manuscript')
        .select('manuscript_id')
        .eq('chapter_id', ch.chapter_id);

      if (manuscripts && manuscripts.length > 0) {
        for (const m of manuscripts) {
          await supabase
            .from('manuscript')
            .update({ status: 'published', updated_at: new Date().toISOString() })
            .eq('manuscript_id', m.manuscript_id);
          
          console.log(`-> Manuscript "${m.manuscript_id}" updated to published.`);

          // Sync manuscript files to pages
          const { data: mFiles } = await supabase
            .from('manuscript_file')
            .select('file_id, file_url')
            .eq('manuscript_id', m.manuscript_id);

          if (mFiles && mFiles.length > 0) {
            console.log(`-> Found ${mFiles.length} files. Synchronizing to pages table...`);
            for (let i = 0; i < mFiles.length; i++) {
              const file = mFiles[i];
              const pageNum = i + 1;

              // Check if page already exists
              const { data: existingPage } = await supabase
                .from('page')
                .select('page_id')
                .eq('page_id', file.file_id)
                .maybeSingle();

              if (existingPage) {
                await supabase
                  .from('page')
                  .update({
                    chapter_id: ch.chapter_id,
                    page_number: pageNum,
                    image_url: file.file_url,
                    status: 'published',
                    updated_at: new Date().toISOString()
                  })
                  .eq('page_id', file.file_id);
              } else {
                await supabase
                  .from('page')
                  .insert({
                    page_id: file.file_id,
                    chapter_id: ch.chapter_id,
                    page_number: pageNum,
                    image_url: file.file_url,
                    status: 'published'
                  });
              }
            }
            console.log(`-> Successfully synchronized pages.`);
          }
        }
      }
    } else {
      console.log(`-> Chapter "${ch.title}" is already published. Ensuring pages are published too.`);
      await supabase
        .from('page')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('chapter_id', ch.chapter_id);
    }

    // Ensure session ended_at is not null
    if (!s.ended_at) {
      await supabase
        .from('review_session')
        .update({ ended_at: new Date().toISOString() })
        .eq('session_id', s.session_id);
      console.log(`-> Session "${s.name}" timeline ended_at set to now.`);
    }
  }

  console.log('\n--- Database Synchronization Finished ---');
}

run();
