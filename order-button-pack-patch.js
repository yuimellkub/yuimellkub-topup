(function(){
  let products=[];
  const FALLBACK_PACKS=[
    {amount:7249,price:2925},{amount:3663,price:1475},{amount:2227,price:885},
    {amount:759,price:295},{amount:335,price:145},{amount:203,price:90},{amount:66,price:30}
  ];

  function normalize(v){return String(v||'').trim();}
  function cleanOrderName(v){return normalize(v).replace(/\s*[×xX]\s*\d+\s*$/,'').trim();}
  function buttonAmountFromName(name){
    if(window.YMK_BUTTON_PACKS?.buttonAmountFromName) return window.YMK_BUTTON_PACKS.buttonAmountFromName(name);
    const text=normalize(name);
    const labeled=text.match(/(\d[\d,]*)\s*(?:กระดุม|ปุ่ม|buttons?)/i);
    if(labeled) return Number(labeled[1].replace(/,/g,''));
    const nums=[...text.matchAll(/\d[\d,]*/g)];
    if(!nums.length) return 0;
    return Number(nums[nums.length-1][0].replace(/,/g,''))||0;
  }
  function bestPlan(target){
    if(window.YMK_BUTTON_PACKS?.bestPlan) return window.YMK_BUTTON_PACKS.bestPlan(target);
    const packs=FALLBACK_PACKS;
    target=Math.max(1,Math.floor(Number(target)||1));
    const limit=target+Math.max(...packs.map(x=>x.amount));
    const INF=1e15;
    const cost=new Array(limit+1).fill(INF), count=new Array(limit+1).fill(1e9), prev=new Array(limit+1).fill(null);
    cost[0]=0; count[0]=0;
    for(let s=0;s<=limit;s++){
      if(cost[s]===INF) continue;
      for(let i=0;i<packs.length;i++){
        const n=s+packs[i].amount;
        if(n>limit) continue;
        const c=cost[s]+packs[i].price, k=count[s]+1;
        if(c<cost[n] || (c===cost[n] && k<count[n])){cost[n]=c;count[n]=k;prev[n]={from:s,pack:i};}
      }
    }
    let best=-1;
    for(let s=target;s<=limit;s++) if(cost[s]!==INF && (best<0 || cost[s]<cost[best] || (cost[s]===cost[best] && (s<best || (s===best && count[s]<count[best]))))) best=s;
    if(best<0) return null;
    const qty=new Array(packs.length).fill(0); let cur=best;
    while(cur>0&&prev[cur]){qty[prev[cur].pack]++;cur=prev[cur].from;}
    const text=packs.map((p,i)=>qty[i]?`${p.amount}×${qty[i]}`:'').filter(Boolean).join(' + ');
    return {target,received:best,price:cost[best],qty,text};
  }
  function findProduct(order){
    const item=cleanOrderName(order?.item);
    const pack=cleanOrderName(order?.pack);
    return products.find(p=>{
      const name=normalize(p.name);
      return name && (name===item || name===pack);
    }) || null;
  }
  function patchCurrentOrder(){
    try{
      if(typeof lastOrder==='undefined' || !lastOrder) return;
      const p=findProduct(lastOrder);
      if(!p || !['skins','accessories'].includes(String(p.category||''))) return;
      const each=buttonAmountFromName(p.name);
      if(!each) return;
      const qty=Math.max(1,Math.floor(Number(lastOrder.quantity)||1));
      const target=each*qty;
      const plan=bestPlan(target);
      if(!plan) return;
      const extra=plan.received-plan.target;
      lastOrder.requiredButtons=plan.target;
      lastOrder.receivedButtons=plan.received;
      lastOrder.packPlan=plan.text;
      lastOrder.buttonPack=plan.target;
      lastOrder.price=plan.price;
      lastOrder.pack=plan.text+' กระดุม = '+plan.received.toLocaleString('th-TH')+' กระดุม'+(extra>0?' (เกิน '+extra.toLocaleString('th-TH')+')':'');
    }catch(e){console.warn('button pack patch failed',e);}
  }

  function loadProducts(){
    try{
      if(!window.firebase || !firebase.firestore) return setTimeout(loadProducts,250);
      if(!firebase.apps.length){
        if(!window.YUIMELLKUB_FIREBASE_CONFIG) return setTimeout(loadProducts,250);
        firebase.initializeApp(window.YUIMELLKUB_FIREBASE_CONFIG);
      }
      firebase.firestore().collection('products').onSnapshot(snap=>{
        products=snap.docs.map(d=>({id:d.id,...d.data()}));
      },e=>console.warn('product lookup for button pack failed',e));
    }catch(e){setTimeout(loadProducts,500);}
  }

  function install(){
    if(typeof window.saveOrderToDemoAdmin!=='function') return setTimeout(install,250);
    if(window.saveOrderToDemoAdmin.__ymkButtonPackWrapped) return;
    const original=window.saveOrderToDemoAdmin;
    async function wrapped(){
      patchCurrentOrder();
      return original.apply(this,arguments);
    }
    wrapped.__ymkButtonPackWrapped=true;
    window.saveOrderToDemoAdmin=wrapped;
  }

  loadProducts();
  install();
})();
