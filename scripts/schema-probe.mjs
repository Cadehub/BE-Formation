import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const probes = {
  certificates: [
    'id',
    'inscription_id',
    'unique_id',
    'qr_code_url',
    'allow_public_indexing',
    'is_published',
    'student_name',
    'formation_id',
    'formation_title',
    'file_url',
    'certificate_link',
    'path',
    'pdf_url',
    'pdf_link',
    'link',
    'url',
    'created_at',
  ],
  blogs: [
    'id',
    'title',
    'slug',
    'excerpt',
    'content',
    'seo_keywords',
    'published_at',
    'is_published',
    'status',
    'created_at',
    'updated_at',
  ],
  profiles: [
    'id',
    'email',
    'is_admin',
    'created_at',
    'student_id',
    'bio',
    'portfolio_url',
    'allow_seo_indexing',
    'is_attested',
    'social_links',
    'phone',
    'full_name',
    'photo_url',
    'name',
    'display_name',
    'avatar_url',
  ],
  formations: [
    'id',
    'title',
    'slug',
    'description',
    'price',
    'registration_fee',
    'places_max',
    'max_students',
    'current_students',
    'places_disponibles',
    'category_id',
    'category',
    'start_date',
    'end_date',
    'status',
    'whatsapp_link',
    'whatsapp_url',
    'is_featured',
    'is_active',
    'total_price',
    'image_url',
    'created_at',
  ],
  inscriptions: [
    'id',
    'formation_id',
    'full_name',
    'phone',
    'email',
    'age',
    'payment_method',
    'created_at',
    'allow_public_indexing',
    'reminder_count',
    'last_reminder_at',
    'total_due',
    'amount_paid',
    'payment_status',
    'is_notified_to_admin',
    'certificate_link',
    'user_id',
    'payment_timing',
    'status',
  ],
};

async function run() {
  for (const [table, cols] of Object.entries(probes)) {
    console.log(`\n=== ${table} ===`);
    for (const col of cols) {
      const { error } = await supabaseAdmin.from(table).select(col).limit(1);
      console.log(`${col}: ${error ? 'NO' : 'YES'}`);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});