(function(){
'use strict';
const REMOVE=new Set(['รอตรวจสอบการชำระเงิน','ชำระแล้ว']);
function clean(){
  document.querySelectorAll('#orders select.shopStatus').forEach(sel=>{
    [...sel.options].forEach(opt=>{if(REMOVE.has(opt.value)||REMOVE.has(opt.textContent.trim()))opt.remove();});
    if(REMOVE.has(sel.value)){
      const next=[...sel.options].find(o=>o.value==='กำลังเติม')||sel.options[0];
      if(next) sel.value=next.value;
    }
  });
}
const root=document.getElementById('orders');
if(root)new MutationObserver(clean).observe(root,{childList:true,subtree:true});
clean();
})();