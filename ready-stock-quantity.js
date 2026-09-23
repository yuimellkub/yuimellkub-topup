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
    picker.style.cssText='display:none;box-sizing:border-box;position:relative;z-index:3';
    picker.innerHTML='<div class="ymk-instant-row"><span>จำนวน</span><button type="button" class="ymk-instant-minus">−</button><input class="ymk-instant-input" type="text" inputmode="numeric" value="1"><button type="button" class="ymk-instant-plus">+</button></div><div class="ymk-instant-total"></div><button type="button" class="ymk-instant-confirm">ยืนยันสั่งซื้อ</button>';
    bottom.appendChild(picker);
    const row=picker.querySelector('.ymk-instant-row'),input=picker.querySelector('.ymk-instant-input'),label=row.querySelector('span');
    row.style.setProperty('display','flex','important');row.style.setProperty('align-items','center','important');row.style.setProperty('justify-content','flex-end','important');row.style.setProperty('gap','7px','important');row.style.setProperty('width','100%','important');row.style.setProperty('white-space','nowrap','important');row.style.setProperty('margin','0 0 6px','important');
    label.style.setProperty('font-size','12px','important');label.style.setProperty('font-weight','800','important');label.style.setProperty('color','#8f5d71','important');label.style.setProperty('width','auto','important');label.style.setProperty('min-width','0','important');label.style.setProperty('flex','0 0 auto','important');
    picker.querySelectorAll('.ymk-instant-minus,.ymk-instant-plus').forEach(x=>{x.style.setProperty('width','32px','important');x.style.setProperty('min-width','32px','important');x.style.setProperty('max-width','32px','important');x.style.setProperty('height','32px','important');x.style.setProperty('min-height','32px','important');x.style.setProperty('padding','0','important');x.style.setProperty('margin','0','important');x.style.setProperty('flex','0 0 32px','important');x.style.setProperty('border','0','important');x.style.setProperty('border-radius','50%','important');x.style.setProperty('background','#e27ca5','important');x.style.setProperty('color','#fff','important');x.style.setProperty('font-size','18px','important');x.style.setProperty('font-weight','900','important');x.style.setProperty('line-height','32px','important');x.style.setProperty('text-align','center','important');x.style.setProperty('box-sizing','border-box','important');});
    input.style.setProperty('width','44px','important');input.style.setProperty('min-width','44px','important');input.style.setProperty('max-width','44px','important');input.style.setProperty('height','32px','important');input.style.setProperty('padding','0','important');input.style.setProperty('margin','0','important');input.style.setProperty('flex','0 0 44px','important');input.style.setProperty('border','1px solid #e7a6bf','important');input.style.setProperty('border-radius','12px','important');input.style.setProperty('background','#fff','important');input.style.setProperty('text-align','center','important');input.style.setProperty('color','#70495a','important');input.style.setProperty('font-size','15px','important');input.style.setProperty('box-sizing','border-box','important');
    const total=picker.querySelector('.ymk-instant-total'),confirmBtn=picker.querySelector('.ymk-instant-confirm');
    total.style.setProperty('font-size','11px','important');total.style.setProperty('font-weight','800','important');total.style.setProperty('color','#c85f88','important');total.style.setProperty('margin-top','4px','important');total.style.setProperty('text-align','right','important');
    confirmBtn.style.setProperty('display','block','important');confirmBtn.style.setProperty('width','100%','important');confirmBtn.style.setProperty('min-width','0','important');confirmBtn.style.setProperty('max-width','100%','important');confirmBtn.style.setProperty('height','42px','important');confirmBtn.style.setProperty('margin','0','important');confirmBtn.style.setProperty('padding','0','important');confirmBtn.style.setProperty('border','0','important');confirmBtn.style.setProperty('border-radius','999px','important');confirmBtn.style.setProperty('background','#e27ca5','important');confirmBtn.style.setProperty('color','#fff','important');confirmBtn.style.setProperty('font-weight','850','important');confirmBtn.style.setProperty('box-sizing','border-box','important');
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
    bottom.style.setProperty('overflow','visible','important');
    if(mobile){
      bottom.style.setProperty('grid-template-columns','1fr','important');
      bottom.style.setProperty('grid-template-rows','auto auto','important');
      if(price){price.style.setProperty('grid-column','1','important');price.style.setProperty('grid-row','1','important');price.style.setProperty('width','100%','important');}
      picker.style.setProperty('grid-column','1','important');picker.style.setProperty('grid-row','2','important');picker.style.setProperty('width','100%','important');picker.style.setProperty('max-width','100%','important');picker.style.setProperty('margin','0','important');
      const row=picker.querySelector('.ymk-instant-row');if(row)row.style.setProperty('justify-content','center','important');
    }else{
      bottom.style.setProperty('grid-template-columns','minmax(0,1fr) 216px','important');
      bottom.style.setProperty('grid-template-rows','auto','important');
      if(price){price.style.setProperty('grid-column','1','important');price.style.setProperty('grid-row','1','important');price.style.setProperty('min-width','0','important');price.style.setProperty('white-space','nowrap','important');}
      picker.style.setProperty('grid-column','2','important');picker.style.setProperty('grid-row','1','important');picker.style.setProperty('width','216px','important');picker.style.setProperty('min-width','216px','important');picker.style.setProperty('max-width','216px','important');picker.style.setProperty('margin','0','important');
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