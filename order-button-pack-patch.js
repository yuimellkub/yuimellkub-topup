(function(){
  let products=[];
  const cats=new Set(['skins','skin','accessories','accessory','pets','pet','room','rooms','house','houses','home','furniture']);

  function normalize(v){return String(v||'').trim();}
  function cleanOrderName(v){return normalize(v).replace(/\s*[×xX]\s*\d+\s*$/,'').trim();}
  function buttonAmountFromName(name){
    const t=normalize(name);
    const m=t.match(/(\d[\d,]*)\s*(?:กระดุม|ปุ่ม|buttons?)/i);
    if(m)return Number(m[1].replace(/,/g,''));
    const a=[...t.matchAll(/\d[\d,]*/g)];
    return a.length?Number(a[a.length-1][0].replace(/,/g,''))||0:0;
  }

  function bestPlan(target){
    target=Math.max(1,Math.floor(Number(target)||1));
    const rules=window.YMK_CALCULATOR_PACK_RULES;
    if(rules?.findBest){
      const best=rules.findBest(target);
      return {
        target,
        received:best.totalEchoes,
        price:best.cost,
        text:rules.formatLargestFirst?rules.formatLargestFirst(best):''
      };
    }
    return null;
  }

  function findProduct(order){
    const item=cleanOrderName(order?.item),pack=cleanOrderName(order?.pack);
    return products.find(p=>{
      const name=normalize(p.name);
      return name&&(name===item||name===pack);
    })||null;
  }

  function isTargetProduct(p){
    if(!p)return false;
    const cat=String(p.category||'').toLowerCase().trim();
    if(cat==='echoes')return false;
    if(cats.has(cat))return true;
    return /สกิน|ประดับ|สัตว์เลี้ยง|ห้อง/.test(String(p.categoryLabel||''));
  }

  function patchCurrentOrder(){
    try{
      if(typeof lastOrder==='undefined'||!lastOrder)return;

      // ใช้ข้อมูลที่คำนวณไว้ตอนกดสั่งซื้อก่อน เพื่อไม่ให้แพ็ก/ราคาโดนเขียนทับ
      const forced=window.YMK_FORCED_PACK_META;
      if(forced?.plan?.text){
        lastOrder.requiredButtons=forced.plan.target;
        lastOrder.receivedButtons=forced.plan.received;
        lastOrder.packPlan=forced.plan.text;
        lastOrder.buttonPack=forced.plan.target;
        lastOrder.price=forced.plan.price;
        lastOrder.pack=forced.plan.text;
        return;
      }

      const p=findProduct(lastOrder);
      if(!isTargetProduct(p))return;
      const each=buttonAmountFromName(p.name);
      if(!each)return;
      const qty=Math.max(1,Math.floor(Number(lastOrder.quantity)||1));
      const plan=bestPlan(each*qty);
      if(!plan?.text)return;
      lastOrder.requiredButtons=plan.target;
      lastOrder.receivedButtons=plan.received;
      lastOrder.packPlan=plan.text;
      lastOrder.buttonPack=plan.target;
      lastOrder.price=plan.price;
      lastOrder.pack=plan.text;
    }catch(e){console.warn('button pack patch failed',e);}
  }

  function loadProducts(){
    try{
      if(!window.firebase||!firebase.firestore)return setTimeout(loadProducts,250);
      if(!firebase.apps.length){
        if(!window.YUIMELLKUB_FIREBASE_CONFIG)return setTimeout(loadProducts,250);
        firebase.initializeApp(window.YUIMELLKUB_FIREBASE_CONFIG);
      }
      firebase.firestore().collection('products').onSnapshot(s=>{products=s.docs.map(d=>({id:d.id,...d.data()}));},e=>console.warn('product lookup for button pack failed',e));
    }catch(e){setTimeout(loadProducts,500);}
  }

  function install(){
    if(typeof window.saveOrderToDemoAdmin!=='function')return setTimeout(install,250);
    if(window.saveOrderToDemoAdmin.__ymkButtonPackWrapped)return;
    const original=window.saveOrderToDemoAdmin;
    async function wrapped(){patchCurrentOrder();return original.apply(this,arguments);}
    wrapped.__ymkButtonPackWrapped=true;
    window.saveOrderToDemoAdmin=wrapped;
  }

  loadProducts();
  install();
})();