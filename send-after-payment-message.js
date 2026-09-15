(function(){
  'use strict';
  const KEY='ymk_send_order_after_payment';
  function remembered(){try{return sessionStorage.getItem(KEY)==='1';}catch(e){return false;}}
  function remember(v){try{if(v)sessionStorage.setItem(KEY,'1');else sessionStorage.removeItem(KEY);}catch(e){}}
  function isSend(){try{return window.YMK_SEND_ORDER_META?.mode==='send'||window.YMK_SEND_SELECTION?.mode==='send'||window.YMK_PENDING_ORDER_META?.orderMode==='send'||remembered();}catch(e){return remembered();}}
  document.addEventListener('click',function(e){const el=e.target.closest('button,a');if(!el)return;if(el.classList.contains('ymk-send-choice')||el.classList.contains('ymk-send-confirm'))remember(true);if(el.classList.contains('ready-stock-order-btn')&&el.dataset.ymkSendConfirming!=='1'&&!window.YMK_SEND_ORDER_META)remember(false);},true);
  function successCard(){const direct=document.getElementById('ymkForceCard');if(direct&&/ยืนยันสลิปเรียบร้อยแล้ว|เลขออเดอร์ของคุณ/.test(direct.innerText||''))return direct;return [...document.querySelectorAll('div')].find(el=>/ยืนยันสลิปเรียบร้อยแล้ว/.test(el.innerText||'')&&/เลขออเดอร์ของคุณ/.test(el.innerText||'')&&el.querySelector('button'))||null;}
  function notice(){const el=document.createElement('div');el.id='ymkSendAfterPaymentNotice';el.style.cssText='margin:12px 0 0;padding:13px;border:1px solid #efc6d7;border-radius:14px;background:#fff3f8;color:#8f4f68;font-size:13px;font-weight:700;line-height:1.7;text-align:left';el.innerHTML='<div style="font-size:15px;font-weight:900;text-align:center;margin-bottom:6px">📦 สำหรับออเดอร์แบบส่ง</div><div style="text-align:center">กรุณาติดต่อทางร้านเพื่อแจ้ง <b>สกิน / ไอเทมที่ต้องการให้ส่ง</b><br>พร้อมแจ้งเลขออเดอร์ให้แอดมินนะคะ ♡</div><div style="margin-top:8px"><b>หมายเหตุ:</b> แบบส่งจำเป็นต้องแอดเพื่อนภายในเกมและรอครบ <b>24 ชั่วโมง</b> ก่อนจึงจะสามารถส่งของขวัญได้ค่ะ</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px"><a href="https://m.me/yuimellkubtopup" target="_blank" rel="noopener" style="display:block;text-align:center;text-decoration:none;padding:10px 8px;border-radius:12px;background:#e27ca5;color:#fff;font-weight:900">ติดต่อเพจ</a><a href="https://line.me/R/ti/p/@205svvxv" target="_blank" rel="noopener" style="display:block;text-align:center;text-decoration:none;padding:10px 8px;border:1px solid #e7a6bf;border-radius:12px;background:#fff;color:#c85f88;font-weight:900">ติดต่อ LINE</a></div>';return el;}
  function patch(){
    if(!isSend())return;
    const card=successCard();if(!card)return;
    const old=card.querySelector('#ymkSendAfterPaymentNotice');if(old)old.remove();
    const copy=[...card.querySelectorAll('button,a')].find(el=>/คัดลอกเลขออเดอร์/.test(el.textContent||''));
    const normal=[...card.querySelectorAll('p,div,span')].find(el=>!el.children.length&&/และรอร้านดำเนินการเติมสักครู่นะคะ/.test(el.textContent||''));
    const n=notice();
    if(normal){normal.replaceWith(n);return;}
    if(copy){copy.insertAdjacentElement('beforebegin',n);return;}
    card.appendChild(n);
  }
  let busy=false;function schedule(){if(busy)return;busy=true;setTimeout(()=>{busy=false;patch();},30);}
  patch();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
})();
