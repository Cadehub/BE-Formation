const parseList = (value?: string) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const serverConfig = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  host: process.env.HOST || "0.0.0.0",
  port: Number(process.env.PORT || 3000),
  siteUrl: process.env.SITE_URL || "",
  allowedOrigins: parseList(process.env.ALLOWED_ORIGINS),
  adminEmails: parseList(process.env.ADMIN_EMAILS),
  adminPhoneNumber: process.env.ADMIN_PHONE_NUMBER || "",
  cronSecret: process.env.CRON_SECRET || "",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  metaAccessToken: process.env.META_ACCESS_TOKEN || "",
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
};

export const getPublicSiteUrl = (fallbackUrl?: string) =>
  serverConfig.siteUrl || fallbackUrl || `http://localhost:${serverConfig.port}`;

