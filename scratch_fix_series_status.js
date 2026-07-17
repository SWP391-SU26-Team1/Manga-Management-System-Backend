const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching all published series...');
  const { data: seriesList, error: seriesError } = await supabase
    .from('series')
    .select('series_id, title, status')
    .eq('status', 'published');

  if (seriesError) {
    console.error('Error fetching series:', seriesError);
    return;
  }

  console.log(`Found ${seriesList.length} published series. Checking chapters...`);

  for (const series of seriesList) {
    const { count, error: countError } = await supabase
      .from('chapter')
      .select('*', { count: 'exact', head: true })
      .eq('series_id', series.series_id);

    if (countError) {
      console.error(`Error checking chapters for series ${series.title}:`, countError);
      continue;
    }

    console.log(`Series "${series.title}" (${series.series_id}) has ${count} chapters.`);

    if (count === 0) {
      console.log(`Reverting status of series "${series.title}" to "approved"...`);
      const { error: updateError } = await supabase
        .from('series')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('series_id', series.series_id);

      if (updateError) {
        console.error(`Error updating status for series ${series.title}:`, updateError);
      } else {
        console.log(`Successfully reverted series "${series.title}" back to "approved".`);
      }
    }
  }

  console.log('Cleanup task completed.');
}

run();
