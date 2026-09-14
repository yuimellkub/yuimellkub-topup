(function(){
'use strict';
const NOTICE_ID='ymkStoreHoursNotice';
const TEXT='สามารถกดสั่งซื้อสินค้าได้ตลอดเวลา ทางร้านจะรีบดำเนินการให้เร็วที่สุดตามลำดับออเดอร์นะคะ หากสั่งซื้อนอกเวลาทำการ ทางร้านจะเริ่มดำเนินการเมื่อเปิดให้บริการค่ะ ♡';
const HOURS='เวลาทำการ 10:00–23:00 น.';
function style(){if(document.getElementById('ymkStoreHoursStyle'))return;const s=document.createElement('style');s.id='ymkStoreHoursStyle';s.textContent='#'+NOTICE_ID+'{margin:12px 0 4px;padding:12px 14px;border-radius:14px;background:#fff5f9;border:1px solid #f6dbe7;color:#6f5360;font-size:13px;line-height:1.65;text-align:left}#'+NOTICE_ID+' strong{display:block;color:#d66f9b;margin-bottom:2px;font-size:13px}#'+NOTICE_ID+' .ymk-hours{display:block;margin-top:4px;font-weight:700;color:#b85f86}';document.head.appendChild(s)}
function findTarget(){const slip=document.getElementById('slipFile');if(slip){return slip.closest('.form-group,.field,.input-group,.payment-section,.modal-content,.modal-card')||slip.parentElement}const buttons=[...document.querySelectorAll('button')];const submit=buttons.find(b=>/ตรวจสลิปและส่งออเดอร์|ส่งสลิปให้ร้านตรวจสอบ|ส่งออเดอร์/.test((b.textContent||'').trim()));return submit?.parentElement||null}
function render(){style();if(document.getElementById(NOTICE_ID))return;const target=findTarget();if(!target)return;const box=document.createElement('div');box.id=NOTICE_ID;box.innerHTML='<strong>หมายเหตุ ♡</strong><span>'+TEXT+'</span><span class="ymk-hours">'+HOURS+'</span>';const buttons=[...target.querySelectorAll('button')];const submit=buttons.find(b=>/ตรวจสลิปและส่งออเดอร์|ส่งสลิปให้ร้านตรวจสอบ|ส่งออเดอร์/.test((b.textContent||'').trim()));if(submit)target.insertBefore(box,submit);else target.appendChild(box)}
function start(){render();new MutationObserver(render).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
