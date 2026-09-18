(function(){
'use strict';
const style=document.createElement('style');
style.textContent=`
.ymk-collapse-tools{display:flex;gap:8px;justify-content:flex-end;margin:10px 0 8px}
.ymk-collapse-all{border:1px solid #efc8d7;border-radius:11px;padding:9px 13px;font-weight:900;cursor:pointer;background:#fff0f6;color:#92566e}
#orders .card.ymk-collapsed{padding-bottom:12px}
#orders .card.ymk-collapsed>:not(.cardTop){display:none!important}
#orders .card .ymk-card-toggle{border:1px solid #efc8d7;border-radius:10px;padding:7px 10px;font-weight:800;cursor:pointer;background:#fff;color:#92566e;font-size:11px;margin-left:8px}
`;document.head.appendChild(style);
const root=document.getElementById('orders');if(!root)return;
const tools=document.createElement('div');tools.className='ymk-collapse-tools';
const all=document.createElement('button');all.type='button';all.className='ymk-collapse-all';all.textContent='ปิดทุกออเดอร์';tools.appendChild(all);
root.parentNode.insertBefore(tools,root);
let collapsed=false;
function setup(){
 root.querySelectorAll('.card').forEach(card=>{
  if(card.dataset.ymkCollapseReady==='1')return;
  card.dataset.ymkCollapseReady='1';
  const top=card.querySelector('.cardTop');if(!top)return;
  const b=document.createElement('button');b.type='button';b.className='ymk-card-toggle';b.textContent='ย่อ';
  b.onclick=e=>{e.stopPropagation();card.classList.toggle('ymk-collapsed');b.textContent=card.classList.contains('ymk-collapsed')?'เปิด':'ย่อ'};
  top.appendChild(b);
  if(collapsed){card.classList.add('ymk-collapsed');b.textContent='เปิด'}
 });
}
all.onclick=()=>{
 collapsed=!collapsed;
 root.querySelectorAll('.card').forEach(card=>{card.classList.toggle('ymk-collapsed',collapsed);const b=card.querySelector('.ymk-card-toggle');if(b)b.textContent=collapsed?'เปิด':'ย่อ'});
 all.textContent=collapsed?'เปิดทุกออเดอร์':'ปิดทุกออเดอร์';
};
new MutationObserver(()=>setTimeout(setup,0)).observe(root,{childList:true,subtree:true});
setup();
})();