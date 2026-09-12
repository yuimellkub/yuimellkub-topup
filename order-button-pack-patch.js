(function(){
  let products=[];

  function normalize(v){return String(v||'').trim();}
  function buttonAmountFromName(name){
    const m=normalize(name).match(/(\d[\d,]*)/);
    if(!m) return '';
    return m[1].replace(/,/g,'');
  }
  function findProduct(order){
    const item=normalize(order?.item);
    const pack=normalize(order?.pack);
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
      lastOrder.pack=amount+' กระดุม';
      lastOrder.buttonPack=amount;
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
