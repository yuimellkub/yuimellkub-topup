(function(){
  let products=[];
  const clean=v=>String(v||'').replace(/\s*[×xX]\s*\d+\s*$/,'').trim();
  const number=v=>{const n=Number(String(v??'').replace(/[^0-9.]/g,''));return Number.isFinite(n)?n:0;};

  function productFor(btn){
    const name=clean(btn.dataset.readyName||''),category=String(btn.dataset.readyCategory||'echoes');
    return products.find(p=>String(p.name||'').trim()===name&&String(p.category||'echoes')===category)
      ||products.find(p=>String(p.name||'').trim()===name)||null;
  }
  function maxFor(btn){
    const p=productFor(btn);
    if(!p||p.unlimitedStock===true||p.stock==null)return 99;
    return Math.max(1,Math.floor(Number(p.stock)||0));
  }
  function close(card){
    const picker=card?.querySelector('.ymk-instant-qty');
    const btn=card?.querySelector('.ready-stock-order-btn');
    const send=card?.querySelector('.ymk-send-choice');
    if(picker)picker.style.setProperty('display','none','important');
    if(btn){btn.style.removeProperty('display');delete btn.dataset.ymkInstantConfirming;}
    if(send)send.style.removeProperty('display');
  }
  function update(card){
    const btn=card.querySelector('.ready-stock-order-btn'),picker=card.querySelector('.ymk-instant-qty');
    const input=picker?.querySelector('.ymk-instant-input'),total=picker?.querySelector('.ymk-instant-total');
    if(!btn||!input)return;
    const q=Math.max(1,Math.min(maxFor(btn),Math.floor(Number(input.value)||1)));
    input.value=q;
    const unit=number(btn.dataset.ymkUnitPrice||btn.dataset.readyPrice);
    if(total)total.textContent='ยอดรวม '+(unit*q).toLocaleString('th-TH')+' บาท';
  }
  function confirm(card){
    const btn=card.querySelector('.ready-stock-order-btn'),input=card.querySelector('.ymk-instant-input');
    if(!btn||!input)return;
    const q=Math.max(1,Math.min(maxFor(btn),Math.floor(Number(input.value)||1)));
    const base=btn.dataset.ymkBaseName||clean(btn.dataset.readyName||'สินค้า');
    const unit=number(btn.dataset.ymkUnitPrice||btn.dataset.readyPrice),total=unit*q;
    window.YMK_SEND_SELECTION=null;window.YMK_SEND_ORDER_META=null;
    window.YMK_PENDING_ORDER_META={q,base,p:{unit,total},orderMode:'instant'};
    const oldName=btn.dataset.readyName,oldPrice=btn.dataset.readyPrice;
    btn.dataset.readyName=q>1?base+' × '+q:base;
    btn.dataset.readyPrice=String(total);
    btn.dataset.ymkConfirming='1';
    btn.dataset.ymkInstantConfirming='1';
    btn.click();
    setTimeout(()=>{
      btn.dataset.readyName=oldName||base;
      btn.dataset.readyPrice=oldPrice||String(unit);
      delete btn.dataset.ymkConfirming;
      close(card);
    },300);
  }
  function ensure(card){
    if(!card||card.querySelector('.ymk-instant-qty'))return;
    const btn=card.querySelector('.ready-stock-order-btn'),bottom=card.querySelector('.ymk-store-bottom');
    if(!btn||!bottom)return;
    btn.dataset.ymkUnitPrice=String(btn.dataset.readyPrice||0);
    btn.dataset.ymkBaseName=clean(btn.dataset.readyName||'สินค้า');
    const picker=document.createElement('div');
    picker.className='ymk-instant-qty';
    picker.style.cssText='display:none;grid-column:1/-1;width:100%;box-sizing:border-box;margin-top:8px';
    picker.innerHTML='<div style="display:flex;align-items:center;justify-content:center;gap:9px"><span style="font-size:12px;font-weight:850;color:#8f5d71">จำนวน</span><button type="button" class="ymk-instant-minus">−</button><input class="ymk-instant-input" type="text" inputmode="numeric" value="1"><button type="button" class="ymk-instant-plus">+</button></div><div class="ymk-instant-total"></div><button type="button" class="ymk-instant-confirm">ยืนยันสั่งซื้อ</button>';
    bottom.appendChild(picker);
    const input=picker.querySelector('.ymk-instant-input');
    picker.querySelectorAll('.ymk-instant-minus,.ymk-instant-plus').forEach(x=>x.style.cssText='width:36px;height:36px;padding:0;border:0;border-radius:50%;background:#e27ca5;color:#fff;font:inherit;font-size:19px;font-weight:900;cursor:pointer');
    input.style.cssText='width:52px;height:36px;padding:0;border:1px solid #e7a6bf;border-radius:12px;background:#fff;text-align:center;color:#70495a;font:inherit;font-weight:800;box-sizing:border-box';
    picker.querySelector('.ymk-instant-total').style.cssText='margin-top:7px;text-align:center;font-size:12px;font-weight:850;color:#c85f88';
    picker.querySelector('.ymk-instant-confirm').style.cssText='display:block;width:100%;height:44px;margin-top:8px;padding:0;border:0;border-radius:999px;background:#e27ca5;color:#fff;font:inherit;font-weight:850;cursor:pointer';
    picker.querySelector('.ymk-instant-minus').onclick=()=>{input.value=Math.max(1,(Number(input.value)||1)-1);update(card);};
    picker.querySelector('.ymk-instant-plus').onclick=()=>{input.value=Math.min(maxFor(btn),(Number(input.value)||1)+1);update(card);};
    input.oninput=()=>update(card);
    picker.querySelector('.ymk-instant-confirm').onclick=()=>confirm(card);
  }
  function open(card){
    ensure(card);
    document.querySelectorAll('.ready-stock-card').forEach(c=>{if(c!==card)close(c);});
    const btn=card.querySelector('.ready-stock-order-btn'),picker=card.querySelector('.ymk-instant-qty'),send=card.querySelector('.ymk-send-choice'),sendQty=card.querySelector('.ymk-send-qty'),bottom=card.querySelector('.ymk-store-bottom');
    if(!btn||!picker||!bottom)return;
    if(sendQty)sendQty.style.setProperty('display','none','important');
    if(send)send.style.setProperty('display','none','important');
    btn.style.setProperty('display','none','important');
    bottom.style.setProperty('display','grid','important');
    bottom.style.setProperty('grid-template-columns','1fr','important');
    bottom.style.setProperty('overflow','visible','important');
    picker.style.setProperty('display','block','important');
    update(card);
  }
  function scan(){document.querySelectorAll('.ready-stock-card').forEach(ensure);}
  document.addEventListener('click',e=>{
    const btn=e.target.closest('.ready-stock-order-btn');
    if(!btn||btn.disabled||btn.dataset.ymkInstantConfirming==='1'||btn.dataset.ymkConfirming==='1')return;
    const card=btn.closest('.ready-stock-card');if(!card)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    open(card);
  },true);
  function load(){
    try{
      if(!window.firebase||!firebase.firestore)return setTimeout(load,250);
      if(!firebase.apps.length){if(!window.YUIMELLKUB_FIREBASE_CONFIG)return setTimeout(load,250);firebase.initializeApp(window.YUIMELLKUB_FIREBASE_CONFIG);}
      firebase.firestore().collection('products').onSnapshot(s=>{products=s.docs.map(d=>({id:d.id,...d.data()}));});
    }catch(e){setTimeout(load,500);}
  }
  const observer=new MutationObserver(scan);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{scan();observer.observe(document.body,{childList:true,subtree:true});load();});
  else{scan();observer.observe(document.body,{childList:true,subtree:true});load();}
})();