const cfg = window.LINKCORP_CONFIG;
const supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
function money(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}).replace('R$','R$ ')}
function isConfigured(){return cfg.SUPABASE_URL.startsWith('https://') && cfg.SUPABASE_ANON_KEY.length>40}
function isAdminEmail(email){return (cfg.ADMIN_EMAILS||[]).map(x=>x.toLowerCase()).includes((email||'').toLowerCase())}
async function getSession(){ const {data}=await supabase.auth.getSession(); return data.session }
async function uploadImage(file){
  if(!file) return '';
  const ext=(file.name.split('.').pop()||'png').toLowerCase();
  const path=`produtos/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  const {error}=await supabase.storage.from('product-images').upload(path,file,{cacheControl:'3600',upsert:false});
  if(error) throw error;
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}
