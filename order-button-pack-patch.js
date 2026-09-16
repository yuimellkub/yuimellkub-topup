(function(){
  let products=[];
  const cats=new Set(['skins','skin','accessories','accessory','pets','pet','room','rooms','house','houses','home','furniture']);
  function normalize(v){return String(v||'').trim();}
  function cleanOrderName(v){return normalize(v).replace(/\s*[×xX]\s*\d+\s*$/,'').trim();}
  function isSendOrder(){return window.YMK_SEND_SELECTION?.mode==='send'||window.YMK_PENDING_ORDER_META?.orderMode==='send'||(typeof lastOrder!=='undefined'&&lastOrder?.orderMode==='send');}
  function price759Tier(qty){qty=Math.max(0,Math.floor(Number(qty)||0));if(qty>=30)return 283;if(qty>=20)return 285;if(qty>=10)return 287;return qty>0?290:0;}
  function roundSellingPrice(price){price=Math.max(0,Math.floor(Number(price)||0));const last=price%10;if(last===0||last===5)return price;if(last>=1&&last<=4)return price+(5-last);return price+(10-last);}
  function formatPlan(a,b,c,d){return [[759,d],[335,c],[203,b],[66,a]].filter(x=>x[1]>0).map(x=>x[0].toLocaleString()+' × '+x[1]).join(' + ');}
  function planFromPrice(price){
    price=Math.max(0,Math.floor(Number(price)||0));if(!price)return null;
    let best=null;
    const maxD=Math.ceil(price/283)+1;
    for(let d=0;d<=maxD;d++)for(let c=0;c<=1;c++)for(let b=0;b<=2;b++)for(let a=0;a<=2;a++){
      if(!(a+b+c+d))continue;
      const raw=a*30+b*90+c*145+d*price759Tier(d),selling=roundSellingPrice(raw);
      if(selling!==price)continue;
      const received=a*66+b*203+c*335+d*759,count=a+b+c+d;
      const candidate={target:received,received,price:selling,rawPrice:raw,text:formatPlan(a,b,c,d),count};
      if(!best||received>best.received||(received===best.received&&count<best.count))best=candidate;
    }
    return best;
  }
  function findProduct(order){const item=cleanOrderName(order?.item),pack=cleanOrderName(order?.pack);return products.find(p=>{const name=normalize(p.name);return name&&(name===item||name===pack);})||null;}
  function isTargetProduct(p){if(!p)return false;const cat=String(p.category||'').toLowerCase().trim();if(cat==='echoes')return false;if(cats.has(cat))return true;return /สกิน|ประดับ|สัตว์เลี้ยง|ห้อง/.test(String(p.categoryLabel||''));}
  function patchCurrentOrder(){try{
    if(typeof lastOrder==='undefined'||!lastOrder)return;
    if(isSendOrder())return;
    const p=findProduct(lastOrder);if(!isTargetProduct(p))return;
    const qty=Math.max(1,Math.floor(Number(lastOrder.quantity)||1));
    const configuredUnitPrice=Math.max(0,Number(p.price)||0),configuredTotal=Math.round(configuredUnitPrice*qty);
    const plan=planFromPrice(configuredTotal);if(!plan?.text)return;
    lastOrder.requiredButtons=plan.received;
    lastOrder.receivedButtons=plan.received;
    lastOrder.packPlan=plan.text;
    lastOrder.buttonPack=plan.received;
    lastOrder.pack=plan.text;
    lastOrder.packMatchedPrice=configuredTotal;
  }catch(e){console.warn('button pack patch failed',e);}}
  function loadProducts(){try{if(!window.firebase||!firebase.firestore)return setTimeout(loadProducts,250);if(!firebase.apps.length){if(!window.YUIMELLKUB_FIREBASE_CONFIG)return setTimeout(loadProducts,250);firebase.initializeApp(window.YUIMELLKUB_FIREBASE_CONFIG);}firebase.firestore().collection('products').onSnapshot(s=>{products=s.docs.map(d=>({id:d.id,...d.data()}));},e=>console.warn('product lookup for button pack failed',e));}catch(e){setTimeout(loadProducts,500);}}
  function install(){if(typeof window.saveOrderToDemoAdmin!=='function')return setTimeout(install,250);if(window.saveOrderToDemoAdmin.__ymkButtonPackWrapped)return;const original=window.saveOrderToDemoAdmin;async function wrapped(){patchCurrentOrder();return original.apply(this,arguments);}wrapped.__ymkButtonPackWrapped=true;window.saveOrderToDemoAdmin=wrapped;}
  window.YMK_PRODUCT_PACK_BY_PRICE={find:planFromPrice};
  loadProducts();install();
})();