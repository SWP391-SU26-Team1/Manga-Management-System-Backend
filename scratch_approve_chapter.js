const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const MANUSCRIPT_ID = '14ec4782-5616-4e51-94a2-6cc10a7dca43'; // Chapter 2 Draft
const CHAPTER_ID = '8d114f87-6e40-401e-84fd-8dae8b13a39d'; // Chapter 2
const SERIES_ID = 'd7f2baa4-1c95-4775-9500-ecc321483688'; // Hoa Sơn Tái Khởi
const TANTOU_ID = 'b29fb935-7a5d-4988-9327-a8e453ba7322'; // LuanHuynh296
const CHIEF_EDITOR_ID = '0983b7c1-d1cd-4de8-8ec7-6e3e140cfe3c'; // ChiefEditor

async function run() {
  console.log('--- STARTING SUCCESSFUL CHAPTER APPROVAL WORKFLOW ---');

  // Step 1: Mangaka Submits Chapter Manuscript
  console.log('Step 1: Mangaka submits the manuscript...');
  const { data: mSubmit, error: errSubmit } = await supabase
    .from('manuscript')
    .update({ status: 'submitted', updated_at: new Date().toISOString() })
    .eq('manuscript_id', MANUSCRIPT_ID)
    .select();
  if (errSubmit) {
    console.error('Error submitting manuscript:', errSubmit);
    return;
  }
  console.log(`-> Manuscript status updated to: "${mSubmit[0].status}"`);

  // Step 2: Tantou Editor Starts Reviewing
  console.log('\nStep 2: Tantou Editor starts reviewing the manuscript...');
  const { data: mReview, error: errReview } = await supabase
    .from('manuscript')
    .update({ status: 'in_review', updated_at: new Date().toISOString() })
    .eq('manuscript_id', MANUSCRIPT_ID)
    .select();
  if (errReview) {
    console.error('Error starting review:', errReview);
    return;
  }
  console.log(`-> Manuscript status updated to: "${mReview[0].status}"`);

  // Step 3: Tantou Editor Approves Manuscript
  console.log('\nStep 3: Tantou Editor approves the manuscript...');
  const { data: mApprove, error: errApprove } = await supabase
    .from('manuscript')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('manuscript_id', MANUSCRIPT_ID)
    .select();
  if (errApprove) {
    console.error('Error approving manuscript:', errApprove);
    return;
  }
  console.log(`-> Manuscript status updated to: "${mApprove[0].status}"`);

  // Step 4: Create Editorial Board Review Session
  console.log('\nStep 4: Creating Editorial Board review session for the chapter...');
  // Clean up any existing review session for Chapter 2 first to avoid duplicates
  await supabase.from('review_session').delete().eq('chapter_id', CHAPTER_ID);

  const sessionPayload = {
    series_id: SERIES_ID,
    chapter_id: CHAPTER_ID,
    created_by_user_id: TANTOU_ID,
    name: 'Biểu quyết Chương 2: Qua Khứ Đau Thương',
    description: 'Phiên duyệt và đánh giá chất lượng chương 2',
    status: 'in_progress',
    started_at: new Date().toISOString()
  };
  const { data: session, error: errSession } = await supabase
    .from('review_session')
    .insert(sessionPayload)
    .select()
    .single();
  if (errSession) {
    console.error('Error creating review session:', errSession);
    return;
  }
  console.log(`-> Created Review Session "${session.name}" (ID: ${session.session_id}) with status "${session.status}"`);

  // Step 5: Board Members Cast Votes
  console.log('\nStep 5: Board members cast their votes...');
  const boardVoters = [
    { id: '029d5fd5-d073-47b5-8cd2-6edce019edd7', note: 'Nét vẽ rất đẹp, nội dung đúng tiến độ.' },
    { id: '7bce43df-62b2-40dd-a41a-975686ae7ab9', note: 'Phần hậu cảnh tô bóng rất chuẩn, duyệt.' },
    { id: '5a0d4321-beb5-4c10-bebd-0b05f20e11b4', note: 'Không có lỗi kỹ thuật nào, đồng ý xuất bản.' }
  ];

  for (const voter of boardVoters) {
    const votePayload = {
      voter_id: voter.id,
      session_id: session.session_id,
      decision: 'APPROVE',
      score: 9,
      note: voter.note,
      status: 'submitted'
    };
    const { data: vote, error: errVote } = await supabase
      .from('vote')
      .insert(votePayload)
      .select()
      .single();
    if (errVote) {
      console.error(`Error casting vote for voter ${voter.id}:`, errVote);
    } else {
      console.log(`-> Voter (ID: ${voter.id.slice(0,8)}) voted: "${vote.decision}" with score ${vote.score}`);
    }
  }

  // Step 6: Process Review Session Result
  console.log('\nStep 6: Processing review session results...');
  const { data: votes } = await supabase.from('vote').select('*').eq('session_id', session.session_id);
  const avgScore = votes.reduce((sum, v) => sum + (v.score || 0), 0) / votes.length;
  console.log(`-> Average Score: ${avgScore.toFixed(1)} / 10`);

  const { data: sessionUpdated, error: errSessionFinish } = await supabase
    .from('review_session')
    .update({ status: 'completed', ended_at: new Date().toISOString() })
    .eq('session_id', session.session_id)
    .select()
    .single();
  if (errSessionFinish) {
    console.error('Error ending session:', errSessionFinish);
    return;
  }
  console.log(`-> Review Session "${sessionUpdated.name}" marked as "${sessionUpdated.status}"`);

  // Step 7: Chief Editor / Admin Approves Chapter
  console.log('\nStep 7: Admin / Chief Editor approves the Chapter...');
  const { data: chapterApprove, error: errChapter } = await supabase
    .from('chapter')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('chapter_id', CHAPTER_ID)
    .select();
  if (errChapter) {
    console.error('Error approving chapter:', errChapter);
    return;
  }
  console.log(`-> Chapter status updated to: "${chapterApprove[0].status}"`);

  console.log('\n--- CHAPTER APPROVAL WORKFLOW COMPLETED SUCCESSFULLY ---');
}

run();
