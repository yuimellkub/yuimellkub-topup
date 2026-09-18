(function(){
'use strict';
const style=document.createElement('style');
style.textContent=`
.ymk-manage-btn{border:1px solid #e889ad;background:#fff0f6;color:#92566e;border-radius:11px;padding:9px 13px;font-weight:900;cursor:pointer}
.ymk-close-modal{position:fixed;inset:0;z-index:99999;background:rgba(88,53,68,.38);display:flex;align-items:center;justify-content:center;padding:18px}
.ymk-close-dialog{width:min(720px,100%);max-height:92vh;overflow:auto;background:#fffafc;border:1px solid #f0bfd3;border-radius:20px;box-shadow:0 22px 70px rgba(91,47,67,.22);padding:18px}
.ymk-close-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;position:sticky;top:-18px;background:#fffafc;padding:18px 0 10px;z-index:3}
.ymk-close-title{font-size:19px;font-weight:900;color:#8f4f68}.ymk-close-sub{font-size:11px;color:#aa7c8e;margin-top:3px}
.ymk-close-x{border:0;background:#fff0f6;color:#92566e;width:36px;height:36px;border-radius:10px;font-size:20px;cursor:pointer}
.ymk-close-summary{display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;padding:12px;border:1px solid #f2ccdc;border-radius:14px;background:#fff;margin-bottom:12px;font-size:12px;line-height:1.45}
.ymk-close-summary b{display:block;color:#8f5d71;font-size:11px}.ymk-close-work>.statusBox{margin-top:0}.ymk-close-work>.ymk-fulfillment-slip{margin-top:12px}
@media(max-width:620px){.ymk-close-summary{grid-template-columns:1fr}.ymk-close-dialog{padding:14px}.ymk-close-head{top:-14px}}
`;
document.head.appendChild(style);

let active=null;
function summary(card){
 const rows=[...card.querySelectorAll('.row')].slice(0,8).map(x=>'<div>'+x.innerHTML+'</div>').join('');
 const price=card.querySelector('.price')?.textContent||'';
 return rows+(price?'<div><b>ยอดชำระ</b><strong>'+price+'</strong></div>':'');
}
function close(){
 if(!active)return;
 const {card,modal,status,panel,statusNext,panelNext}=active;
 if(status){ if(statusNext&&statusNext.parentNode)statusNext.before(status); else card.appendChild(status); }
 if(panel){ if(panelNext&&panelNext.parentNode)panelNext.before(panel); else card.appendChild(panel); }
 modal.remove(); document.body.style.overflow=''; active=null;
}
function open(card){
 close();
 const status=card.querySelector('.statusBox'),panel=card.querySelector('.ymk-fulfillment-slip');
 if(!status&&!panel)return;
 const modal=document.createElement('div');modal.className='ymk-close-modal';
 const dialog=document.createElement('div');dialog.className='ymk-close-dialog';
 dialog.innerHTML='<div class="ymk-close-head"><div><div class="ymk-close-title">♡ ปิดออเดอร์</div><div class="ymk-close-sub">'+(card.dataset.id||'')+' • จัดการสถานะและแนบสลิปได้ตรงนี้ ไม่ต้องเลื่อนลง</div></div><button class="ymk-close-x" type="button">×</button></div><div class="ymk-close-summary">'+summary(card)+'</div><div class="ymk-close-work"></div>';
 modal.appendChild(dialog);document.body.appendChild(modal);document.body.style.overflow='hidden';
 const work=dialog.querySelector('.ymk-close-work'),statusNext=status?.nextSibling,panelNext=panel?.nextSibling;
 if(status)work.appendChild(status);if(panel)work.appendChild(panel);
 active={card,modal,status,panel,statusNext,panelNext};
 dialog.querySelector('.ymk-close-x').onclick=close;
 modal.addEventListener('click',e=>{if(e.target===modal)close()});
}
function enhance(){
 document.querySelectorAll('#orders .card').forEach(card=>{
  if(card.dataset.closeModal==='1')return;
  const top=card.querySelector('.cardTop');if(!top)return;
  card.dataset.closeModal='1';
  const btn=document.createElement('button');btn.type='button';btn.className='ymk-manage-btn';btn.textContent='ปิดออเดอร์';
  btn.onclick=()=>open(card);top.appendChild(btn);
 });
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
const root=document.getElementById('orders');if(root)new MutationObserver(()=>setTimeout(enhance,0)).observe(root,{childList:true,subtree:true});
setTimeout(enhance,300);
})();