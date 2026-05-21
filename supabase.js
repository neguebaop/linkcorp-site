const cfg = window.LINKCORP_CONFIG || {};

const SUPABASE_URL = cfg.SUPABASE_URL;
const SUPABASE_KEY = cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_KEY;

function isConfigured() {
  return !!(SUPABASE_URL && SUPABASE_KEY);
}

function toast(msg) {
  alert(msg);
}

if (isConfigured()) {
  window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  console.error("Config Supabase faltando:", cfg);
}