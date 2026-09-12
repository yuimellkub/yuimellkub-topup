(function(){
  let products=[];

  function moneyNumber(v){
    const n=Number(String(v??'').replace(/[^0-9.]/g,''));
    return Number.isFinite(n)?n:0;
  }
  function cleanName(v){return String(v||'').replace(/\s*[×xX]\s*\d+\s*$/,'').trim();}
  function findProduct(btn){
    const name=cleanName(btn.dataset.readyName||'');
    const category=String(btn.dataset.readyCategory||'echoes');
    const unit=moneyNumber(btn.dataset.ymkUnitPrice || btn.dataset.readyPrice);
    return products.find(p=>String(p.name||'').trim()===name && String(p.category||'echoes')===category && moneyNumber(p.price)===unit)
      || products.find(p=>String(p.name||'').trim()===name && String(p.category||'echoes')===category)
      || null;
  }
  function maxFor(btn){
    const p=findProduct(btn);
    if(!p || p.unlimitedStock===true || p.stock==null) return 99;
    const n=Math.max(0,Math.floor(Number(p.stock)||0));
    return Math.max(1,n);
  }
  function updateControl(card){
    const btn=card.querySelector('.ready-stock-order-btn');
    const input=card.querySelector('.ymk-qty-input');
    if(!btn||!input) return;
    const max=maxFor(btn);
    input.max=String(max);
    let q=Math.max(1,Math.min(max,Math.floor(Number(input.value)||1)));
    input.value=String(q);
    const unit=moneyNumber(btn.dataset.ymkUnitPrice || btn.dataset.readyPrice);
    const total=unit*q;
    const totalEl=card.querySelector('.ymk-qty-total');
    if(totalEl) totalEl.textContent=q>1?('รวม '+total+' บาท'):'';
  }
  function ensureCard(card){
    if(!card || card.querySelector('.ymk-qty-wrap')) return;
    const btn=card.querySelector('.ready-stock-order-btn');
    if(!btn) return;
    if(!btn.dataset.ymkUnitPrice) btn.dataset.ymkUnitPrice=String(btn.dataset.readyPrice||'0');
    if(!btn.dataset.ymkBaseName) btn.dataset.ymkBaseName=cleanName(btn.dataset.readyName||'สินค้า');

    const wrap=document.createElement('div');
    wrap.className='ymk-qty-wrap';
    wrap.style.cssText='display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:9px 0 10px;';
    wrap.innerHTML='<span style="font-size:12px;font-weight:800;color:#8f5d71">จำนวน</span>'+
      '<button type="button" class="ymk-qty-minus" style="min-width:34px;width:34px;height:34px;padding:0;border-radius:10px;background:#fff0f6;color:#92566e;border:1px solid #efc8d7">−</button>'+
      '<input class="ymk-qty-input" type="number" min="1" max="99" value="1" inputmode="numeric" style="width:58px;height:34px;padding:4px 6px;text-align:center;border:1px solid #efc8d7;border-radius:10px;font:inherit;color:#71465a;background:#fff">'+
      '<button type="button" class="ymk-qty-plus" style="min-width:34px;width:34px;height:34px;padding:0;border-radius:10px;background:#fff0f6;color:#92566e;border:1px solid #efc8d7">+</button>'+
      '<span class="ymk-qty-total" style="font-size:12px;font-weight:850;color:#d96f9a;margin-left:auto"></span>';
    btn.parentNode.insertBefore(wrap,btn);

    const input=wrap.querySelector('.ymk-qty-input');
    wrap.querySelector('.ymk-qty-minus').addEventListener('click',()=>{input.value=String(Math.max(1,(Number(input.value)||1)-1));updateControl(card);});
    wrap.querySelector('.ymk-qty-plus').addEventListener('click',()=>{input.value=String(Math.min(maxFor(btn),(Number(input.value)||1)+1));updateControl(card);});
    input.addEventListener('input',()=>updateControl(card));
    updateControl(card);
  }
  function scan(){document.querySelectorAll('.ready-stock-card').forEach(ensureCard);}

  document.addEventListener('click',e=>{
    const btn=e.target.closest('.ready-stock-order-btn');
    if(!btn) return;
    const card=btn.closest('.ready-stock-card');
    const input=card?.querySelector('.ymk-qty-input');
    const q=Math.max(1,Math.min(maxFor(btn),Math.floor(Number(input?.value)||1)));
    const unit=moneyNumber(btn.dataset.ymkUnitPrice || btn.dataset.readyPrice);
    const base=btn.dataset.ymkBaseName || cleanName(btn.dataset.readyName||'สินค้า');

    btn.dataset.readyPrice=String(unit*q);
    btn.dataset.readyName=q>1 ? (base+' × '+q) : base;

    setTimeout(()=>{
      try{
        if(typeof lastOrder!=='undefined' && lastOrder){
          lastOrder.quantity=q;
          lastOrder.unitPrice=unit;
          lastOrder.price=unit*q;
          if(q>1 && !String(lastOrder.item||'').match(/×\s*\d+\s*$/)) lastOrder.item=base+' × '+q;
        }
      }catch(_){ }
      btn.dataset.readyPrice=String(unit);
      btn.dataset.readyName=base;
    },0);
  },true);

  function loadProducts(){
    try{
      if(!window.firebase||!firebase.firestore) return setTimeout(loadProducts,250);
      if(!firebase.apps.length){
        if(!window.YUIMELLKUB_FIREBASE_CONFIG) return setTimeout(loadProducts,250);
        firebase.initializeApp(window.YUIMELLKUB_FIREBASE_CONFIG);
      }
      firebase.firestore().collection('products').onSnapshot(snap=>{
        products=snap.docs.map(d=>({id:d.id,...d.data()}));
        document.querySelectorAll('.ready-stock-card').forEach(updateControl);
      });
    }catch(e){setTimeout(loadProducts,500);}
  }

  const observer=new MutationObserver(scan);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{scan();observer.observe(document.body,{childList:true,subtree:true});loadProducts();});
  else {scan();observer.observe(document.body,{childList:true,subtree:true});loadProducts();}
})();
