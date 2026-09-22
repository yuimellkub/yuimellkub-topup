(function(){
'use strict';
const CART_KEY='ymk_cart_v1';
let cart=[];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number(String(v??'').replace(/[^0-9.]/g,''))||0;
const clean=v=>String(v||'').replace(/\s*[×xX]\s*\d+\s*$/,'').trim();
function load(){try{cart=JSON.parse(localStorage.getItem(CART_KEY)||'[]');if(!Array.isArray(cart))cart=[]}catch(_){cart=[]}}
function save(){try{localStorage.setItem(CART_KEY,JSON.stringify(cart))}catch(_){} renderBadge()}
function productPack(name,price,qty){
  const base=clean(name), total=Math.round(num(price)*qty);
  try{
    const p=window.YMK_PRODUCT_PACK_BY_PRICE?.find?.(total);
    if(p?.text)return {text:p.text,received:p.received||0};
  }catch(_){}
  const m=base.match(/(66|203|335|759)\s*(?:กระดุม)?/i);
  if(m)return {text:Number(m[1]).toLocaleString()+' × '+qty,received:Number(m[1])*qty};
  return {text:'',received:0};
}
function cardInfo(card){
  const btn=card?.querySelector('.ready-stock-order-btn'); if(!btn)return null;
  const input=card.querySelector('.ymk-qty-input');
  const qty=Math.max(1,Math.floor(Number(input?.value)||1));
  const name=clean(btn.dataset.ymkBaseName||btn.dataset.readyName||card.querySelector('h3')?.textContent||'สินค้า');
  const unit=num(btn.dataset.ymkUnitPrice||btn.dataset.readyPrice);
  const category=String(btn.dataset.readyCategory||card.closest('[data-stock-panel]')?.dataset.stockPanel||'echoes');
  const pack=productPack(name,unit,qty);
  return {id:'c'+Date.now()+Math.random().toString(36).slice(2,7),name,category,qty,unitPrice:unit,total:unit*qty,pack:pack.text,received:pack.received,uid:'',server:'Asia'};
}
function style(){
 const s=document.createElement('style');s.textContent=`
 #ymkCartFab{position:fixed;right:18px;bottom:155px;z-index:999990;border:0;border-radius:999px;background:#df7ca4;color:#fff;padding:11px 14px;font:inherit;font-weight:900;box-shadow:0 8px 28px #b45f8040;cursor:pointer;display:flex;align-items:center;gap:5px}
 #ymkCartFab b{background:#fff;color:#d76f99;border-radius:999px;padding:2px 7px;margin:0}
 #ymkCartShade{display:none;position:fixed;inset:0;z-index:999995;background:#5e394b55;backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);padding:18px;overflow:auto}
 #ymkCartBox{position:fixed!important;right:0!important;left:auto!important;top:0!important;bottom:0!important;width:min(430px,92vw)!important;max-width:none!important;height:100vh!important;margin:0!important;transform:none!important;background:#fff!important;padding:20px!important;box-sizing:border-box!important;box-shadow:-18px 0 55px #5e394b38!important;color:#71465a;overflow-y:auto!important;border-radius:22px 0 0 22px!important}
 .ymkCartHead{display:flex;align-items:center;justify-content:space-between;gap:10px}.ymkCartHead h2{margin:0;color:#c95f8b}
 .ymkCartClose,.ymkCartRemove{border:0;background:#fff0f6;color:#a45e79;border-radius:10px;padding:8px 10px;font-weight:900;cursor:pointer}
 .ymkCartItem{border:1px solid #f0ccda;background:#fff9fb;border-radius:16px;padding:13px;margin-top:10px}
 .ymkCartRow{display:flex;justify-content:space-between;gap:10px}.ymkCartName{font-weight:900}.ymkCartPrice{font-weight:900;color:#d96f9a}
 .ymkCartPack{font-size:11px;color:#9a6b7d;margin:5px 0 10px}
 .ymkCartFields{display:grid;grid-template-columns:1fr 130px;gap:8px}.ymkCartFields input,.ymkCartFields select{height:40px;border:1px solid #efc8d7;border-radius:11px;padding:0 10px;background:#fff;color:#71465a;box-sizing:border-box;width:100%}
 .ymkCartSame{margin:12px 0;padding:10px;border-radius:13px;background:#fff2f7;font-size:12px}
 .ymkCartTotal{display:flex;justify-content:space-between;font-size:18px;font-weight:900;margin:16px 0}
 #ymkCartCheckout{width:100%;height:50px;border:0;border-radius:999px;background:#df7ca4;color:#fff;font:inherit;font-weight:900;cursor:pointer}
 #ymkCartCheckout:disabled{opacity:.5}.ymkCartEmpty{text-align:center;padding:30px 10px;color:#a57a8a}
 .ymk-cart-plus{border:0;border-radius:50%;background:#fff0f6;color:#c95f8b;font:inherit;font-weight:900;cursor:pointer;width:34px;height:34px;padding:0;margin-right:6px;display:inline-flex;align-items:center;justify-content:center;line-height:1;box-shadow:inset 0 0 0 1px #efc8d7}.ymk-cart-plus:hover{background:#ffe5ef}.ymk-added{animation:ymkpop .28s ease}@keyframes ymkpop{50%{transform:scale(1.06)}}
 @media(max-width:560px){#ymkCartFab{right:12px;bottom:150px;top:auto;transform:none;padding:10px 12px}.ymkCartFields{grid-template-columns:1fr}.ymkCartRow{align-items:flex-start}}
 `;document.head.appendChild(s);
}
function shell(){
 const fab=document.createElement('button');fab.id='ymkCartFab';fab.type='button';fab.innerHTML='🛒 ตะกร้า <b>0</b>';fab.onclick=open;document.body.appendChild(fab);
 const sh=document.createElement('div');sh.id='ymkCartShade';sh.innerHTML='<div id="ymkCartBox"><div class="ymkCartHead"><h2>🛒 ตะกร้าของคุณ</h2><button class="ymkCartClose" type="button">ปิด</button></div><div id="ymkCartList"></div><label class="ymkCartSame"><input id="ymkSameId" type="checkbox"> ใช้ ID + Server ของรายการแรกกับทุกรายการ</label><div class="ymkCartTotal"><span>ยอดชำระทั้งหมด</span><span id="ymkCartTotal">0 บาท</span></div><button id="ymkCartCheckout" type="button">ชำระเงิน</button></div>';
 document.body.appendChild(sh);sh.querySelector('.ymkCartClose').onclick=close;sh.addEventListener('click',e=>{if(e.target===sh)close()});sh.querySelector('#ymkSameId').onchange=applySame;sh.querySelector('#ymkCartCheckout').onclick=checkout;
}
function renderBadge(){const b=document.querySelector('#ymkCartFab b');if(b)b.textContent=String(cart.reduce((n,x)=>n+x.qty,0))}
function render(){
 const list=document.getElementById('ymkCartList');if(!list)return;
 if(!cart.length){list.innerHTML='<div class="ymkCartEmpty">ยังไม่มีสินค้าในตะกร้า ♡</div>'}
 else list.innerHTML=cart.map((x,i)=>`<div class="ymkCartItem" data-i="${i}"><div class="ymkCartRow"><div><div class="ymkCartName">${esc(x.name)} × ${x.qty}</div><div class="ymkCartPack">${x.pack?'แพ็ก: '+esc(x.pack):''}</div></div><div><div class="ymkCartPrice">${Number(x.total).toLocaleString('th-TH')} บาท</div><button class="ymkCartRemove" type="button" data-rm="${i}">ลบ</button></div></div><div class="ymkCartFields"><input class="ymkUid" data-i="${i}" placeholder="ID / UID" value="${esc(x.uid)}"><select class="ymkServer" data-i="${i}"><option ${x.server==='Asia'?'selected':''}>Asia</option><option ${x.server==='NA-EU'?'selected':''}>NA-EU</option></select></div></div>`).join('');
 list.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{cart.splice(Number(b.dataset.rm),1);save();render()});
 list.querySelectorAll('.ymkUid').forEach(el=>el.oninput=()=>{cart[+el.dataset.i].uid=el.value.trim();save();if(document.getElementById('ymkSameId')?.checked)applySame()});
 list.querySelectorAll('.ymkServer').forEach(el=>el.onchange=()=>{cart[+el.dataset.i].server=el.value;save();if(document.getElementById('ymkSameId')?.checked)applySame()});
 const total=cart.reduce((n,x)=>n+num(x.total),0);document.getElementById('ymkCartTotal').textContent=total.toLocaleString('th-TH')+' บาท';document.getElementById('ymkCartCheckout').disabled=!cart.length;
}
function applySame(){const cb=document.getElementById('ymkSameId');if(!cb?.checked||!cart.length)return;const uid=document.querySelector('.ymkUid[data-i="0"]')?.value.trim()||cart[0].uid,server=document.querySelector('.ymkServer[data-i="0"]')?.value||cart[0].server;cart.forEach(x=>{x.uid=uid;x.server=server});save();render();cb.checked=true}
function open(){render();document.getElementById('ymkCartShade').style.display='block'}
function close(){document.getElementById('ymkCartShade').style.display='none'}
function add(card){
 const info=cardInfo(card);if(!info)return;
 const same=cart.find(x=>x.name===info.name&&x.unitPrice===info.unitPrice&&!x.uid);
 if(same){same.qty+=info.qty;same.total=same.unitPrice*same.qty;const p=productPack(same.name,same.unitPrice,same.qty);same.pack=p.text;same.received=p.received}else cart.push(info);
 save();const fab=document.getElementById('ymkCartFab');fab?.classList.add('ymk-added');setTimeout(()=>fab?.classList.remove('ymk-added'),300);
 const wrap=card.querySelector('.ymk-qty-wrap'),btn=card.querySelector('.ready-stock-order-btn');if(wrap)wrap.style.display='none';if(btn){btn.style.display='';btn.dataset.ymkQtyOpen='0'}const input=card.querySelector('.ymk-qty-input');if(input)input.value='1';
}
function packTotals(){
 const totals={66:0,203:0,335:0,759:0};
 cart.forEach(x=>{const t=String(x.pack||'').replace(/,/g,'');let m,re=/(66|203|335|759)\s*[×x*]\s*(\d+)/g;while((m=re.exec(t)))totals[m[1]]+=Number(m[2])||0});
 return [759,335,203,66].filter(n=>totals[n]).map(n=>n+' × '+totals[n]).join(' + ');
}
function syncInputs(){
 document.querySelectorAll('.ymkUid').forEach(el=>{if(cart[+el.dataset.i])cart[+el.dataset.i].uid=el.value.trim()});
 document.querySelectorAll('.ymkServer').forEach(el=>{if(cart[+el.dataset.i])cart[+el.dataset.i].server=el.value});save();
}
function checkout(){
 syncInputs();if(!cart.length)return;
 const missing=cart.find(x=>!String(x.uid||'').trim());if(missing){alert('กรุณากรอก ID / UID ให้ครบทุกรายการค่ะ');return}
 const total=cart.reduce((n,x)=>n+num(x.total),0), packs=packTotals();
 const groups={};cart.forEach(x=>{const k=x.uid+'|'+x.server;(groups[k]||(groups[k]=[])).push(x)});
 const groupText=Object.entries(groups).map(([k,items])=>{const [uid,server]=k.split('|');return 'ID '+uid+' ('+server+'): '+items.map(x=>x.name+' ×'+x.qty+(x.pack?' ['+x.pack+']':'')).join(', ')}).join(' ; ');
 const summary='ตะกร้า '+cart.reduce((n,x)=>n+x.qty,0)+' รายการ | '+groupText;
 const first=cart[0],card=[...document.querySelectorAll('.ready-stock-card')].find(c=>clean(c.querySelector('.ready-stock-order-btn')?.dataset.ymkBaseName||c.querySelector('.ready-stock-order-btn')?.dataset.readyName)===first.name)||document.querySelector('.ready-stock-card');
 const btn=card?.querySelector('.ready-stock-order-btn');if(!btn){alert('ไม่พบปุ่มสั่งซื้อ กรุณารีเฟรชหน้าแล้วลองใหม่');return}
 window.YMK_CART_ACTIVE={items:JSON.parse(JSON.stringify(cart)),summary,total,packs,firstUid:first.uid,firstServer:first.server};
 const old={name:btn.dataset.readyName,price:btn.dataset.readyPrice,confirm:btn.dataset.ymkConfirming};
 btn.dataset.readyName=summary;btn.dataset.readyPrice=String(total);btn.dataset.ymkConfirming='1';close();btn.click();
 setTimeout(()=>{btn.dataset.readyName=old.name||first.name;btn.dataset.readyPrice=old.price||String(first.unitPrice);if(old.confirm)btn.dataset.ymkConfirming=old.confirm;else delete btn.dataset.ymkConfirming;patchOrder()},50);
}
function patchOrder(){
 const c=window.YMK_CART_ACTIVE;if(!c)return;
 try{
   if(typeof lastOrder!=='undefined'&&lastOrder){lastOrder.item=c.summary;lastOrder.productName='ตะกร้าสินค้า';lastOrder.pack=c.packs;lastOrder.packPlan=c.packs;lastOrder.price=c.total;lastOrder.cartItems=c.items;lastOrder.cartOrder=true;lastOrder.quantity=c.items.reduce((n,x)=>n+x.qty,0)}
 }catch(_){}
 const uid=document.getElementById('orderUid');if(uid){uid.value=c.firstUid;uid.readOnly=true}
 const sv=document.getElementById('orderServer');if(sv)sv.value=c.firstServer;
 const patchText=()=>{document.querySelectorAll('textarea,input').forEach(el=>{if(el===uid)return;let v=String(el.value||'');if(/รายการ:|ยอดรวม:|แพ็ก:/.test(v)){v=v.replace(/รายการ:[^\r\n]*/,'รายการ: '+c.summary).replace(/แพ็ก:[^\r\n]*/,'แพ็ก: '+c.packs).replace(/ยอดรวม:\s*[\d,.]+\s*(?:บาท)?/,'ยอดรวม: '+c.total.toLocaleString('th-TH')+' บาท');el.value=v}})};
 patchText();setTimeout(patchText,200);
}
document.addEventListener('click',e=>{const b=e.target.closest('.ymk-cart-plus');if(!b)return;const card=b.closest('.ready-stock-card');if(!card)return;e.preventDefault();e.stopPropagation();add(card)},true);
document.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;if(/ส่งออเดอร์|ตรวจสลิป|ส่งสลิป/.test(t.textContent||''))patchOrder()},true);
function injectCartButtons(){document.querySelectorAll('.ready-stock-card').forEach(card=>{if(card.querySelector('.ymk-cart-plus'))return;const buy=card.querySelector('.ready-stock-order-btn');if(!buy)return;const plus=document.createElement('button');plus.type='button';plus.className='ymk-cart-plus';plus.textContent='🛒';buy.parentNode.insertBefore(plus,buy)})}
const mo=new MutationObserver(()=>{if(window.YMK_CART_ACTIVE)patchOrder();injectCartButtons()});
function init(){style();shell();load();renderBadge();injectCartButtons();mo.observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.YMK_CART={open,clear(){cart=[];save();render()},items:()=>cart.slice()};
})();