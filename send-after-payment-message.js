(function(){
  'use strict';
  const KEY='ymk_send_order_after_payment';
  const isSend=()=>{try{return window.YMK_SEND_ORDER_META?.mode==='send'||window.YMK_SEND_SELECTION?.mode==='send'||sessionStorage.getItem(KEY)==='1';}catch(e){return false;}};
  function remember(v){try{if(v)sessionStorage.setItem(KEY,'1');else sessionStorage.removeItem(KEY);}catch(e){}}
  document.addEventListener('click',e=>{
    const el=e.target.closest('button,a');if(!el)return;
    if(el.classList.contains('ymk-send-choice'))remember(true);
    if(el.classList.contains('ready-stock-order-btn')&&!el.dataset.ymkSendConfirming&&!window.YMK_SEND_ORDER_META)remember(false);
  },true);
  function patch(){
    if(!isSend())return;
    const card=document.getElementById('ymkForceCard');
    if(!card||card.dataset.ymkManualState!=='approved'||card.querySelector('#ymkSendAfterPaymentNotice'))return;
    const notice=document.createElement('div');
    notice.id='ymkSendAfterPaymentNotice';
    notice.style.cssText='margin-top:14px;padding:12px 14px;border:1px solid #efc6d7;border-radius:14px;background:#fff3f8;color:#8f4f68;font-size:13px;font-weight:700;line-height:1.75;text-align:left';
    notice.innerHTML='<div style="font-size:14px;font-weight:900;text-align:center;margin-bottom:5px">📦 สำหรับออเดอร์แบบส่ง</div>หลังจากชำระเงินเรียบร้อยแล้ว กรุณาติดต่อทางร้านเพื่อแจ้งรายละเอียด <b>สกิน / ไอเทมที่ต้องการให้ส่ง</b> พร้อมแจ้งเลขออเดอร์ให้แอดมินทราบนะคะ ♡<br><br><b>หมายเหตุ:</b> แบบส่งจำเป็นต้องแอดเพื่อนภายในเกมและรอครบ <b>24 ชั่วโมง</b> ก่อนจึงจะสามารถส่งของขวัญได้ค่ะ 🎀';
    const btn=card.querySelector('#ymkApprovedOrderId');
    if(btn)card.insertBefore(notice,btn);else card.appendChild(notice);
  }
  patch();
  new MutationObserver(patch).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-ymk-manual-state']});
})();
