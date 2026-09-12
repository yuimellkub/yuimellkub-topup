(function(){
  let products=[];
  const PACKS=[
    {amount:7249,price:2925},
    {amount:3663,price:1475},
    {amount:2227,price:885},
    {amount:759,price:295},
    {amount:335,price:145},
    {amount:203,price:90},
    {amount:66,price:30}
  ];

  function moneyNumber(v){
    const n=Number(String(v??'').replace(/[^0-9.]/g,''));
    return Number.isFinite(n)?n:0;
  }
  function cleanName(v){return String(v||'').replace(/\s*[×xX]\s*\d+\s*$/,'').trim();}
  function buttonAmountFromName(name){
    const text=cleanName(name);
    const labeled=text.match(/(\d[\d,]*)\s*(?:กระดุม|ปุ่ม|buttons?)/i);
    if(labeled) return Number(labeled[1].replace(/,/g,''));
    const nums=[...text.matchAll(/\d[\d,]*/g)];
    if(!nums.length) return 0;
    return Number(nums[nums.length-1][0].replace(/,/g,''))||0;
  }
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
  function bestPlan(target){
    target=Math.max(1,Math.floor(Number(target)||1));
    const maxPack=Math.max(...PACKS.map(x=>x.amount));
    const limit=target+maxPack;
    const INF=1e15;
    const cost=new Array(limit+1).fill(INF);
    const count=new Array(limit+1).fill(1e9);
    const prev=new Array(limit+1).fill(null);
    cost[0]=0; count[0]=0;
    for(let s=0;s<=limit;s++){
      if(cost[s]===INF) continue;
      for(let i=0;i<PACKS.length;i++){
        const n=s+PACKS[i].amount;
        if(n>limit) continue;
        const c=cost[s]+PACKS[i].price;
        const k=count[s]+1;
        if(c<cost[n] || (c===cost[n] && k<count[n])){
          cost[n]=c; count[n]=k; prev[n]={from:s,pack:i};
        }
      }
    }
    let best=-1;
    for(let s=target;s<=limit;s++){
      if(cost[s]===INF) continue;
      if(best<0 || cost[s]<cost[best] || (cost[s]===cost[best] && (s<best || (s===best && count[s]<count[best])))) best=s;
    }
    if(best<0) return null;
    const qty=new Array(PACKS.length).fill(0);
    let cur=best;
    while(cur>0 && prev[cur]){qty[prev[cur].pack]++;cur=prev[cur].from;}
    const lines=PACKS.map((p,i)=>qty[i]?`${p.amount}×${qty[i]}`:'').filter(Boolean);
    return {target,received:best,price:cost[best],qty,lines,text:lines.join(' + ')};
  }
  function isAutoPriced(p){return p && ['skins','accessories'].includes(String(p.category||''));}
  function currentPricing(btn,q){
    const p=findProduct(btn);
    if(isAutoPriced(p)){
      const each=buttonAmountFromName(p.name);
      if(each>0){
        const plan=bestPlan(each*q);
        if(plan) return {auto:true,each,plan,total:plan.price};
      }
    }
    const unit=moneyNumber(btn.dataset.ymkUnitPrice || btn.dataset.readyPrice);
    return {auto:false,each:0,plan:null,total:unit*q,unit};
  }
  function ensurePlanEl(card,wrap){
    let el=card.querySelector('.ymk-pack-plan');
    if(!el){
      el=document.createElement('div');
      el.className='ymk-pack-plan';
      el.style.cssText='width:100%;margin-top:5px;padding:8px 10px;border-radius:10px;background:#fff8fb;border:1px solid #f2ccdc;color:#8f5d71;font-size:11px;line-height:1.5;display:none;';
      wrap.appendChild(el);
    }
    return el;
  }
  function updateControl(card){
    const btn=card.querySelector('.ready-stock-order-btn');
    const input=card.querySelector('.ymk-qty-input');
    if(!btn||!input) return;
    const max=maxFor(btn);
    input.max=String(max);
    const q=Math.max(1,Math.min(max,Math.floor(Number(input.value)||1)));
    input.value=String(q);
    const pricing=currentPricing(btn,q);
    const totalEl=card.querySelector('.ymk-qty-total');
    if(totalEl) totalEl.textContent=(q>1||pricing.auto)?('รวม '+pricing.total+' บาท'):'';
    const wrap=card.querySelector('.ymk-qty-wrap');
    const planEl=wrap && ensurePlanEl(card,wrap);
    if(planEl){
      if(pricing.auto && pricing.plan){
        const extra=pricing.plan.received-pricing.plan.target;
        planEl.style.display='block';
        planEl.innerHTML='<b>แพ็กที่เติม:</b> '+pricing.plan.text+' กระดุม<br><b>ต้องใช้:</b> '+pricing.plan.target.toLocaleString('th-TH')+' • <b>ได้รับ:</b> '+pricing.plan.received.toLocaleString('th-TH')+(extra>0?' (เกิน '+extra.toLocaleString('th-TH')+')':'')+'<br><b>ราคาคำนวณ:</b> '+pricing.plan.price.toLocaleString('th-TH')+' บาท';
      }else planEl.style.display='none';
    }
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
    const base=btn.dataset.ymkBaseName || cleanName(btn.dataset.readyName||'สินค้า');
    const pricing=currentPricing(btn,q);

    btn.dataset.readyPrice=String(pricing.total);
    btn.dataset.readyName=q>1 ? (base+' × '+q) : base;

    setTimeout(()=>{
      try{
        if(typeof lastOrder!=='undefined' && lastOrder){
          lastOrder.quantity=q;
          lastOrder.item=q>1 ? (base+' × '+q) : base;
          lastOrder.price=pricing.total;
          if(pricing.auto && pricing.plan){
            lastOrder.unitButtonAmount=pricing.each;
            lastOrder.requiredButtons=pricing.plan.target;
            lastOrder.receivedButtons=pricing.plan.received;
            lastOrder.packPlan=pricing.plan.text;
          }else{
            lastOrder.unitPrice=pricing.unit;
          }
        }
      }catch(_){ }
      btn.dataset.readyPrice=String(btn.dataset.ymkUnitPrice||'0');
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

  window.YMK_BUTTON_PACKS={packs:PACKS,bestPlan,buttonAmountFromName};
  const observer=new MutationObserver(scan);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{scan();observer.observe(document.body,{childList:true,subtree:true});loadProducts();});
  else {scan();observer.observe(document.body,{childList:true,subtree:true});loadProducts();}
})();
