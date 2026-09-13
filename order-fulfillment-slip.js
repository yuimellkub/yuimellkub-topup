(function(){
  'use strict';

  const style=document.createElement('style');
  style.textContent=`
    .ymk-customer-fulfillment{margin-top:14px;padding:12px;border-radius:14px;background:#fff8fb;border:1px solid #f2ccdc;text-align:left}
    .ymk-customer-fulfillment-title{font-weight:900;color:#8f4f68;font-size:13px;margin-bottom:8px;text-align:center}
    .ymk-customer-fulfillment-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;max-height:330px;overflow:auto;padding:2px}
    .ymk-customer-fulfillment-item{padding:4px;border-radius:9px;background:#fff;border:1px solid #f4d6e2;aspect-ratio:1/1;overflow:hidden}
    .ymk-customer-fulfillment img{display:block;width:100%;height:100%;object-fit:cover;border-radius:6px;background:#fff;cursor:pointer}
    .ymk-customer-fulfillment-save-all{display:flex;align-items:center;justify-content:center;width:100%;min-height:44px;margin-top:10px;border:0;border-radius:12px;background:#e889ad;color:#fff;font-weight:850;font-size:13px;cursor:pointer}
    .ymk-customer-fulfillment-save-all:disabled{opacity:.65;cursor:default}
    .ymk-customer-fulfillment-note{text-align:center;font-size:11px;color:#a16b80;line-height:1.5;margin-top:8px}
    .ymk-customer-fulfillment-viewer{position:fixed;inset:0;z-index:999999;background:rgba(64,37,49,.72);display:flex;align-items:center;justify-content:center;padding:20px}
    .ymk-customer-fulfillment-viewer img{max-width:min(92vw,900px);max-height:88vh;width:auto;height:auto;object-fit:contain;border-radius:12px;background:#fff}
    @media(max-width:520px){.ymk-customer-fulfillment-grid{grid-template-columns:repeat(3,minmax(0,1fr));max-height:285px}}
  `;
  document.head.appendChild(style);

  function getDb(){try{if(!window.firebase||!firebase.firestore)return null;if(!firebase.apps.length){if(!window.YUIMELLKUB_FIREBASE_CONFIG)return null;firebase.initializeApp(window.YUIMELLKUB_FIREBASE_CONFIG);}return firebase.firestore();}catch(e){return null;}}
  function removeOld(){document.querySelectorAll('.ymk-customer-fulfillment,.ymk-customer-fulfillment-viewer').forEach(el=>el.remove());}
  function getImages(data){if(Array.isArray(data.fulfillmentSlipDataList)&&data.fulfillmentSlipDataList.length)return data.fulfillmentSlipDataList.filter(x=>typeof x==='string'&&x.startsWith('data:image/'));return data.fulfillmentSlipData?[data.fulfillmentSlipData]:[];}
  function downloadOne(src,name){const a=document.createElement('a');a.href=src;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();}
  async function downloadAll(images,safeId,btn){if(!images.length)return;const old=btn.textContent;btn.disabled=true;try{for(let i=0;i<images.length;i++){btn.textContent=`กำลังบันทึก ${i+1}/${images.length}…`;downloadOne(images[i],`Yuimellkub-${safeId}-slip-${i+1}.jpg`);await new Promise(r=>setTimeout(r,180));}btn.textContent='✓ ส่งบันทึกครบแล้ว';setTimeout(()=>{btn.textContent=old;btn.disabled=false;},1200);}catch(e){btn.textContent=old;btn.disabled=false;alert('บันทึกสลิปไม่สำเร็จ กรุณาลองใหม่อีกครั้งค่ะ');}}
  function openViewer(src){const viewer=document.createElement('div');viewer.className='ymk-customer-fulfillment-viewer';const img=document.createElement('img');img.src=src;img.alt='สลิปการเติมเกม';viewer.appendChild(img);viewer.onclick=()=>viewer.remove();document.body.appendChild(viewer);}

  async function attachSlip(orderId,status){
    removeOld();if(String(status||'').trim()!=='สำเร็จ')return;const db=getDb();if(!db)return;
    try{
      const snap=await db.collection('order_status').doc(orderId).get();if(!snap.exists)return;const data=snap.data()||{},images=getImages(data);if(!images.length)return;
      const card=document.getElementById('ymkForceCard');if(!card)return;const close=card.querySelector('#ymkForceClose'),box=document.createElement('div');box.className='ymk-customer-fulfillment';const safeId=String(orderId||'order').replace(/[^A-Za-z0-9_-]/g,'');
      box.innerHTML=`<div class="ymk-customer-fulfillment-title">สลิปการเติมเกม (${images.length} รูป)</div><div class="ymk-customer-fulfillment-grid"></div><button type="button" class="ymk-customer-fulfillment-save-all">บันทึกสลิปทั้งหมด${images.length>1?' ('+images.length+' รูป)':''}</button><div class="ymk-customer-fulfillment-note">แตะรูปเพื่อดูขนาดเต็ม • กดปุ่มเดียวเพื่อบันทึกทั้งหมดค่ะ</div>`;
      const grid=box.querySelector('.ymk-customer-fulfillment-grid');images.forEach((src,i)=>{const item=document.createElement('div');item.className='ymk-customer-fulfillment-item';const img=document.createElement('img');img.alt='สลิปการเติมเกม '+(i+1);img.src=src;img.onclick=()=>openViewer(src);item.appendChild(img);grid.appendChild(item);});
      const saveAll=box.querySelector('.ymk-customer-fulfillment-save-all');saveAll.onclick=()=>downloadAll(images,safeId,saveAll);if(close)card.insertBefore(box,close);else card.appendChild(box);
    }catch(e){console.warn('load fulfillment slips failed',e);}
  }
  function hook(){const original=window.handleTrackedStatusPopup;if(typeof original!=='function')return setTimeout(hook,200);if(original._ymkFulfillmentHooked)return;function wrapped(orderId,status){const out=original.apply(this,arguments);setTimeout(()=>attachSlip(orderId,status),0);return out;}wrapped._ymkFulfillmentHooked=true;wrapped._ymkOriginal=original;window.handleTrackedStatusPopup=wrapped;}
  hook();
})();