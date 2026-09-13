(function(){
  function cfgReady(){
    const c=window.YUIMELLKUB_EMAILJS||{};
    return !!(c.publicKey&&c.serviceId&&c.templateId);
  }

  function val(id){return (document.getElementById(id)?.value||'').trim();}

  async function sendOrderEmail(payload){
    if(!cfgReady()){
      console.warn('EmailJS config is incomplete');
      return false;
    }

    const key='ymk_email_sent_'+payload.order_id;
    try{if(localStorage.getItem(key)==='1')return true;}catch(e){}

    try{
      const c=window.YUIMELLKUB_EMAILJS;
      const response=await fetch('https://api.emailjs.com/api/v1.0/email/send',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          service_id:c.serviceId,
          template_id:c.templateId,
          user_id:c.publicKey,
          template_params:payload
        })
      });
      const text=await response.text();
      if(!response.ok)throw new Error((text||'EmailJS error')+' ('+response.status+')');
      try{localStorage.setItem(key,'1');}catch(e){}
      console.log('Yuimellkub order email sent',payload.order_id,text);
      return true;
    }catch(e){
      console.warn('Yuimellkub order email failed',e);
      try{
        const st=document.getElementById('adminSaveStatus');
        if(st&&st.textContent.includes('ส่งออเดอร์เข้าระบบแล้ว'))st.textContent+=' • แจ้งเตือนอีเมลไม่สำเร็จ (ออเดอร์ยังเข้าระบบแล้ว)';
      }catch(_){}
      return false;
    }
  }

  function getLastOrderSafe(){try{return typeof lastOrder!=='undefined'&&lastOrder?lastOrder:{};}catch(e){return {};}}
  function getCurrentOrderIdSafe(){try{return typeof currentOrderId!=='undefined'?currentOrderId:'';}catch(e){return '';}}
  function getPaymentSafe(){try{return typeof getPaymentMethod==='function'?getPaymentMethod():'';}catch(e){return '';}}

  async function isManualReviewMode(){
    try{
      if(!window.firebase||!window.YUIMELLKUB_FIREBASE_CONFIG)return false;
      if(!firebase.apps.length)firebase.initializeApp(window.YUIMELLKUB_FIREBASE_CONFIG);
      const snap=await firebase.firestore().collection('products').doc('ymk_store_settings').get();
      return snap.exists&&snap.data()?.slipVerificationMode==='manual';
    }catch(e){
      console.warn('email manual mode check failed',e);
      return false;
    }
  }

  function isPendingSlipReview(){
    try{
      if(/^SLIP/i.test(String(window.currentOrderId||'')))return true;
      const t=(document.getElementById('adminSaveStatus')?.textContent||'')+' '+(document.getElementById('ymkForceCard')?.innerText||'');
      return /รอร้านตรวจสอบ|รอตรวจสอบสลิป|ส่งสลิปแล้ว|ยังไม่มีการสร้างออเดอร์/.test(t);
    }catch(e){return false;}
  }

  function install(){
    if(typeof window.saveOrderToDemoAdmin!=='function')return setTimeout(install,250);
    if(window.saveOrderToDemoAdmin.__ymkEmailWrapped)return;

    const original=window.saveOrderToDemoAdmin;
    async function wrapped(){
      const before=getLastOrderSafe();
      const manualMode=await isManualReviewMode();
      const result=await original.apply(this,arguments);

      if(result===true){
        if(manualMode||isPendingSlipReview()){
          console.log('Yuimellkub order email skipped: waiting for slip approval');
          return result;
        }

        const orderId=getCurrentOrderIdSafe();
        if(orderId){
          const p={
            order_id:orderId,
            item:before.item||'',
            pack:before.pack||'',
            price:before.price||'',
            uid:val('orderUid'),
            server:val('orderServer')||'Asia',
            name:val('orderName')||'-',
            payment_method:getPaymentSafe(),
            status:'รอตรวจสอบการชำระเงิน',
            created_at:new Date().toLocaleString('th-TH'),
            admin_url:'https://yuimellkub.github.io/yuimellkub-topup/admin.html'
          };
          await sendOrderEmail(p);
        }
      }
      return result;
    }
    wrapped.__ymkEmailWrapped=true;
    window.saveOrderToDemoAdmin=wrapped;
  }

  install();
})();
