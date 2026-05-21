const cfg = window.LINKCORP_CONFIG || {};
const SUPABASE_URL = cfg.SUPABASE_URL || '';
const SUPABASE_KEY = cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_KEY || '';

function isConfigured(){
  return !!(SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.startsWith('https://'));
}

if (isConfigured()) {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  window.supabase = window.supabaseClient;
} else {
  console.error('Config Supabase faltando:', cfg);
}

function money(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}).replace('R$','R$ ')}
function isAdminEmail(email){return (cfg.ADMIN_EMAILS||[]).map(x=>String(x).toLowerCase()).includes(String(email||'').toLowerCase())}
async function getSession(){
  if(!isConfigured() || !window.supabase) return null;
  const {data}=await window.supabase.auth.getSession();
  return data.session;
}
async function getUser(){
  const session = await getSession();
  return session ? session.user : null;
}
async function logout(){
  if(window.supabase) await window.supabase.auth.signOut();
  localStorage.removeItem('linkcorp_user_email');
  location.href='login.html';
}
async function uploadImage(file){
  if(!file) return '';
  const ext=(file.name.split('.').pop()||'png').toLowerCase();
  const path=`produtos/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  const {error}=await window.supabase.storage.from('product-images').upload(path,file,{cacheControl:'3600',upsert:false});
  if(error) throw error;
  return window.supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}
