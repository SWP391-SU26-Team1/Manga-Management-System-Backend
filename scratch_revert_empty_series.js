const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Restoring series with 0 chapters back to "approved" status...');

  // Fetch all series
  const { data: seriesList, error: seriesError } = await supabase
    .from('series')
    .select('series_id, title, status');

  if (seriesError) {
    console.error('Error fetching series:', seriesError);
    return;
  }

  for (const series of seriesList) {
    // Count chapters
    const { error: chapterError, count } = await supabase
      .from('chapter')
      .select('chapter_id', { count: 'exact', head: true })
      .eq('series_id', series.series_id);

    if (chapterError) {
      console.error(`Error counting chapters for series ${series.title}:`, chapterError);
      continue;
    }

    const chapterCount = count ?? 0;
    console.log(`Series "${series.title}" has ${chapterCount} chapters (Current status: ${series.status})`);

    // If status is published but chapter count is 0, revert to approved
    if (series.status === 'published' && chapterCount === 0) {
      const { data: updated, error: updateError } = await supabase
        .from('series')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('series_id', series.series_id)
        .select();

      if (updateError) {
        console.error(`Error reverting series ${series.title}:`, updateError);
      } else {
        console.log(`Reverted series "${series.title}" back to "approved" because it has 0 chapters.`);
      }
    }
  }
}

run();
