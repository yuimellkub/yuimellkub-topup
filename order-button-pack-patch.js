(function(){
  let products=[];

  function normalize(v){return String(v||'').trim();}
  function cleanOrderName(v){return normalize(v).replace(/\s*[×xX]\s*\d+\s*$/,'').trim();}
  function buttonAmountFromName(name){
    const text=normalize(name);
    const labeled=text.match(/(\d[\d,]*)\s*(?:กระดุม|ปุ่ม|buttons?)/i);
    if(labeled) return labeled[1].replace(/,/g,'');
    const nums=[...text.matchAll(/\d[\d,]*/g)];
    if(!nums.length) return '';
    return nums[nums.length-1][0].replace(/,/g,'');
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
      const amount=buttonAmountFromName(p.name);
      if(!amount) return;
      const qty=Math.max(1,Math.floor(Number(lastOrder.quantity)||1);
      lastOrder.pack=amount+' กระดุม'+(qty>1?' × '+qty:'');
      lastOrder.buttonPack=Number(amount)*qty;
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
