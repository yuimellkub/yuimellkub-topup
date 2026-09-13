(function(){
  'use strict';

  const SETTINGS_ID='ymk_store_settings';
  let unsub=null;

  const style=document.createElement('style');
  style.textContent=`
    .ymk-slip-mode{margin:16px 0;padding:16px;background:#fff;border:1px solid #f2ccdc;border-radius:18px;box-shadow:0 8px 24px rgba(190,105,145,.08)}
    .ymk-slip-mode-top{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}
    .ymk-slip-mode-title{font-weight:900;color:#8f4f68;font-size:16px}
    .ymk-slip-mode-sub{font-size:12px;color:#a16b80;line-height:1.55;margin-top:4px}
    .ymk-slip-mode-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
    .ymk-slip-mode-actions button{border:1px solid #efc8d7;border-radius:12px;padding:10px 14px;font-weight:850;cursor:pointer;background:#fff0f6;color:#92566e}
    .ymk-slip-mode-actions button.active{background:#e889ad;color:#fff;border-color:#e889ad}
    .ymk-slip-mode-status{font-size:12px;font-weight:800;color:#8f5d71;margin-top:10px}
  `;
  document.head.appendChild(style);

  function removeSettingsProductCard(){
    document.querySelectorAll('.productEdit[data-id="'+SETTINGS_ID+'"]').forEach(el=>el.remove());
  }

  function mount(){
    if(document.getElementById('ymkSlipMode'))return;
    const head=document.querySelector('.head');
    if(!head)return;
    const box=document.createElement('section');
    box.id='ymkSlipMode';box.className='ymk-slip-mode';
    box.innerHTML=`<div class="ymk-slip-mode-top"><div><div class="ymk-slip-mode-title">♡ การตรวจสอบสลิป</div><div class="ymk-slip-mode-sub">โหมดอัตโนมัติจะใช้ EasySlip • ถ้า EasySlip หมดโควตา/แพ็กหมด/ระบบขัดข้อง ออเดอร์จะเปลี่ยนเป็นให้ร้านตรวจเองอัตโนมัติ</div></div></div><div class="ymk-slip-mode-actions"><button type="button" data-mode="auto">ระบบอัตโนมัติ</button><button type="button" data-mode="manual">ร้านตรวจเอง</button></div><div class="ymk-slip-mode-status" id="ymkSlipModeStatus">กำลังโหลดสถานะ…</div>`;
    head.after(box);
    box.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',async()=>{
      if(!db||!auth?.currentUser){alert('กรุณาเข้าสู่ระบบร้านก่อนค่ะ');return;}
      const mode=btn.dataset.mode,old=btn.textContent;btn.disabled=true;btn.textContent='กำลังบันทึก…';
      try{await db.collection('products').doc(SETTINGS_ID).set({hidden:true,visible:false,type:'settings',category:'echoes',name:'',slipVerificationMode:mode,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});}
      catch(e){alert('เปลี่ยนโหมดไม่สำเร็จ: '+e.message);}
      finally{btn.disabled=false;btn.textContent=old;}
    }));
  }

  function paint(mode){
    const box=document.getElementById('ymkSlipMode');if(!box)return;
    box.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    const st=document.getElementById('ymkSlipModeStatus');if(st)st.textContent=mode==='manual'?'ตอนนี้: ร้านตรวจสลิปเอง — ระบบ EasySlip จะไม่ถูกเรียกใช้งาน':'ตอนนี้: ระบบอัตโนมัติ — หาก EasySlip ใช้งานไม่ได้ จะส่งออเดอร์เข้ารอร้านตรวจแทน';
  }

  function connect(){
    mount();removeSettingsProductCard();if(!db||!auth)return setTimeout(connect,300);
    auth.onAuthStateChanged(user=>{
      if(unsub){unsub();unsub=null;}
      if(!user){paint('auto');return;}
      unsub=db.collection('products').doc(SETTINGS_ID).onSnapshot(async snap=>{
        if(!snap.exists){paint('auto');try{await db.collection('products').doc(SETTINGS_ID).set({hidden:true,visible:false,type:'settings',category:'echoes',name:'',slipVerificationMode:'auto',updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});}catch(e){console.warn('create slip settings failed',e);}return;}
        paint(snap.data()?.slipVerificationMode==='manual'?'manual':'auto');removeSettingsProductCard();
      },e=>{console.warn('slip mode listener failed',e);paint('auto');});
    });
  }
  new MutationObserver(removeSettingsProductCard).observe(document.getElementById('productList')||document.body,{childList:true,subtree:true});connect();
})();