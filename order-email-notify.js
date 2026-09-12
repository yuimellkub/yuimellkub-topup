(function(){
  function cfgReady(){
    const c=window.YUIMELLKUB_EMAILJS||{};
    return !!(c.publicKey&&c.serviceId&&c.templateId);
  }

  function loadEmailJS(){
    return new Promise((resolve,reject)=>{
      if(window.emailjs) return resolve(window.emailjs);
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
      s.onload=()=>resolve(window.emailjs);
      s.onerror=()=>reject(new Error('โหลด EmailJS ไม่สำเร็จ'));
      document.head.appendChild(s);
    });
  }

  function val(id){return (document.getElementById(id)?.value||'').trim();}

  async function sendOrderEmail(payload){
    if(!cfgReady()) return false;
    const key='ymk_email_sent_'+payload.order_id;
    try{ if(localStorage.getItem(key)==='1') return true; }catch(e){}

    try{
      const c=window.YUIMELLKUB_EMAILJS;
      const sdk=await loadEmailJS();
      sdk.init({publicKey:c.publicKey});
      await sdk.send(c.serviceId,c.templateId,payload);
      try{localStorage.setItem(key,'1');}catch(e){}
      console.log('Yuimellkub order email sent',payload.order_id);
      return true;
    }catch(e){
      console.warn('Yuimellkub order email failed',e);
      return false;
    }
  }

  function getLastOrderSafe(){
    try{return typeof lastOrder!=='undefined'&&lastOrder?lastOrder:{};}catch(e){return {};}
  }
  function getCurrentOrderIdSafe(){
    try{return typeof currentOrderId!=='undefined'?currentOrderId:'';}catch(e){return '';}
  }
  function getPaymentSafe(){
    try{return typeof getPaymentMethod==='function'?getPaymentMethod():'';}catch(e){return '';}
  }

  function install(){
    if(typeof window.saveOrderToDemoAdmin!=='function') return setTimeout(install,250);
    if(window.saveOrderToDemoAdmin.__ymkEmailWrapped) return;

    const original=window.saveOrderToDemoAdmin;
    async function wrapped(){
      const before=getLastOrderSafe();
      const result=await original.apply(this,arguments);
      if(result===true){
        const orderId=getCurrentOrderIdSafe();
        if(orderId){
          const p={
            order_id:orderId,
            item:before.item||'',
            pack:before.pack||'',
            price:before.price||'',
            uid:val('orderUid'),
            server:val('orderServer')||'Asia',
            customer_name:val('orderName')||'-',
            payment_method:getPaymentSafe(),
            status:'รอตรวจสอบการชำระเงิน',
            created_at:new Date().toLocaleString('th-TH'),
            admin_url:'https://yuimellkub.github.io/yuimellkub-topup/admin.html'
          };
          sendOrderEmail(p);
        }
      }
      return result;
    }
    wrapped.__ymkEmailWrapped=true;
    window.saveOrderToDemoAdmin=wrapped;
  }

  install();
})();
