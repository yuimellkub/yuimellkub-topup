(function(){
  'use strict';

  const style=document.createElement('style');
  style.textContent=`
    .ymk-customer-fulfillment{margin-top:14px;padding:12px;border-radius:14px;background:#fff8fb;border:1px solid #f2ccdc;text-align:left}
    .ymk-customer-fulfillment-title{font-weight:900;color:#8f4f68;font-size:13px;margin-bottom:8px;text-align:center}
    .ymk-customer-fulfillment img{display:block;width:100%;max-height:480px;object-fit:contain;border-radius:12px;border:1px solid #f2ccdc;background:#fff}
    .ymk-customer-fulfillment-save{display:flex;align-items:center;justify-content:center;width:100%;min-height:44px;margin-top:10px;border-radius:12px;text-decoration:none;background:#e889ad;color:#fff;font-weight:850}
    .ymk-customer-fulfillment-note{text-align:center;font-size:11px;color:#a16b80;line-height:1.5;margin-top:7px}
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

  async function attachSlip(orderId,status){
    removeOld();
    if(String(status||'').trim()!=='สำเร็จ')return;
    const db=getDb();if(!db)return;
    try{
      const snap=await db.collection('order_status').doc(orderId).get();
      if(!snap.exists)return;
      const data=snap.data()||{};
      const imageData=data.fulfillmentSlipData||'';
      if(!imageData)return;
      let card=document.getElementById('ymkForceCard');
      if(!card)return;
      const close=card.querySelector('#ymkForceClose');
      const box=document.createElement('div');
      box.className='ymk-customer-fulfillment';
      const safeId=String(orderId||'order').replace(/[^A-Za-z0-9_-]/g,'');
      box.innerHTML=`<div class="ymk-customer-fulfillment-title">สลิปการเติมเกม</div><img alt="สลิปการเติมเกม"><a class="ymk-customer-fulfillment-save" download="Yuimellkub-${safeId}-slip.jpg">บันทึกสลิป</a><div class="ymk-customer-fulfillment-note">กด “บันทึกสลิป” เพื่อเก็บรูปไว้ในเครื่องได้เลยค่ะ</div>`;
      box.querySelector('img').src=imageData;
      const save=box.querySelector('.ymk-customer-fulfillment-save');save.href=imageData;
      if(close)card.insertBefore(box,close);else card.appendChild(box);
    }catch(e){console.warn('load fulfillment slip failed',e);}
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