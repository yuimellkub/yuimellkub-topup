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
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({service_id:c.serviceId,template_id:c.templateId,user_id:c.publicKey,template_params:payload})
      });
      const text=await response.text();
      if(!response.ok)throw new Error((text||'EmailJS error')+' ('+response.status+')');
      try{localStorage.setItem(key,'1');}catch(e){}
      console.log('Yuimellkub order email sent',payload.order_id,text);
      return true;
    }catch(e){console.warn('Yuimellkub order email failed',e);return false;}
  }

  window.ymkSendOrderEmail=sendOrderEmail;

  function getLastOrderSafe(){try{return typeof lastOrder!=='undefined'&&lastOrder?lastOrder:{};}catch(e){return {};}}
  function getCurrentOrderIdSafe(){
    try{
      const lexical=typeof currentOrderId!=='undefined'?String(currentOrderId||''):'';
      if(lexical)return lexical;
    }catch(e){}
    return String(window.currentOrderId||'');
  }
  function getPaymentSafe(){try{return typeof getPaymentMethod==='function'?getPaymentMethod():'';}catch(e){return '';}}

  async function getRealAutoOrder(orderId){
    const id=String(orderId||'');
    if(!/^YMK\d{6}-\d{6}$/.test(id))return null;

    /* Worker just created this verified order. Use the exact same order data even if public Firestore reads are blocked. */
    try{
      const local=window.__ymkLastVerifiedAutoOrder;
      if(local&&String(local.id||'')===id&&local.orderReady===true&&local.slipVerificationMode==='auto')return local;
    }catch(e){}

    try{
      if(!window.firebase||!window.YUIMELLKUB_FIREBASE_CONFIG)return null;
      if(!firebase.apps.length)firebase.initializeApp(window.YUIMELLKUB_FIREBASE_CONFIG);
      const snap=await firebase.firestore().collection('orders').doc(id).get();
      if(!snap.exists)return null;
      const data=snap.data()||{};
      if(data.orderReady!==true)return null;
      if(data.slipVerificationMode!=='auto')return null;
      return data;
    }catch(e){
      console.warn('email real order check failed',e);
      return null;
    }
  }

  function install(){
    if(typeof window.saveOrderToDemoAdmin!=='function')return setTimeout(install,250);
    if(window.saveOrderToDemoAdmin.__ymkEmailWrapped)return;
    const original=window.saveOrderToDemoAdmin;
    async function wrapped(){
      const before=getLastOrderSafe();
      const result=await original.apply(this,arguments);
      if(result===true){
        const orderId=getCurrentOrderIdSafe();
        const real=await getRealAutoOrder(orderId);
        if(!real){
          console.log('Yuimellkub order email skipped: no approved/auto real order yet');
          return result;
        }
        await sendOrderEmail({
          order_id:orderId,
          item:real.item||before.item||'',
          pack:real.pack||before.pack||'',
          price:real.price||before.price||'',
          uid:real.uid||val('orderUid'),
          server:real.server||val('orderServer')||'Asia',
          name:real.name||val('orderName')||'-',
          payment_method:real.paymentMethod||getPaymentSafe(),
          status:'ตรวจสอบสลิปแล้ว • รอเติม',
          created_at:new Date().toLocaleString('th-TH'),
          admin_url:'https://yuimellkub.github.io/yuimellkub-topup/admin.html'
        });
      }
      return result;
    }
    wrapped.__ymkEmailWrapped=true;
    window.saveOrderToDemoAdmin=wrapped;
  }
  install();
})();
