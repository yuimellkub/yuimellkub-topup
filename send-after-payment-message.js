(function(){
  'use strict';
  let sendChosen=false;
  function clear(){sendChosen=false;try{sessionStorage.removeItem('ymk_send_order_after_payment');}catch(e){}const old=document.getElementById('ymkSendAfterPaymentNotice');if(old)old.remove();}
  function markSend(){sendChosen=true;}
  function approvedCard(){const card=document.getElementById('ymkForceCard');if(!card||card.dataset.ymkManualState!=='approved')return null;if(!/YMK\d{6}-\d{6}/.test(card.innerText||''))return null;return card;}
  function isCurrentSend(){try{return sendChosen&&(window.YMK_SEND_ORDER_META?.mode==='send'||window.YMK_SEND_SELECTION?.mode==='send'||window.YMK_PENDING_ORDER_META?.orderMode==='send'||sendChosen);}catch(e){return sendChosen;}}
  document.addEventListener('click',function(e){
    const el=e.target.closest('button,a');if(!el)return;
    if(el.classList.contains('ymk-send-choice')||el.classList.contains('ymk-send-confirm')){markSend();return;}
    if(el.classList.contains('ready-stock-order-btn')&&el.dataset.ymkSendConfirming!=='1'){clear();return;}
    if(/ย้อนกลับแก้ไข UID|กลับไป|เริ่มใหม่|สั่งซื้อ/.test((el.textContent||'').trim())&&!el.classList.contains('ymk-send-confirm'))clear();
  },true);
  window.addEventListener('pageshow',function(e){if(e.persisted)clear();});
  function notice(){const el=document.createElement('div');el.id='ymkSendAfterPaymentNotice';el.style.cssText='margin:12px 0 0;padding:13px;border:1px solid #efc6d7;border-radius:14px;background:#fff3f8;color:#8f4f68;font-size:13px;font-weight:700;line-height:1.7;text-align:left';el.innerHTML='<div style="font-size:15px;font-weight:900;text-align:center;margin-bottom:6px">📦 สำหรับออเดอร์แบบส่ง</div><div style="text-align:center">กรุณาติดต่อทางร้านเพื่อแจ้ง <b>สกิน / ไอเทมที่ต้องการให้ส่ง</b><br>พร้อมแจ้งเลขออเดอร์ให้แอดมินนะคะ ♡</div><div style="margin-top:8px"><b>หมายเหตุ:</b> แบบส่งจำเป็นต้องแอดเพื่อนภายในเกมและรอครบ <b>24 ชั่วโมง</b> ก่อนจึงจะสามารถส่งของขวัญได้ค่ะ</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px"><a href="https://m.me/yuimellkubtopup" target="_blank" rel="noopener" style="display:block;text-align:center;text-decoration:none;padding:10px 8px;border-radius:12px;background:#e27ca5;color:#fff;font-weight:900">ติดต่อเพจ</a><a href="https://line.me/R/ti/p/@205svvxv" target="_blank" rel="noopener" style="display:block;text-align:center;text-decoration:none;padding:10px 8px;border:1px solid #e7a6bf;border-radius:12px;background:#fff;color:#c85f88;font-weight:900">ติดต่อ LINE</a></div>';return el;}
  function fixMessage(card){const nodes=[...card.querySelectorAll('div,p,span')].filter(el=>!el.children.length);for(const el of nodes){const t=(el.textContent||'').trim();if(t.includes('กรุณาเก็บเลขออเดอร์ไว้สำหรับติดตามสถานะ')&&t.includes('และรอร้านดำเนินการเติมสักครู่นะคะ')){el.textContent='กรุณาเก็บเลขออเดอร์ไว้สำหรับติดตามสถานะนะคะ ♡';continue;}if(t.includes('และรอร้านดำเนินการเติมสักครู่นะคะ'))el.remove();else if(t==='กรุณาเก็บเลขออเดอร์ไว้สำหรับติดตามสถานะ')el.textContent='กรุณาเก็บเลขออเดอร์ไว้สำหรับติดตามสถานะนะคะ ♡';}}
  function patch(){
    const card=approvedCard();
    if(!card||!isCurrentSend()){const old=document.getElementById('ymkSendAfterPaymentNotice');if(old)old.remove();return;}
    fixMessage(card);
    if(!card.querySelector('#ymkSendAfterPaymentNotice')){const n=notice(),copy=[...card.querySelectorAll('button,a')].find(el=>/คัดลอกเลขออเดอร์/.test(el.textContent||''));if(copy)copy.insertAdjacentElement('beforebegin',n);else card.appendChild(n);}
  }
  let busy=false;function schedule(){if(busy)return;busy=true;setTimeout(()=>{busy=false;patch();},0);}
  clear();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});
})();
