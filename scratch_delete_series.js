/**
 * Script: Khôi phục các series quan trọng bị xóa nhầm
 * và thực sự chỉ xóa 4 series trong ảnh chụp màn hình
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Các series cần PHỤC HỒI (không phải 4 cái trong ảnh)
const RESTORE = [
  { id: '6c144905-f8b5-4fc3-bd41-a028e3e5fa7b', status: 'published' },  // API Test Published Series
  { id: '8afbb6f4-8613-4474-b462-9e203a309b91', status: 'published' },  // heheheh
  { id: '0c5ecf34-c306-491d-aa6b-167da8dd320a', status: 'published' },  // Phát và những người bạn
  { id: '2221c723-b446-4b7d-9df0-8f175d8cf31b', status: 'approved'  },  // Test 1
  { id: 'b0826928-e4b4-4b55-b010-3717adb48013', status: 'approved'  },  // Titanic Vietnamese
  { id: 'e3ce22aa-6800-4143-99dd-4a24e3052257', status: 'approved'  },  // Test Chapter mới
  { id: '237b808d-9930-4ac0-b2d7-01793fe2e9be', status: 'approved'  },  // Tầm Dữ
  { id: '43df7b78-767c-4741-b954-9fbe807bb6a9', status: 'draft'     },  // Titanic Vietnamese (draft)
  { id: '41fa92fb-d4d4-4e6b-b3fd-14aa1b5a4cf3', status: 'pending_review' }, // OnePiece
];

// 4 series CẦN GIỮ DELETED (những cái trong ảnh chụp)
// - Người Chơi Mới Cấp Tối Đa: 607d58c0, 756c6df5
// - Uzumaki Boruto: cần tìm ID
// - draft Người Chơi Mới Cấp Tối Đa: ...

async function main() {
  console.log('Đang khôi phục các series quan trọng...\n');

  for (const item of RESTORE) {
    const { error } = await supabase
      .from('series')
      .update({ status: item.status, updated_at: new Date().toISOString() })
      .eq('series_id', item.id);

    if (error) {
      console.error(`  ❌ Lỗi khi khôi phục ${item.id}:`, error.message);
    } else {
      console.log(`  ✅ Khôi phục [${item.status}] ${item.id}`);
    }
  }

  console.log('\n--- Trạng thái cuối ---');
  const { data } = await supabase
    .from('series')
    .select('series_id, title, status')
    .order('created_at', { ascending: false });

  data?.forEach(s => console.log(`  [${s.status}] ${s.title}`));
  console.log('\nXong!');
}

main().catch(console.error);
