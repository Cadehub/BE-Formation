import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const tables = [
  'formations',
  'inscriptions',
  'profiles',
  'formation_reviews',
  'certificates',
  'blogs',
  'categories',
  'platform_settings',
  'waitlist',
];

async function sample(table) {
  const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
  if (error) {
    console.error(`${table} ERROR`, error.message);
    return;
  }
  console.log(`\n=== ${table} row sample ===`);
  if (!data || data.length === 0) {
    console.log('NO ROWS');
    return;
  }
  console.log(JSON.stringify(data[0], null, 2));
}

async function verifyCols(table, cols) {
  for (const col of cols) {
    const { error } = await supabaseAdmin.from(table).select(col).limit(1);
    console.log(`${table}.${col}: ${error ? 'NO' : 'YES'}`);
  }
}

async function run() {
  for (const table of tables) {
    await sample(table);
  }

  console.log('\n=== verify candidate columns ===');
  await verifyCols('blogS', ['is_published', 'published_at', 'status', 'created_at']);
  await verifyCols('certificates', ['student_name', 'formation_title', 'file_url', 'is_published', 'qr_code_url', 'allow_public_indexing', 'unique_id', 'certificate_link']);
  await verifyCols('profiles', ['full_name', 'photo_url', 'phone', 'name', 'display_name']);
  await verifyCols('formations', ['places_disponibles', 'category', 'category_id', 'whatsapp_link', 'whatsapp_url', 'max_students', 'current_students', 'status', 'is_active']);
  await verifyCols('formation_reviews', ['user_id', 'formation_id', 'rating', 'comment', 'created_at']);
  await verifyCols('inscriptions', ['certificate_link', 'total_due', 'allow_public_indexing', 'full_name', 'email', 'phone', 'payment_status', 'status']);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});