(function(){
  'use strict';
  function firebaseReady(){return !!(window.YUIMELLKUB_FIREBASE_CONFIG?.apiKey&&window.firebase);}
  function getDb(){try{if(!firebase.apps.length)firebase.initializeApp(window.YUIMELLKUB_FIREBASE_CONFIG);return firebase.firestore();}catch(e){return null;}}
  function card(){return document.getElementById('ymkForceCard');}
  function box(kind,title,message){
    const c=card();if(!c)return;
    let el=c.querySelector('#ymkSlipReviewBox');if(!el){el=document.createElement('div');el.id='ymkSlipReviewBox';el.style.cssText='margin-top:14px;padding:14px;border-radius:14px;text-align:center;font-size:13px;line-height:1.65;font-weight:700';c.appendChild(el);}
    if(kind==='bad'){el.style.background='#fff0f4';el.style.border='1px solid #efb6c5';el.style.color='#a24761';}
    else{el.style.background='#fff8ed';el.style.border='1px solid #efd7a8';el.style.color='#8b682e';}
    el.innerHTML='<div style="font-size:15px;font-weight:900;margin-bottom:4px">'+title+'</div><div>'+message+'</div>';
  }
  async function showReview(id,status){
    if(!firebaseReady()||!id)return false;const db=getDb();if(!db)return false;
    try{const snap=await db.collection('order_status').doc(id).get();if(!snap.exists)return false;const d=snap.data()||{},s=String(d.status||status||'');
      if(s==='สลิปไม่ผ่าน'||d.paymentStatus==='สลิปไม่ผ่าน'){box('bad','ตรวจสอบสลิปไม่สำเร็จ',d.slipReviewMessage||'กรุณาแนบสลิปที่ถูกต้องแล้วส่งใหม่อีกครั้ง');return true;}
      if(s==='รอตรวจสอบสลิป'||d.orderReady===false){box('wait','กำลังรอร้านตรวจสอบสลิป','ร้านได้รับสลิปแล้ว ออเดอร์จะเริ่มดำเนินการหลังจากร้านยืนยันการชำระเงินค่ะ');return true;}
    }catch(e){console.warn('slip review status failed',e);}return false;
  }
  const old=window.handleTrackedStatusPopup;
  if(typeof old==='function')window.handleTrackedStatusPopup=function(id,status){const r=old.apply(this,arguments);setTimeout(()=>showReview(id,status),80);return r;};
  window.ymkShowSlipReviewStatus=showReview;
})();
