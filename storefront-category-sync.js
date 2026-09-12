(function(){
  let db=null,items=[],active='echoes';
  const STORAGE='ymk_admin_categories_v1';
  const BASE_ORDER=['echoes','skins','accessories'];
  const BASE={echoes:'เติมกระดุม',skins:'เติมสกิน',accessories:'เติมประดับ'};
  const norm=v=>String(v||'echoes').trim();
  function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function savedCategories(){try{const a=JSON.parse(localStorage.getItem(STORAGE)||'[]');return Array.isArray(a)?a.filter(x=>x&&x.id&&x.name):[];}catch(e){return [];}}
  function ready(){try{if(!window.firebase||!firebase.firestore)return false;if(!firebase.apps.length){if(!window.YUIMELLKUB_FIREBASE_CONFIG)return false;firebase.initializeApp(window.YUIMELLKUB_FIREBASE_CONFIG);}db=firebase.firestore();return true;}catch(e){return false;}}
  function usable(p){return p&&p.visible!==false;}
  function categoryName(id){const s=savedCategories().find(x=>norm(x.id)===id);if(s)return s.name;const p=items.find(x=>norm(x.category)===id&&x.categoryLabel);return p?.categoryLabel||BASE[id]||id;}
  function host(){return document.querySelector('.ready-stock-tabs')||document.querySelector('.ready-stock-tab')?.parentElement;}
  function grid(){return document.querySelector('.ready-stock-grid');}
  function injectStyle(){if(document.getElementById('ymkStoreSyncStyle'))return;const s=document.createElement('style');s.id='ymkStoreSyncStyle';s.textContent=`
    .ready-stock-grid{display:grid!important;grid-template-columns:repeat(3,300px)!important;gap:16px!important;align-items:stretch!important}
    .ready-stock-card{width:300px!important;min-width:300px!important;max-width:300px!important;min-height:390px!important;padding:15px!important;border:1px solid #f2ccdc!important;border-radius:19px!important;background:#fff!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;box-shadow:0 10px 26px rgba(190,105,145,.08)!important}
    .ymk-store-image{height:190px!important;width:100%!important;border-radius:16px!important;background:#fff8fb!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;margin-bottom:11px!important}
    .ymk-store-image img{width:100%!important;height:100%!important;object-fit:contain!important;display:block!important}
    .ymk-store-name{font-size:18px!important;font-weight:850!important;color:#6f4658!important;line-height:1.35!important;margin-bottom:8px!important}
    .ymk-store-status{align-self:flex-start!important;display:inline-flex!important;padding:5px 9px!important;border-radius:999px!important;background:#ffe6f0!important;color:#c45f87!important;font-size:11px!important;font-weight:850!important;margin-bottom:8px!important}
    .ymk-store-desc{font-size:13px!important;color:#8f6a79!important;line-height:1.45!important;margin-bottom:14px!important;min-height:20px!important}
    .ymk-store-bottom{margin-top:auto!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important}
    .ymk-store-price{font-size:21px!important;font-weight:900!important;color:#dd6f9b!important;white-space:nowrap!important}
    .ready-stock-order-btn{height:44px!important;min-width:120px!important;border:0!important;border-radius:999px!important;background:#e27ca5!important;color:#fff!important;font-weight:850!important;padding:0 18px!important}
    .ready-stock-order-btn:disabled{background:#efb3ca!important;color:#fff!important;cursor:not-allowed!important}
    @media(max-width:980px){.ready-stock-grid{grid-template-columns:repeat(2,300px)!important}}
    @media(max-width:660px){.ready-stock-grid{grid-template-columns:1fr!important}.ready-stock-card{width:100%!important;min-width:0!important;max-width:none!important}}
  `;document.head.appendChild(s);}
  function card(p){const cat=norm(p.category),status=p.status||'ready',label=status==='out'?'หมดชั่วคราว':status==='paused'?'ปิดชั่วคราว':'พร้อมเติม',disabled=status!=='ready';return `<article class="ready-stock-card${disabled?' is-soldout':''}" data-ymk-product="${esc(p.id)}" data-category="${esc(cat)}" data-ready-category="${esc(cat)}"><div class="ymk-store-image">${p.image?`<img src="${esc(p.image)}" alt="${esc(p.name||'สินค้า')}" style="object-position:center ${esc(p.imagePosition||'center')}">`:''}</div><div class="ymk-store-name">${esc(p.name||'สินค้า')}</div><span class="ready-stock-status ymk-store-status ${disabled?'is-out':'is-ready'}">${label}</span><div class="ymk-store-desc">${esc(p.description||'พร้อมเติมทันที')}</div><div class="ymk-store-bottom"><strong class="ymk-store-price">${Number(p.price||0).toLocaleString('th-TH')} บาท</strong><button type="button" class="ready-stock-order-btn" data-ready-name="${esc(p.name||'สินค้า')}" data-ready-price="${Number(p.price||0)}" data-ready-category="${esc(cat)}" ${disabled?'disabled':''}>${disabled?label:'สั่งซื้อ'}</button></div></article>`;}
  function categories(){const out=[];BASE_ORDER.forEach(c=>{if(!out.includes(c))out.push(c);});savedCategories().forEach(x=>{const c=norm(x.id);if(c!=='all'&&!out.includes(c))out.push(c);});items.forEach(p=>{const c=norm(p.category);if(c!=='all'&&!out.includes(c))out.push(c);});return out;}
  function renderTabs(){const h=host();if(!h)return;const cats=categories();if(!cats.includes(active))active=cats[0]||'echoes';h.innerHTML='';cats.forEach(c=>{const b=document.createElement('button');b.type='button';b.className='ready-stock-tab'+(c===active?' active':'');b.dataset.category=c;b.textContent=categoryName(c);b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();active=c;renderTabs();renderProducts();});h.appendChild(b);});}
  function renderProducts(){const g=grid();if(!g)return;const rows=items.filter(p=>usable(p)&&norm(p.category)===active).sort((a,b)=>(a.order||0)-(b.order||0));g.innerHTML=rows.length?rows.map(card).join(''):'<div style="grid-column:1/-1;padding:28px;text-align:center;color:#aa7c8e">ยังไม่มีสินค้าในหมวดนี้ ♡</div>';document.dispatchEvent(new CustomEvent('ymk-storefront-products-rendered'));}
  function start(){injectStyle();if(!ready())return setTimeout(start,250);db.collection('products').onSnapshot(s=>{items=s.docs.map(d=>({id:d.id,...d.data()}));renderTabs();renderProducts();},e=>console.warn('storefront category sync failed',e));window.addEventListener('storage',e=>{if(e.key===STORAGE)renderTabs();});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();