const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Starting migration to update approved series and chapters to published status...');

  // Update approved series to published
  const { data: updatedSeries, error: seriesError } = await supabase
    .from('series')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .eq('status', 'approved')
    .select();

  if (seriesError) {
    console.error('Error updating series:', seriesError);
  } else {
    console.log(`Successfully updated ${updatedSeries ? updatedSeries.length : 0} series from approved to published:`, updatedSeries);
  }

  // Update approved chapters to published
  const { data: updatedChapters, error: chapterError } = await supabase
    .from('chapter')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .eq('status', 'approved')
    .select();

  if (chapterError) {
    console.error('Error updating chapters:', chapterError);
  } else {
    console.log(`Successfully updated ${updatedChapters ? updatedChapters.length : 0} chapters from approved to published:`, updatedChapters);
  }

  // Also update approved manuscripts to published
  const { data: updatedManuscripts, error: msError } = await supabase
    .from('manuscript')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .eq('status', 'approved')
    .select();

  if (msError) {
    console.error('Error updating manuscripts:', msError);
  } else {
    console.log(`Successfully updated ${updatedManuscripts ? updatedManuscripts.length : 0} manuscripts from approved to published:`, updatedManuscripts);
  }
}

run();
