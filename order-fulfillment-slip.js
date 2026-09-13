(function(){
  'use strict';

  const style=document.createElement('style');
  style.textContent=`
    .ymk-customer-fulfillment{margin-top:14px;padding:12px;border-radius:14px;background:#fff8fb;border:1px solid #f2ccdc;text-align:left}
    .ymk-customer-fulfillment-title{font-weight:900;color:#8f4f68;font-size:13px;margin-bottom:8px;text-align:center}
    .ymk-customer-fulfillment-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}
    .ymk-customer-fulfillment-item{padding:8px;border-radius:12px;background:#fff;border:1px solid #f4d6e2}
    .ymk-customer-fulfillment img{display:block;width:100%;height:220px;object-fit:contain;border-radius:10px;background:#fff}
    .ymk-customer-fulfillment-save{display:flex;align-items:center;justify-content:center;width:100%;min-height:40px;margin-top:8px;border-radius:10px;text-decoration:none;background:#e889ad;color:#fff;font-weight:850;font-size:12px}
    .ymk-customer-fulfillment-note{text-align:center;font-size:11px;color:#a16b80;line-height:1.5;margin-top:8px}
  `;
  document.head.appendChild(style);

  function getDb(){
    try{
      if(!window.firebase||!firebase.firestore)return null;
      if(!firebase.apps.length){
        if(!window.YUIMELLKUB_FIREBASE_CONFIG)return null;
        firebase.initializeApp(window.YUIMELLKUB_FIREBASE_CONFIG);
      }
      return firebase.firestore();
    }catch(e){return null;}
  }

  function removeOld(){
    document.querySelectorAll('.ymk-customer-fulfillment').forEach(el=>el.remove());
  }

  function getImages(data){
    if(Array.isArray(data.fulfillmentSlipDataList)&&data.fulfillmentSlipDataList.length){
      return data.fulfillmentSlipDataList.filter(x=>typeof x==='string'&&x.startsWith('data:image/'));
    }
    return data.fulfillmentSlipData?[data.fulfillmentSlipData]:[];
  }

  async function attachSlip(orderId,status){
    removeOld();
    if(String(status||'').trim()!=='สำเร็จ')return;
    const db=getDb();if(!db)return;
    try{
      const snap=await db.collection('order_status').doc(orderId).get();
      if(!snap.exists)return;
      const data=snap.data()||{};
      const images=getImages(data);
      if(!images.length)return;
      const card=document.getElementById('ymkForceCard');
      if(!card)return;
      const close=card.querySelector('#ymkForceClose');
      const box=document.createElement('div');
      box.className='ymk-customer-fulfillment';
      const safeId=String(orderId||'order').replace(/[^A-Za-z0-9_-]/g,'');
      box.innerHTML=`<div class="ymk-customer-fulfillment-title">สลิปการเติมเกม ${images.length>1?'('+images.length+' รูป)':''}</div><div class="ymk-customer-fulfillment-grid"></div><div class="ymk-customer-fulfillment-note">กด “บันทึกรูป” ใต้แต่ละรูปเพื่อเก็บไว้ในเครื่องได้เลยค่ะ</div>`;
      const grid=box.querySelector('.ymk-customer-fulfillment-grid');
      images.forEach((src,i)=>{
        const item=document.createElement('div');
        item.className='ymk-customer-fulfillment-item';
        const img=document.createElement('img');img.alt='สลิปการเติมเกม '+(i+1);img.src=src;
        const save=document.createElement('a');save.className='ymk-customer-fulfillment-save';save.textContent='บันทึกรูป '+(i+1);save.href=src;save.download=`Yuimellkub-${safeId}-slip-${i+1}.jpg`;
        item.appendChild(img);item.appendChild(save);grid.appendChild(item);
      });
      if(close)card.insertBefore(box,close);else card.appendChild(box);
    }catch(e){console.warn('load fulfillment slips failed',e);}
  }

  function hook(){
    const original=window.handleTrackedStatusPopup;
    if(typeof original!=='function')return setTimeout(hook,200);
    if(original._ymkFulfillmentHooked)return;
    function wrapped(orderId,status){
      const out=original.apply(this,arguments);
      setTimeout(()=>attachSlip(orderId,status),0);
      return out;
    }
    wrapped._ymkFulfillmentHooked=true;
    wrapped._ymkOriginal=original;
    window.handleTrackedStatusPopup=wrapped;
  }

  hook();
})();