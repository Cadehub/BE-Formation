export type Category = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type Formation = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  registration_fee?: number;
  places_max: number;
  // Schema has explicit student counters instead of a "places_disponibles" column
  max_students?: number;
  current_students?: number;
  image_url: string;
  // category_id is the canonical foreign key to the categories table
  category_id?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  whatsapp_url?: string;
};

export type Inscription = {
  id: string;
  formation_id: string;
  full_name: string;
  email?: string;
  phone: string;
  payment_status: 'pending' | 'paid';
  payment_method: 'chariow' | 'cash';
  payment_timing: 'now' | 'later';
  amount_paid?: number;
  reminder_count: number;
  last_reminder_at: string | null;
  created_at: string;
  user_id?: string | null;
  status?:
    | 'pending'
    | 'validated'
    | 'participating'
    | 'cancelled';
};

export type Profile = {
  id: string;
  email?: string;
  is_admin: boolean;
  created_at?: string;
  student_id?: string | null;
  is_attested?: boolean;
  full_name?: string;
  photo_url?: string;
  bio?: string;
  portfolio_url?: string;
  social_links?: string | Record<string, string> | null;
  allow_seo_indexing?: boolean;
  phone?: string;
};

export type Enrollment = Inscription & {
  formation?: Formation;
  profile?: Profile;
};

export type PlatformSettings = {
  id: number;
  logo_url: string;
};

export type Certificate = {
  id: string;
  inscription_id?: string | null;
  unique_id?: string | null;
  qr_code_url?: string | null;
  allow_public_indexing: boolean;
  is_published?: boolean;
  student_name?: string;
  formation_id?: string | null;
  formation_title?: string | null;
  file_url?: string;
  is_sample?: boolean;
  created_at: string;
};

export type Blog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  seo_keywords: string;
  published_at: string;
};
