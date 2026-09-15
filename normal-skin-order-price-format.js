(function(){
  'use strict';
  function sendActive(){try{return window.YMK_SEND_ORDER_META?.mode==='send'||window.YMK_SEND_SELECTION?.mode==='send'||window.YMK_PENDING_ORDER_META?.orderMode==='send';}catch(e){return false;}}
  function isNormalSkinOrder(){if(sendActive())return false;try{const o=typeof lastOrder!=='undefined'?lastOrder:null;if(!o)return false;const t=String(o.item||'')+' '+String(o.pack||'');return /สกิน|ประดับ|สัตว์เลี้ยง|ห้อง/.test(t)||!!document.querySelector('.ready-stock-card');}catch(e){return false;}}
  function fixValue(v){return String(v||'').replace(/ยอดรวม:\s*([\d,]+)(?:\s*บาท)?/g,function(_,n){return 'ยอดรวม: '+Number(String(n).replace(/,/g,'')).toLocaleString('th-TH')+' บาท';});}
  function format(){if(!isNormalSkinOrder())return;document.querySelectorAll('textarea').forEach(el=>{const v=fixValue(el.value);if(v!==el.value)el.value=v;});const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=walker.nextNode())){const v=fixValue(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v;}}
  function afterRender(){setTimeout(format,0);setTimeout(format,30);setTimeout(format,100);}
  document.addEventListener('input',function(e){if(e.target&&(/^(orderUid|orderName)$/.test(e.target.id)||e.target.id==='orderServer'))afterRender();},true);
  document.addEventListener('change',function(e){if(e.target&&(/^(orderUid|orderName|orderServer)$/.test(e.target.id)))afterRender();},true);
})();
