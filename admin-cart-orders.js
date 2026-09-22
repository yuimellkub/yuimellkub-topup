(function(){
'use strict';
const css=document.createElement('style');css.textContent=`
.ymk-cart-admin{margin:10px 0;padding:11px 12px;border:1px solid #efc8d7;border-radius:14px;background:#fff8fb;color:#74485b}
.ymk-cart-admin-title{font-size:12px;font-weight:900;color:#cf6d95;margin-bottom:7px}.ymk-cart-admin-group{padding:7px 0;border-top:1px dashed #efd2dd;font-size:11px;line-height:1.65}.ymk-cart-admin-group:first-of-type{border-top:0}
`;document.head.appendChild(css);
function parse(card){
 const txt=card.innerText||'';if(!/ตะกร้า\s+\d+\s+รายการ/.test(txt))return null;
 const groups=[];const re=/ID\s+([^\s(]+)\s*\((Asia|NA-EU)\):\s*([^;\n]+)/g;let m;while((m=re.exec(txt)))groups.push({uid:m[1],server:m[2],items:m[3].trim()});return groups.length?groups:null;
}
function scan(){
 document.querySelectorAll('#orders .card').forEach(card=>{if(card.querySelector('.ymk-cart-admin'))return;const groups=parse(card);if(!groups)return;const box=document.createElement('div');box.className='ymk-cart-admin';box.innerHTML='<div class="ymk-cart-admin-title">🛒 ออเดอร์หลายสินค้า • แยกเติมตาม ID</div>'+groups.map(g=>'<div class="ymk-cart-admin-group"><b>ID '+g.uid+' • '+g.server+'</b><br>'+g.items+'</div>').join('');const top=card.querySelector('.cardTop');if(top)top.insertAdjacentElement('afterend',box);else card.prepend(box)});
}
const root=document.getElementById('orders');if(root){new MutationObserver(()=>setTimeout(scan,0)).observe(root,{childList:true,subtree:true});scan()}
})();