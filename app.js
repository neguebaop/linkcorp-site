const DISCORD_URL = 'https://discord.gg/TutAbaF7q';

function nav(active='inicio'){
  return `<header class="topbar"><div class="nav"><a class="brand brand-img-only" href="index.html"><img class="brand-img" src="assets/logo.png" alt="Link Corp"></a><nav class="menu"><a class="${active==='inicio'?'active':''}" href="index.html">Início</a><a class="${active==='produtos'?'active':''}" href="produtos.html">Produtos</a><a class="${active==='feedbacks'?'active':''}" href="feedbacks.html">Feedbacks</a><span id="userNavArea"><a class="${active==='login'?'active':''}" href="login.html">Login</a></span><button onclick="openCart()" class="cart-btn">🛒</button></nav></div></header>`;
}

function footer(){
  return `<footer class="footer"><div class="container footer-grid"><div><div class="brand brand-img-only"><img class="brand-img footer-logo-img" src="assets/logo.png" alt="Link Corp"></div><p>Os melhores painéis e produtos digitais. Atendimento manual via Pix e Discord.</p><div class="secure"><b>🛡️ Segurança</b><span>Google Site Seguro</span><span>Pagamento Seguro</span></div></div><div><h3>LINKS RÁPIDOS</h3><p><a href="produtos.html">Produtos</a></p><p><a href="feedbacks.html">Feedbacks</a></p><p><a href="carrinho.html">Carrinho</a></p></div><div><h3>SUPORTE</h3><p>💬 Suporte e comprovante via Discord</p><p>✉️ ${cfg.SUPPORT_EMAIL||''}</p><p><a href="${DISCORD_URL}" target="_blank">Entrar no Discord</a></p></div></div><div class="container"><p>© 2026 Link Corp. Todos os direitos reservados.</p></div></footer><div class="online"><span id="onlineNum">150</span> ONLINE</div><button class="chat discord-chat" title="Discord" onclick="window.open('${DISCORD_URL}','_blank')">💬</button><div id="toast" class="toast"></div><div id="cartModal" class="modal"><div class="modal-box cart-mini-box"><button class="close" onclick="closeCart()">×</button><h2>Carrinho</h2><div id="cartItems"></div><div class="cart-mini-actions"><a class="btn" href="carrinho.html">Finalizar Pedido</a><button class="btn ghost" onclick="closeCart()">Continuar comprando</button></div></div></div>`;
}

function boot(active){
  document.body.classList.add('grid-bg');
  const navEl=document.getElementById('nav');
  const footEl=document.getElementById('footer');
  if(navEl) navEl.innerHTML=nav(active);
  if(footEl) footEl.innerHTML=footer();
  particles();
  updateUserNav(active);
  setInterval(()=>{let n=145+Math.floor(Math.random()*20);let el=document.getElementById('onlineNum');if(el)el.textContent=n},2500);
}

async function updateUserNav(active){
  const area=document.getElementById('userNavArea');
  if(!area) return;
  try{
    const session = await getSession();
    if(session && session.user){
      const email=session.user.email||'Conta';
      const name=email.split('@')[0];
      area.innerHTML=`<a class="${active==='conta'?'active':''}" href="conta.html"><span class="user-pill"><span class="avatar-mini">👤</span>${name} ✅</span></a>`;
    } else {
      area.innerHTML=`<a class="${active==='login'?'active':''}" href="login.html">Login</a>`;
    }
  }catch(e){ console.error(e); }
}

function toast(msg){
  let t=document.getElementById('toast');
  if(!t){ alert(msg); return; }
  t.textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3000);
}

function particles(){
  if(document.body.dataset.particlesReady) return;
  document.body.dataset.particlesReady='1';
  for(let i=0;i<36;i++){
    let p=document.createElement('span');
    p.className='particle';
    p.style.left=Math.random()*100+'vw';
    p.style.animationDelay=Math.random()*9+'s';
    p.style.animationDuration=(7+Math.random()*8)+'s';
    document.body.appendChild(p);
  }
}

async function fetchProducts(){
  if(!isConfigured())return demoProducts();
  const {data,error}=await supabase.from('products').select('*').eq('active',true).order('created_at',{ascending:false});
  if(error){console.error(error);return []}
  return data||[];
}

function demoProducts(){
  return [{id:'demo1',category:'android',name:'Painel Link Android',description:'Painel otimizado para Android com planos flexíveis.',image_url:'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?q=80&w=900',old_price:99.9,price:35,badge:'Mais escolhido',plans:[{name:'15 Dias',days:'15 dias',old_price:49.99,price:35,discount:'-30%'},{name:'Mensal',days:'30 dias',old_price:99.99,price:65,discount:'-35%'},{name:'Trimestral',days:'90 dias',old_price:119.99,price:85,discount:'-29%'},{name:'Permanente',days:'Vitalício',old_price:179.99,price:120,discount:'-33%'}]}];
}

function safeId(id){return String(id).replace(/'/g,'&#39;').replace(/"/g,'&quot;')}
function getProductById(id){return (window.LINKCORP_PRODUCTS||[]).find(p=>String(p.id)===String(id));}

function productCard(p){
  return `<div class="product-card" data-cat="${p.category}"><img class="product-img" src="${p.image_url||''}" onerror="this.style.display='none'"><div class="product-body"><span class="badge">${p.badge||p.category}</span><h3 class="product-name">🛒 ${p.name}</h3><div class="prices"><del>${money(p.old_price)}</del> <span class="badge">↓ ${calcDisc(p.old_price,p.price)}</span></div><div class="price">${money(p.price)}</div><small>À vista no PIX</small><div class="buy-line"><button class="btn" onclick="openBuyModalById('${safeId(p.id)}')">Comprar</button></div></div></div>`;
}

function productWide(p){
  let plans=(p.plans&&p.plans.length?p.plans:[{name:'Principal',days:'Acesso',old_price:p.old_price,price:p.price,discount:calcDisc(p.old_price,p.price)}]);
  return `<section class="product-wide" data-cat="${p.category}"><img class="wide-img" src="${p.image_url||''}"><div class="plans"><h2>${p.name}</h2><p style="color:#aeb5c2;font-size:18px">${p.description||''}</p>${plans.map((pl,idx)=>`<div class="plan"><div><div class="plan-title">${pl.name} <span class="badge">${pl.discount||calcDisc(pl.old_price,pl.price)}</span></div><span style="color:#7f8795">${pl.days||''}</span></div><div><del>${money(pl.old_price)}</del><div class="plan-price">${money(pl.price)}</div><small style="color:#0ee783">Economize ${money((pl.old_price||0)-(pl.price||0))}</small></div><button class="btn" onclick="openBuyModalById('${safeId(p.id)}',${idx})">🛒 Comprar</button></div>`).join('')}</div></section>`;
}

function calcDisc(oldp,price){oldp=Number(oldp||0);price=Number(price||0);return oldp>price?Math.round((1-price/oldp)*100)+'%':'0%'}

function openBuyModalById(id, planIndex=0){
  const product=getProductById(id);
  if(!product) return toast('Produto não encontrado. Atualize a página.');
  openBuyModal(product, planIndex);
}

function openBuyModal(product, planIndex=0){
  const plans = Array.isArray(product.plans) && product.plans.length ? product.plans : [{name:'Principal',days:'Acesso',old_price:product.old_price||0,price:product.price||0,discount:calcDisc(product.old_price,product.price)}];
  let currentIndex = Number.isInteger(planIndex) ? planIndex : 0;
  const modal = document.getElementById('buyModal') || document.createElement('div');
  modal.id='buyModal';
  modal.className='modal show';
  modal.innerHTML=`<div class="modal-box buy-modal-box"><button class="close" onclick="document.getElementById('buyModal').classList.remove('show')">×</button><div class="buy-modal-top"><div><img class="buy-modal-img" src="${product.image_url||'assets/logo.png'}"></div><div><p class="muted">Início › Produtos › ${product.category||''}</p><h2>${product.name||'Produto'}</h2><div id="buyPriceBox"></div><p><span class="discord-badge">⚡ Entrega manual via Discord</span></p><p class="buy-description">${product.description||''}</p></div></div><hr><h3>Escolha seu plano</h3><div class="buy-plan-list" id="buyPlanList">${plans.map((p,i)=>`<div class="buy-plan-option ${i===currentIndex?'active':''}" data-plan-index="${i}"><div class="buy-plan-left"><b>${p.name||'Plano'} ${p.discount?`<span class="buy-plan-discount">${p.discount}</span>`:''}</b><small>${p.days||''}</small></div><div class="buy-plan-price">${p.old_price?`<del>${money(p.old_price)}</del>`:''}<strong>${money(p.price)}</strong></div></div>`).join('')}</div><div class="card buy-stock-card"><h3>Estoque disponível</h3><div id="buyStockPrice" style="font-size:28px;margin:10px 0"></div><p id="buyStockDays"></p><button class="btn" id="buyNowBtn" style="width:100%">Comprar agora</button><button class="btn ghost" onclick="document.getElementById('buyModal').classList.remove('show')" style="width:100%;margin-top:10px">Continuar vendo produtos</button></div></div>`;
  if(!document.getElementById('buyModal')) document.body.appendChild(modal);
  function renderSelected(){
    const p=plans[currentIndex];
    document.querySelectorAll('#buyPlanList .buy-plan-option').forEach(el=>el.classList.toggle('active',Number(el.dataset.planIndex)===currentIndex));
    const priceBox=document.getElementById('buyPriceBox');
    if(priceBox) priceBox.innerHTML=`${p.old_price?`<del>${money(p.old_price)}</del>`:''} ${p.discount?`<b style="color:#00ff9d;font-size:22px">${p.discount}</b>`:''} <strong style="font-size:34px;margin-left:10px">${money(p.price)}</strong>`;
    document.getElementById('buyStockPrice').textContent=money(p.price);
    document.getElementById('buyStockDays').textContent=`${p.days||p.name||'Plano'} disponível`;
  }
  document.querySelectorAll('#buyPlanList .buy-plan-option').forEach(el=>{el.onclick=()=>{currentIndex=Number(el.dataset.planIndex);renderSelected();};});
  document.getElementById('buyNowBtn').onclick=function(){
    const p=plans[currentIndex];
    addToCart({product_id:product.id,name:product.name,image_url:product.image_url,category:product.category,plan:p.name||'Principal',days:p.days||'',price:Number(p.price||product.price||0),qty:1});
    location.href='carrinho.html';
  };
  renderSelected();
}

function addToCart(item){
  let cart=JSON.parse(localStorage.getItem('cart')||'[]');
  cart.push(item);
  localStorage.setItem('cart',JSON.stringify(cart));
  toast('Produto adicionado ao carrinho!');
}

function buy(item){ addToCart(item); }
function openCart(){document.getElementById('cartModal').classList.add('show');renderCartMini()}
function closeCart(){document.getElementById('cartModal').classList.remove('show')}
function renderCartMini(){
  let c=JSON.parse(localStorage.getItem('cart')||'[]');
  document.getElementById('cartItems').innerHTML=c.length?c.map((i,k)=>`<div class="cart-mini-item"><img src="${i.image_url||'assets/logo.png'}"><div><b>${i.name}</b><span>${i.plan||''}</span></div><b>${money(i.price)}</b></div>`).join(''):'<p>Carrinho vazio.</p>';
}
