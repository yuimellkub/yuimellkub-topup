(function(){
  let db=null,items=[],active='echoes';
  const BASE_ORDER=['echoes','skins','accessories'];
  const BASE={echoes:'เติมกระดุม',skins:'เติมสกิน',accessories:'เติมประดับ'};
  function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function ready(){try{if(!window.firebase||!firebase.firestore)return false;if(!firebase.apps.length){if(!window.YUIMELLKUB_FIREBASE_CONFIG)return false;firebase.initializeApp(window.YUIMELLKUB_FIREBASE_CONFIG);}db=firebase.firestore();return true;}catch(e){return false;}}
  function usable(p){return p&&p.visible!==false&&!(String(p.name||'').trim()==='สินค้าใหม่'&&Number(p.price||0)===0);}
  function categoryName(id){const p=items.find(x=>x.category===id&&x.categoryLabel);return p?.categoryLabel||BASE[id]||id;}
  function host(){return document.querySelector('.ready-stock-tabs')||document.querySelector('.ready-stock-tab')?.parentElement;}
  function grid(){return document.querySelector('.ready-stock-grid');}
  function injectStyle(){if(document.getElementById('ymkStoreSyncStyle'))return;const s=document.createElement('style');s.id='ymkStoreSyncStyle';s.textContent=`
    .ready-stock-grid{display:grid!important;grid-template-columns:repeat(3,340px)!important;gap:20px!important;align-items:stretch!important}
    .ready-stock-card{width:340px!important;min-width:340px!important;max-width:340px!important;min-height:430px!important;padding:18px!important;border:1px solid #f2ccdc!important;border-radius:22px!important;background:#fff!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;box-shadow:0 10px 26px rgba(190,105,145,.08)!important}
    .ymk-store-image{height:225px!important;width:100%!important;border-radius:16px!important;background:#fff8fb!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;margin-bottom:14px!important}
    .ymk-store-image img{width:100%!important;height:100%!important;object-fit:contain!important;display:block!important}
    .ymk-store-name{font-size:18px!important;font-weight:850!important;color:#6f4658!important;line-height:1.35!important;margin-bottom:8px!important}
    .ymk-store-status{align-self:flex-start!important;display:inline-flex!important;padding:5px 9px!important;border-radius:999px!important;background:#ffe6f0!important;color:#c45f87!important;font-size:11px!important;font-weight:850!important;margin-bottom:8px!important}
    .ymk-store-desc{font-size:13px!important;color:#8f6a79!important;line-height:1.45!important;margin-bottom:14px!important;min-height:20px!important}
    .ymk-store-bottom{margin-top:auto!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important}
    .ymk-store-price{font-size:21px!important;font-weight:900!important;color:#dd6f9b!important;white-space:nowrap!important}
    .ready-stock-order-btn{height:44px!important;min-width:120px!important;border:0!important;border-radius:999px!important;background:#e27ca5!important;color:#fff!important;font-weight:850!important;padding:0 18px!important}
    .ready-stock-order-btn:disabled{background:#efb3ca!important;color:#fff!important;cursor:not-allowed!important}
    @media(max-width:1120px){.ready-stock-grid{grid-template-columns:repeat(2,340px)!important}}
    @media(max-width:760px){.ready-stock-grid{grid-template-columns:1fr!important}.ready-stock-card{width:100%!important;min-width:0!important;max-width:none!important}}
  `;document.head.appendChild(s);}
  function card(p){const status=p.status||'ready',label=status==='out'?'หมดชั่วคราว':status==='paused'?'ปิดชั่วคราว':'พร้อมเติม',disabled=status!=='ready';return `<article class="ready-stock-card${disabled?' is-soldout':''}" data-ymk-product="${esc(p.id)}"><div class="ymk-store-image">${p.image?`<img src="${esc(p.image)}" alt="${esc(p.name||'สินค้า')}" style="object-position:center ${esc(p.imagePosition||'center')}">`:''}</div><div class="ymk-store-name">${esc(p.name||'สินค้า')}</div><span class="ready-stock-status ymk-store-status ${disabled?'is-out':'is-ready'}">${label}</span><div class="ymk-store-desc">${esc(p.description||'พร้อมเติมทันที')}</div><div class="ymk-store-bottom"><strong class="ymk-store-price">${Number(p.price||0).toLocaleString('th-TH')} บาท</strong><button type="button" class="ready-stock-order-btn" data-ready-name="${esc(p.name||'สินค้า')}" data-ready-price="${Number(p.price||0)}" data-ready-category="${esc(p.category||'echoes')}" ${disabled?'disabled':''}>${disabled?label:'สั่งซื้อ'}</button></div></article>`;}
  function categories(){const custom=[];items.filter(usable).forEach(p=>{const c=String(p.category||'echoes');if(!BASE_ORDER.includes(c)&&!custom.includes(c))custom.push(c);});return [...BASE_ORDER,...custom];}
  function renderTabs(){const h=host();if(!h)return;const cats=categories();if(!cats.includes(active))active='echoes';h.innerHTML='';cats.forEach(c=>{const b=document.createElement('button');b.type='button';b.className='ready-stock-tab'+(c===active?' active':'');b.dataset.category=c;b.textContent=categoryName(c);b.addEventListener('click',()=>{active=c;renderTabs();renderProducts();});h.appendChild(b);});}
  function renderProducts(){const g=grid();if(!g)return;const rows=items.filter(p=>usable(p)&&(p.category||'echoes')===active).sort((a,b)=>(a.order||0)-(b.order||0));if(!rows.length){g.innerHTML='<div style="grid-column:1/-1;padding:28px;text-align:center;color:#aa7c8e">ยังไม่มีสินค้าในหมวดนี้ ♡</div>';return;}g.innerHTML=rows.map(card).join('');document.dispatchEvent(new CustomEvent('ymk-storefront-products-rendered'));}
  function start(){injectStyle();if(!ready())return setTimeout(start,250);db.collection('products').onSnapshot(s=>{items=s.docs.map(d=>({id:d.id,...d.data()}));renderTabs();renderProducts();},e=>console.warn('storefront category sync failed',e));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();