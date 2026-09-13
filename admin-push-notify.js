(function(){
  'use strict';

  const VAPID_KEY='BIpmZpeRbgSfhB231GLPbRSK6hODIqGvfoseZU418DJ5ijy-1L1O35aCTSbZ0PoITkGLHjyzoQ1N7n7y8pjd324';
  const TOKEN_COLLECTION='admin_push_tokens';
  const btn=document.getElementById('notifyToggle');
  if(!btn)return;

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      if([...document.scripts].some(s=>s.src===src))return resolve();
      const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('โหลด Firebase Messaging ไม่สำเร็จ'));document.head.appendChild(s);
    });
  }

  async function waitForAdmin(){
    for(let i=0;i<40;i++){
      try{if(typeof auth!=='undefined'&&auth?.currentUser&&typeof db!=='undefined'&&db)return true;}catch(e){}
      await new Promise(r=>setTimeout(r,250));
    }
    return false;
  }

  async function saveToken(token){
    const uid=auth?.currentUser?.uid;
    if(!uid)throw new Error('กรุณาเข้าสู่ระบบร้านก่อน');
    const ref=db.collection(TOKEN_COLLECTION).doc(uid);
    await ref.set({
      uid,
      tokens:firebase.firestore.FieldValue.arrayUnion(token),
      enabled:true,
      updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    },{merge:true});
  }

  async function enablePush(){
    if(!('serviceWorker' in navigator))throw new Error('เบราว์เซอร์นี้ไม่รองรับ Push Notification');
    if(!('Notification' in window))throw new Error('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน');
    if(Notification.permission!=='granted'){
      const p=await Notification.requestPermission();
      if(p!=='granted')throw new Error('กรุณาอนุญาตการแจ้งเตือนในเบราว์เซอร์ก่อน');
    }
    if(!(await waitForAdmin()))throw new Error('กรุณาเข้าสู่ระบบร้านก่อน แล้วกดเปิดแจ้งเตือนอีกครั้ง');

    await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');
    const registration=await navigator.serviceWorker.register('firebase-messaging-sw.js',{scope:'./'});
    const messaging=firebase.messaging();
    const token=await messaging.getToken({vapidKey:VAPID_KEY,serviceWorkerRegistration:registration});
    if(!token)throw new Error('ยังสร้าง Push token ไม่สำเร็จ');
    await saveToken(token);
    localStorage.setItem('ymk_admin_push_enabled','1');
    btn.textContent='🔔 Push เปิดอยู่';
    btn.dataset.pushReady='1';

    try{
      messaging.onMessage(payload=>{
        const data=payload?.data||{};
        const n=payload?.notification||{};
        if(Notification.permission==='granted'){
          new Notification(n.title||data.title||'Yuimellkub • มีสลิปรอตรวจสอบ 🔔',{
            body:n.body||data.body||'มีออเดอร์ใหม่รอร้านยืนยันสลิป',
            tag:data.orderId?'ymk-slip-'+data.orderId:'ymk-slip-'+Date.now()
          });
        }
      });
    }catch(e){}
  }

  btn.addEventListener('click',async()=>{
    const old=btn.textContent;
    btn.disabled=true;btn.textContent='กำลังเปิด Push…';
    try{
      if(typeof enableNotifications==='function')await enableNotifications();
      await enablePush();
      alert('เปิด Push Notification เครื่องนี้เรียบร้อยแล้วค่ะ ♡');
    }catch(e){
      console.error(e);
      btn.textContent=old;
      alert('เปิด Push ไม่สำเร็จ: '+(e?.message||e));
    }finally{btn.disabled=false;}
  },true);

  if(localStorage.getItem('ymk_admin_push_enabled')==='1'&&Notification.permission==='granted'){
    btn.textContent='🔔 Push เปิดอยู่';
  }
})();
