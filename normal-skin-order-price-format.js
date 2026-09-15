(function(){
  'use strict';
  function sendActive(){try{return window.YMK_SEND_ORDER_META?.mode==='send'||window.YMK_SEND_SELECTION?.mode==='send'||window.YMK_PENDING_ORDER_META?.orderMode==='send';}catch(e){return false;}}
  function isNormalSkinOrder(){if(sendActive())return false;try{const o=typeof lastOrder!=='undefined'?lastOrder:null;if(!o)return false;const t=String(o.item||'')+' '+String(o.pack||'');return /สกิน|ประดับ|สัตว์เลี้ยง|ห้อง/.test(t)||!!document.querySelector('.ready-stock-card');}catch(e){return false;}}
  function format(){if(!isNormalSkinOrder())return;document.querySelectorAll('textarea').forEach(el=>{let v=el.value||'';if(!/รายการ:|แพ็ก:|ยอดรวม:/.test(v))return;v=v.replace(/ยอดรวม:\s*([\d,]+)(?:\s*บาท)?/g,function(_,n){return 'ยอดรวม: '+Number(String(n).replace(/,/g,'')).toLocaleString('th-TH')+' บาท';});if(v!==el.value){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));}});}
  document.addEventListener('click',()=>{setTimeout(format,0);setTimeout(format,100);setTimeout(format,350);},true);
  document.addEventListener('input',()=>setTimeout(format,0),true);
})();
