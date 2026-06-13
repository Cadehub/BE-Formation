import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { serverConfig } from "./config";

// Server-side Supabase client with admin capabilities
export const supabaseAdmin = createClient(
  serverConfig.supabaseUrl,
  serverConfig.supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
