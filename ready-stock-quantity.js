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
    if(total)total.textContent=q>1?'รวม '+(unit*q).toLocaleString('th-TH')+' บาท':'';
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
    picker.style.cssText='display:none;grid-column:2/4;grid-row:1;width:216px;max-width:100%;margin:0 0 0 auto;box-sizing:border-box;position:relative;z-index:2';
    picker.innerHTML='<div class="ymk-instant-row"><span>จำนวน</span><button type="button" class="ymk-instant-minus">−</button><input class="ymk-instant-input" type="text" inputmode="numeric" value="1"><button type="button" class="ymk-instant-plus">+</button></div><button type="button" class="ymk-instant-confirm">ยืนยันสั่งซื้อ</button><div class="ymk-instant-total"></div>';
    bottom.appendChild(picker);
    const row=picker.querySelector('.ymk-instant-row'),input=picker.querySelector('.ymk-instant-input'),minus=picker.querySelector('.ymk-instant-minus'),plus=picker.querySelector('.ymk-instant-plus'),confirmBtn=picker.querySelector('.ymk-instant-confirm'),total=picker.querySelector('.ymk-instant-total');
    row.style.cssText='display:flex;align-items:center;justify-content:flex-end;gap:7px;width:100%;white-space:nowrap;margin-bottom:6px';
    row.querySelector('span').style.cssText='font-size:12px;font-weight:800;color:#8f5d71';
    [minus,plus].forEach(x=>x.style.cssText='width:32px;min-width:32px;height:32px;padding:0;flex:0 0 32px;border:0;border-radius:50%;background:#e27ca5;color:#fff;font:inherit;font-size:18px;line-height:32px;font-weight:900;text-align:center;cursor:pointer;box-sizing:border-box');
    input.style.cssText='width:44px;min-width:44px;height:32px;padding:0;flex:0 0 44px;box-sizing:border-box;border:1px solid #e7a6bf;border-radius:12px;background:#fff;text-align:center;color:#70495a;font:inherit;font-size:15px';
    confirmBtn.style.cssText='display:block;width:100%;height:42px;margin:0;padding:0;border:0;border-radius:999px;background:#e27ca5;color:#fff;font:inherit;font-weight:850;cursor:pointer;box-sizing:border-box';
    total.style.cssText='font-size:11px;font-weight:800;color:#c85f88;margin-top:4px;text-align:right';
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
    const price=bottom.querySelector('.ready-stock-price,.ymk-store-price,[class*="price"]');
    const mobile=window.matchMedia('(max-width:699px)').matches;
    bottom.style.setProperty('display','grid','important');
    bottom.style.setProperty('align-items','center','important');
    bottom.style.setProperty('gap','8px','important');
    bottom.style.setProperty('padding-top','12px','important');
    bottom.style.setProperty('overflow','visible','important');
    if(mobile){
      bottom.style.setProperty('grid-template-columns','minmax(0,1fr) minmax(0,1fr)','important');
      bottom.style.setProperty('grid-template-rows','auto auto','important');
      if(price){price.style.setProperty('grid-column','1 / -1','important');price.style.setProperty('grid-row','1','important');price.style.setProperty('min-width','0','important');price.style.setProperty('white-space','nowrap','important');price.style.setProperty('margin','0 0 2px','important');price.style.setProperty('padding','0','important');}
      picker.style.setProperty('grid-column','1 / -1','important');picker.style.setProperty('grid-row','2','important');picker.style.setProperty('width','100%','important');picker.style.setProperty('max-width','100%','important');picker.style.setProperty('margin','0','important');
      const row=picker.querySelector('.ymk-instant-row');if(row)row.style.setProperty('justify-content','center','important');
    }else{
      bottom.style.setProperty('grid-template-columns','minmax(0,1fr) 104px 104px','important');
      bottom.style.setProperty('grid-template-rows','auto','important');
      if(price){price.style.setProperty('grid-column','1','important');price.style.setProperty('grid-row','1','important');price.style.setProperty('min-width','0','important');price.style.setProperty('white-space','nowrap','important');price.style.setProperty('margin','0','important');price.style.setProperty('padding','0','important');}
      picker.style.setProperty('grid-column','2 / 4','important');picker.style.setProperty('grid-row','1','important');picker.style.setProperty('width','216px','important');picker.style.setProperty('max-width','100%','important');picker.style.setProperty('margin','0 0 0 auto','important');
      const row=picker.querySelector('.ymk-instant-row');if(row)row.style.setProperty('justify-content','flex-end','important');
    }
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