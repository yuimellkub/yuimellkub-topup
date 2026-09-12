(function(){
  let products=[];
  const PACKS=[{amount:7249,price:2925},{amount:3663,price:1475},{amount:2227,price:885},{amount:759,price:295},{amount:335,price:145},{amount:203,price:90},{amount:66,price:30}];
  function num(v){const n=Number(String(v??'').replace(/[^0-9.]/g,''));return Number.isFinite(n)?n:0;}
  function clean(v){return String(v||'').replace(/\s*[×xX]\s*\d+\s*$/,'').trim();}
  function buttons(name){const t=clean(name);const m=t.match(/(\d[\d,]*)\s*(?:กระดุม|ปุ่ม|buttons?)/i);if(m)return Number(m[1].replace(/,/g,''));const a=[...t.matchAll(/\d[\d,]*/g)];return a.length?Number(a[a.length-1][0].replace(/,/g,''))||0:0;}
  function product(btn){const n=clean(btn.dataset.readyName||''),c=String(btn.dataset.readyCategory||'echoes');return products.find(p=>String(p.name||'').trim()===n&&String(p.category||'echoes')===c)||null;}
  function maxFor(btn){const p=product(btn);if(!p||p.unlimitedStock===true||p.stock==null)return 99;return Math.max(1,Math.max(0,Math.floor(Number(p.stock)||0)));}
  function bestPlan(target){
    target=Math.max(1,Math.floor(Number(target)||1));
    let best=null;
    PACKS.forEach(pack=>{
      const qty=Math.max(1,Math.ceil(target/pack.amount));
      const received=pack.amount*qty;
      const price=pack.price*qty;
      const candidate={target,received,price,qty:[qty],text:pack.amount+'×'+qty,packAmount:pack.amount,packQty:qty};
      if(!best || price<best.price || (price===best.price && (received<best.received || (received===best.received && qty<best.packQty)))) best=candidate;
    });
    return best;
  }
  function pricing(btn,q){const p=product(btn);if(p&&['skins','accessories'].includes(String(p.category||''))){const each=buttons(p.name);if(each){const plan=bestPlan(each*q);if(plan)return{auto:true,each,plan,total:plan.price};}}const unit=num(btn.dataset.ymkUnitPrice||btn.dataset.readyPrice);return{auto:false,total:unit*q,unit};}
  function update(card){const btn=card.querySelector('.ready-stock-order-btn'),input=card.querySelector('.ymk-qty-input');if(!btn||!input)return;const max=maxFor(btn),q=Math.max(1,Math.min(max,Math.floor(Number(input.value)||1)));input.max=max;input.value=q;const p=pricing(btn,q),total=card.querySelector('.ymk-qty-total');if(total)total.textContent=q>1?'รวม '+p.total.toLocaleString('th-TH')+' บาท':'';}
  function reset(card){const btn=card.querySelector('.ready-stock-order-btn'),wrap=card.querySelector('.ymk-qty-wrap'),input=card.querySelector('.ymk-qty-input');if(wrap)wrap.style.display='none';if(btn){btn.style.display='';btn.dataset.ymkQtyOpen='0';}if(input)input.value='1';}
  function patchOrderUI(meta){
    if(!meta?.p?.auto||!meta.p.plan)return;
    const packText=meta.p.plan.text;
    const packLine='แพ็ก: '+packText;
    try{
      if(typeof lastOrder!=='undefined'&&lastOrder){
        lastOrder.pack=packText;
        lastOrder.packPlan=packText;
        lastOrder.quantity=meta.q;
        lastOrder.item=meta.q>1?meta.base+' × '+meta.q:meta.base;
        lastOrder.price=meta.p.total;
        lastOrder.requiredButtons=meta.p.plan.target;
        lastOrder.receivedButtons=meta.p.plan.received;
      }
    }catch(_){ }
    document.querySelectorAll('textarea').forEach(el=>{
      if(!el.value||!el.value.includes('แพ็ก:'))return;
      el.value=el.value.replace(/แพ็ก:\s*[^\n\r]*/,'แพ็ก: '+packText);
      el.dispatchEvent(new Event('input',{bubbles:true}));
    });
    document.querySelectorAll('div,p,span').forEach(el=>{
      if(el.children.length)return;
      const t=(el.textContent||'').trim();
      if(/^แพ็ก:\s*/.test(t)) el.textContent=packLine;
    });
  }
  function doConfirm(card){
    const btn=card.querySelector('.ready-stock-order-btn'),input=card.querySelector('.ymk-qty-input');if(!btn)return;
    const q=Math.max(1,Math.min(maxFor(btn),Math.floor(Number(input?.value)||1))),base=btn.dataset.ymkBaseName||clean(btn.dataset.readyName||'สินค้า'),p=pricing(btn,q);
    const meta={q,base,p};
    btn.dataset.readyPrice=String(p.total);btn.dataset.readyName=q>1?base+' × '+q:base;btn.dataset.ymkConfirming='1';btn.click();
    setTimeout(()=>{
      patchOrderUI(meta);
      try{if(typeof lastOrder!=='undefined'&&lastOrder){lastOrder.quantity=q;lastOrder.item=q>1?base+' × '+q:base;lastOrder.price=p.total;if(p.auto&&p.plan){lastOrder.unitButtonAmount=p.each;lastOrder.requiredButtons=p.plan.target;lastOrder.receivedButtons=p.plan.received;lastOrder.packPlan=p.plan.text;lastOrder.pack=p.plan.text;}else lastOrder.unitPrice=p.unit;}}catch(_){}
      setTimeout(()=>patchOrderUI(meta),80);
      btn.dataset.readyPrice=String(btn.dataset.ymkUnitPrice||0);btn.dataset.readyName=base;delete btn.dataset.ymkConfirming;reset(card);
    },0);
  }
  function ensure(card){
    if(!card||card.querySelector('.ymk-qty-wrap'))return;const btn=card.querySelector('.ready-stock-order-btn');if(!btn)return;
    if(!btn.dataset.ymkUnitPrice)btn.dataset.ymkUnitPrice=String(btn.dataset.readyPrice||0);if(!btn.dataset.ymkBaseName)btn.dataset.ymkBaseName=clean(btn.dataset.readyName||'สินค้า');btn.dataset.ymkQtyOpen='0';
    const wrap=document.createElement('div');wrap.className='ymk-qty-wrap';wrap.style.cssText='display:none;flex:0 0 100%;width:100%;max-width:100%;min-width:0;box-sizing:border-box;margin:10px 0 0;align-self:stretch;';
    wrap.innerHTML='<div style="display:flex;align-items:center;gap:6px;flex-wrap:nowrap;justify-content:flex-start;max-width:100%;overflow:hidden"><span style="font-size:12px;font-weight:800;color:#8f5d71;white-space:nowrap">จำนวน</span><button type="button" class="ymk-qty-minus" style="min-width:30px;width:30px;height:30px;padding:0;border-radius:9px;background:#fff0f6;color:#92566e;border:1px solid #efc8d7;display:inline-flex;align-items:center;justify-content:center">−</button><input class="ymk-qty-input" type="number" min="1" max="99" value="1" inputmode="numeric" style="width:44px;min-width:44px;height:30px;padding:2px;text-align:center;border:1px solid #efc8d7;border-radius:9px;font:inherit;font-size:13px;color:#71465a;background:#fff"><button type="button" class="ymk-qty-plus" style="min-width:30px;width:30px;height:30px;padding:0;border-radius:9px;background:#fff0f6;color:#92566e;border:1px solid #efc8d7;display:inline-flex;align-items:center;justify-content:center">+</button><span class="ymk-qty-total" style="font-size:11px;font-weight:850;color:#d96f9a;margin-left:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></span></div><button type="button" class="ymk-confirm-order" style="display:block;box-sizing:border-box;width:100%;max-width:100%;min-width:0;height:42px;margin:8px 0 0;padding:0 12px;border:0;border-radius:12px;background:#e889ad;color:#fff;font-weight:850;cursor:pointer;white-space:nowrap">ยืนยันสั่งซื้อ</button>';
    const parent=btn.parentNode;parent.insertBefore(wrap,btn.nextSibling);const input=wrap.querySelector('.ymk-qty-input');
    wrap.querySelector('.ymk-qty-minus').onclick=()=>{input.value=Math.max(1,(Number(input.value)||1)-1);update(card);};
    wrap.querySelector('.ymk-qty-plus').onclick=()=>{input.value=Math.min(maxFor(btn),(Number(input.value)||1)+1);update(card);};
    input.oninput=()=>update(card);wrap.querySelector('.ymk-confirm-order').onclick=()=>doConfirm(card);update(card);
  }
  function scan(){document.querySelectorAll('.ready-stock-card').forEach(ensure);}
  document.addEventListener('click',e=>{const btn=e.target.closest('.ready-stock-order-btn');if(!btn)return;if(btn.dataset.ymkConfirming==='1')return;const card=btn.closest('.ready-stock-card'),wrap=card?.querySelector('.ymk-qty-wrap');e.preventDefault();e.stopImmediatePropagation();if(btn.dataset.ymkQtyOpen!=='1'){btn.dataset.ymkQtyOpen='1';if(wrap)wrap.style.display='block';btn.style.display='none';update(card);}},true);
  function load(){try{if(!window.firebase||!firebase.firestore)return setTimeout(load,250);if(!firebase.apps.length){if(!window.YUIMELLKUB_FIREBASE_CONFIG)return setTimeout(load,250);firebase.initializeApp(window.YUIMELLKUB_FIREBASE_CONFIG);}firebase.firestore().collection('products').onSnapshot(s=>{products=s.docs.map(d=>({id:d.id,...d.data()}));document.querySelectorAll('.ready-stock-card').forEach(update);});}catch(e){setTimeout(load,500);}}
  window.YMK_BUTTON_PACKS={packs:PACKS,bestPlan,buttonAmountFromName:buttons};const o=new MutationObserver(scan);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{scan();o.observe(document.body,{childList:true,subtree:true});load();});else{scan();o.observe(document.body,{childList:true,subtree:true});load();}
})();