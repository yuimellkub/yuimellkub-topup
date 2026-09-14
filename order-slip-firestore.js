(function(){
'use strict';

const WORKER_BASE='https://yuimellkub-slip.yuimellkubtopup.workers.dev';
const AUTO_ORDER_URL=WORKER_BASE+'/auto-order';
const SETTINGS_ID='ymk_store_settings';
const MAX_SOURCE_BYTES=4*1024*1024;
const MAX_FALLBACK_DATA_URL=520000;

const OLD_SLIP_COPY='ร้านจะตรวจสอบการชำระเงินภายหลัง ไม่มีการยืนยันว่าเงินเข้าอัตโนมัติ';
const AUTO_SLIP_COPY='ระบบจะตรวจสอบสลิปอัตโนมัติก่อนส่งออเดอร์';
const MANUAL_SLIP_COPY='ร้านจะตรวจสอบสลิปก่อน ออเดอร์จะเริ่มดำเนินการเมื่อร้านยืนยันการชำระเงินแล้ว';

let currentSlipMode='auto',modeUnsub=null;

function firebaseServices(){
  try{
    if(!window.firebase||!window.YUIMELLKUB_FIREBASE_CONFIG)return null;
    if(!firebase.apps.length)firebase.initializeApp(window.YUIMELLKUB_FIREBASE_CONFIG);
    return {db:firebase.firestore()};
  }catch(e){return null;}
}

function updateSlipCopy(root=document.body){
  if(!root)return;
  const replacement=currentSlipMode==='manual'?MANUAL_SLIP_COPY:AUTO_SLIP_COPY;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode())){
    if(!node.nodeValue)continue;
    [OLD_SLIP_COPY,AUTO_SLIP_COPY,MANUAL_SLIP_COPY].forEach(text=>{
      if(node.nodeValue.includes(text))node.nodeValue=node.nodeValue.replace(text,replacement);
    });
    if(currentSlipMode==='manual'&&node.nodeValue.trim()==='ตรวจสลิปและส่งออเดอร์')node.nodeValue='ส่งสลิปให้ร้านตรวจสอบ';
    if(currentSlipMode==='auto'&&node.nodeValue.trim()==='ส่งสลิปให้ร้านตรวจสอบ')node.nodeValue='ตรวจสลิปและส่งออเดอร์';
  }
}

function setSlipMode(mode){
  currentSlipMode=mode==='manual'?'manual':'auto';
  updateSlipCopy();
}

function startModeListener(){
  try{
    const s=firebaseServices();
    if(!s)return setTimeout(startModeListener,500);
    if(modeUnsub)modeUnsub();
    modeUnsub=s.db.collection('products').doc(SETTINGS_ID).onSnapshot(
      snap=>setSlipMode(snap.exists&&snap.data()?.slipVerificationMode==='manual'?'manual':'auto'),
      ()=>setSlipMode('auto')
    );
  }catch(e){setTimeout(startModeListener,800);}
}

if(document.body){
  updateSlipCopy();
  new MutationObserver(()=>updateSlipCopy()).observe(document.body,{childList:true,subtree:true});
  startModeListener();
}else{
  document.addEventListener('DOMContentLoaded',()=>{
    updateSlipCopy();
    new MutationObserver(()=>updateSlipCopy()).observe(document.body,{childList:true,subtree:true});
    startModeListener();
  },{once:true});
}

async function getSlipMode(db){
  try{
    const snap=await db.collection('products').doc(SETTINGS_ID).get();
    setSlipMode(snap.exists&&snap.data()?.slipVerificationMode==='manual'?'manual':'auto');
  }catch(e){
    console.warn('read slip mode failed; leaving manual wrapper to fail closed',e);
  }
  return currentSlipMode;
}

function getLastOrderSafe(){
  try{return typeof lastOrder!=='undefined'&&lastOrder?lastOrder:{};}catch(e){return {};}
}

function getPaymentSafe(){
  try{return typeof getPaymentMethod==='function'?getPaymentMethod():'';}catch(e){return '';}
}

function setCurrentOrderId(id){
  const value=String(id||'').trim();
  try{currentOrderId=value;}catch(e){}
  window.currentOrderId=value;
}

function statusEl(){return document.getElementById('adminSaveStatus');}

function showStatus(kind,text){
  const st=statusEl();
  if(!st)return;
  st.style.display='block';
  st.className=kind==='ok'?'verify-status ok':'verify-status';
  st.textContent=text;
}

function compressFallbackSlip(file){
  return new Promise((resolve,reject)=>{
    if(!file)return reject(new Error('กรุณาแนบสลิปก่อนส่งออเดอร์'));
    if(!String(file.type||'').startsWith('image/'))return reject(new Error('กรุณาแนบสลิปเป็นรูปภาพ'));
    if(file.size>MAX_SOURCE_BYTES)return reject(new Error('รูปสลิปต้องมีขนาดไม่เกิน 4MB'));

    const reader=new FileReader(),img=new Image();
    reader.onerror=()=>reject(new Error('อ่านรูปสลิปไม่สำเร็จ'));
    img.onerror=()=>reject(new Error('เปิดรูปสลิปไม่สำเร็จ'));
    reader.onload=()=>{img.src=String(reader.result||'');};
    img.onload=()=>{
      try{
        const maxSide=1400;
        const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
        const width=Math.max(1,Math.round(img.naturalWidth*scale));
        const height=Math.max(1,Math.round(img.naturalHeight*scale));
        const canvas=document.createElement('canvas');
        canvas.width=width;canvas.height=height;
        const ctx=canvas.getContext('2d',{alpha:false});
        ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(img,0,0,width,height);
        let quality=.78,data=canvas.toDataURL('image/jpeg',quality);
        while(data.length>MAX_FALLBACK_DATA_URL&&quality>.34){quality-=.07;data=canvas.toDataURL('image/jpeg',quality);}
        if(data.length>MAX_FALLBACK_DATA_URL)throw new Error('รูปสลิปมีขนาดใหญ่เกินไป กรุณาครอปรูปแล้วลองใหม่');
        resolve({data,width,height,bytes:data.length});
      }catch(e){reject(e);}
    };
    reader.readAsDataURL(file);
  });
}

async function submitAutoOrder(file,draft,fallback){
  const form=new FormData();
  form.append('image',file,file.name||'slip.jpg');
  form.append('item',draft.item||'');
  form.append('pack',draft.pack||'');
  form.append('price',draft.price||'');
  form.append('paymentMethod',draft.paymentMethod||'');
  form.append('uid',draft.uid||'');
  form.append('server',draft.server||'Asia');
  form.append('name',draft.name||'');
  form.append('fallbackImageData',fallback.data||'');
  form.append('fallbackWidth',String(fallback.width||0));
  form.append('fallbackHeight',String(fallback.height||0));
  form.append('fallbackBytes',String(fallback.bytes||0));

  let response;
  try{
    response=await fetch(AUTO_ORDER_URL,{method:'POST',body:form});
  }catch(e){
    throw new Error('เชื่อมระบบตรวจสลิปไม่ได้ กรุณาลองใหม่อีกครั้ง');
  }

  let data={};
  try{data=await response.json();}catch(e){}
  if(!response.ok||!data.ok){
    const err=new Error(data.message||'ตรวจสอบสลิปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    err.code=data.error||('HTTP_'+response.status);
    throw err;
  }
  return data;
}

const previousSave=window.saveOrderToDemoAdmin;

window.saveOrderToDemoAdmin=async function(){
  const services=firebaseServices();
  if(!services){
    if(typeof previousSave==='function')return previousSave.apply(this,arguments);
    showStatus('bad','เชื่อมระบบร้านไม่ได้ กรุณาลองใหม่อีกครั้ง');
    return false;
  }

  const selectedMode=await getSlipMode(services.db);

  /* ร้านตรวจเองยังใช้ flow เดิมทั้งหมด */
  if(selectedMode==='manual'&&typeof previousSave==='function'){
    return previousSave.apply(this,arguments);
  }

  const slip=document.getElementById('slipFile')?.files?.[0]||null;
  if(!slip){showStatus('bad','ส่งออเดอร์ไม่สำเร็จ: กรุณาแนบสลิปก่อนส่งออเดอร์');return false;}
  if(!String(slip.type||'').startsWith('image/')){showStatus('bad','ส่งออเดอร์ไม่สำเร็จ: กรุณาแนบสลิปเป็นรูปภาพ');return false;}
  if(slip.size>MAX_SOURCE_BYTES){showStatus('bad','ส่งออเดอร์ไม่สำเร็จ: รูปสลิปต้องมีขนาดไม่เกิน 4MB');return false;}

  const order=getLastOrderSafe();
  const draft={
    item:order.item||'',
    pack:order.pack||'',
    price:order.price||'',
    paymentMethod:getPaymentSafe(),
    uid:(document.getElementById('orderUid')?.value||'').trim(),
    server:document.getElementById('orderServer')?.value||'Asia',
    name:(document.getElementById('orderName')?.value||'').trim()
  };

  if(!draft.uid){showStatus('bad','ส่งออเดอร์ไม่สำเร็จ: กรุณากรอก UID');return false;}

  try{
    showStatus('wait','กำลังตรวจสอบสลิปอัตโนมัติ…');
    const fallback=await compressFallbackSlip(slip);
    const result=await submitAutoOrder(slip,draft,fallback);

    if(result.fallback===true&&result.reviewId){
      const reviewId=String(result.reviewId);
      setCurrentOrderId(reviewId);
      window.__ymkLastVerifiedAutoOrder=null;
      showStatus('wait','ระบบตรวจอัตโนมัติไม่พร้อมใช้งาน • ส่งสลิปให้ร้านตรวจสอบแล้ว');
      if(typeof window.ymkWatchManualSlip==='function'){
        window.ymkWatchManualSlip(reviewId);
      }
      return true;
    }

    const orderId=String(result.orderId||'').trim();
    if(!/^YMK\d{6}-\d{6}$/.test(orderId))throw new Error('ระบบไม่ได้รับเลขออเดอร์ที่ถูกต้อง กรุณาลองใหม่อีกครั้ง');

    setCurrentOrderId(orderId);
    const realOrder={
      id:orderId,
      ...draft,
      paymentStatus:'ตรวจสอบสลิปแล้ว',
      shopStatus:'รอเติม',
      orderReady:true,
      slipVerified:true,
      slipVerificationMode:'auto',
      slipVerifiedAmount:Number(result.verifiedAmount)||0
    };
    window.__ymkLastVerifiedAutoOrder=realOrder;
    try{
      localStorage.setItem('ymk_order_status_'+orderId,'รอเติม');
      localStorage.setItem('ymk_auto_order_'+orderId,JSON.stringify(realOrder));
    }catch(e){}

    showStatus('ok','✓ ส่งออเดอร์เข้าระบบแล้ว • เลขออเดอร์ '+orderId);
    return true;
  }catch(e){
    console.error('auto order failed',e);
    window.__ymkLastVerifiedAutoOrder=null;
    showStatus('bad','ส่งออเดอร์ไม่สำเร็จ: '+(e?.message||'ไม่ทราบสาเหตุ'));
    return false;
  }
};

})();
