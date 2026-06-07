const supabase = require('../../config/supabase');
const seriesMembersRepo = require('../seriesMembers/seriesMembers.repository');
const AppError = require('../../utils/appError');

const assertMember = async (userId, seriesId) => {
  const m = await seriesMembersRepo.findBySeriesAndUser(seriesId, userId);
  if (!m) throw new AppError('Access denied', 403);
};

// Import chapter structure (pages + regions) into an existing series
const importChapter = async (userId, seriesId, payload) => {
  await assertMember(userId, seriesId);
  const { title, description, cover_image_url, pages = [] } = payload;

  // Get next chapter number
  const { data: lastChapter } = await supabase.from('chapter').select('chapter_number').eq('series_id', seriesId).order('chapter_number', { ascending: false }).limit(1).maybeSingle();
  const chapterNumber = (lastChapter?.chapter_number ?? 0) + 1;

  const { data: chapter, error: cErr } = await supabase
    .from('chapter')
    .insert({ series_id: seriesId, title, description, cover_image_url, chapter_number: chapterNumber, status: 'draft' })
    .select()
    .single();
  if (cErr) throw cErr;

  const results = { chapter, pages_imported: 0, regions_imported: 0 };

  if (pages.length > 0) {
    const pageRows = pages.map((p, i) => ({
      chapter_id: chapter.chapter_id,
      page_number: p.page_number ?? (i + 1),
      image_url: p.image_url || null,
      status: 'draft',
    }));
    const { data: insertedPages, error: pErr } = await supabase.from('page').insert(pageRows).select();
    if (pErr) throw pErr;

    results.pages_imported = insertedPages.length;

    // import regions per page
    const allRegions = [];
    insertedPages.forEach((insertedPage, idx) => {
      const srcPage = pages[idx];
      if (srcPage.regions && srcPage.regions.length > 0) {
        srcPage.regions.forEach((r) => {
          allRegions.push({ ...r, page_id: insertedPage.page_id });
        });
      }
    });

    if (allRegions.length > 0) {
      const { data: insertedRegions, error: rErr } = await supabase.from('page_region').insert(allRegions).select();
      if (rErr) throw rErr;
      results.regions_imported = insertedRegions.length;
    }
  }

  return results;
};

// Import from JSON export (full series structure into existing series)
const importFromExport = async (userId, targetSeriesId, exportPayload) => {
  await assertMember(userId, targetSeriesId);
  const { chapters = [] } = exportPayload;

  let totalChapters = 0;
  let totalPages = 0;

  for (const chapterData of chapters) {
    const result = await importChapter(userId, targetSeriesId, {
      title: chapterData.title,
      description: chapterData.description,
      cover_image_url: chapterData.cover_image_url,
      pages: chapterData.pages || [],
    });
    totalChapters++;
    totalPages += result.pages_imported;
  }

  return { chapters_imported: totalChapters, pages_imported: totalPages };
};

module.exports = { importChapter, importFromExport };
