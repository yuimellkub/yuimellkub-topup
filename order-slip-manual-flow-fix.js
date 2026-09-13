(function(){
  'use strict';

  const SETTINGS_ID='ymk_store_settings';
  const MAX_SOURCE_BYTES=5*1024*1024;
  const MAX_DATA_URL_BYTES=520000;
  let patched=false;
  let statusUnsub=null;
  let pendingId='';

  function getDb(){
    try{
      if(!window.firebase||!window.YUIMELLKUB_FIREBASE_CONFIG)return null;
      if(!firebase.apps.length)firebase.initializeApp(window.YUIMELLKUB_FIREBASE_CONFIG);
      return firebase.firestore();
    }catch(e){return null;}
  }

  function statusEl(){return document.getElementById('adminSaveStatus');}

  function stopStatusWatch(){
    if(statusUnsub){try{statusUnsub();}catch(e){}statusUnsub=null;}
    pendingId='';
  }

  function rewritePendingText(){
    const root=document.body;if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
    while((n=walker.nextNode())){
      if(!n.nodeValue)continue;
      n.nodeValue=n.nodeValue
        .replace('✓ ส่งออเดอร์เรียบร้อยแล้ว ♡','✓ ส่งสลิปเรียบร้อยแล้ว • รอร้านตรวจสอบ ♡')
        .replace('ส่งออเดอร์เรียบร้อยแล้ว ♡','ส่งสลิปเรียบร้อยแล้ว • รอร้านตรวจสอบ ♡')
        .replace('เลขออเดอร์ของคุณ','เลขอ้างอิงสลิปของคุณ');
    }
  }

  function rewriteApprovedText(){
    const root=document.body;if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
    while((n=walker.nextNode())){
      if(!n.nodeValue)continue;
      n.nodeValue=n.nodeValue
        .replace('✓ ส่งสลิปเรียบร้อยแล้ว • รอร้านตรวจสอบ ♡','✓ ยืนยันสลิปแล้ว • สร้างออเดอร์เรียบร้อยแล้ว ♡')
        .replace('ส่งสลิปเรียบร้อยแล้ว • รอร้านตรวจสอบ ♡','ยืนยันสลิปแล้ว • สร้างออเดอร์เรียบร้อยแล้ว ♡')
        .replace('เลขอ้างอิงสลิปของคุณ','เลขออเดอร์ของคุณ');
    }
  }

  function showResult(kind,message){
    const st=statusEl();
    if(st){
      st.style.display='block';
      st.className=kind==='ok'?'verify-status ok':'verify-status';
      st.textContent=message;
    }
    let box=document.getElementById('ymkManualReviewResult');
    const anchor=st?.parentElement||document.querySelector('.slip-section')||document.body;
    if(!box){
      box=document.createElement('div');box.id='ymkManualReviewResult';
      box.style.cssText='margin-top:10px;padding:12px 14px;border-radius:12px;text-align:center;font-size:13px;font-weight:800;line-height:1.6';
      if(st&&st.nextSibling)st.parentNode.insertBefore(box,st.nextSibling);else anchor.appendChild(box);
    }
    if(kind==='bad'){
      box.style.background='#fff0f4';box.style.border='1px solid #efb6c5';box.style.color='#a24761';
    }else if(kind==='ok'){
      box.style.background='#eefaf2';box.style.border='1px solid #b9e2c7';box.style.color='#3f7f58';
    }else{
      box.style.background='#fff8ed';box.style.border='1px solid #efd7a8';box.style.color='#8b682e';
    }
    box.textContent=message;
  }

  function startStatusWatch(id){
    const db=getDb();if(!db||!id)return;
    stopStatusWatch();
    pendingId=id;
    rewritePendingText();
    showResult('wait','กำลังรอร้านตรวจสอบสลิป • ยังไม่สร้างออเดอร์จนกว่าร้านจะยืนยัน');
    try{
      statusUnsub=db.collection('order_status').doc(id).onSnapshot(snap=>{
        if(id!==pendingId)return;
        if(!snap.exists){rewritePendingText();showResult('wait','กำลังรอร้านตรวจสอบสลิป • ยังไม่สร้างออเดอร์จนกว่าร้านจะยืนยัน');return;}
        const d=snap.data()||{};
        const status=String(d.status||'');
        if(status==='สลิปไม่ผ่าน'||d.paymentStatus==='สลิปไม่ผ่าน'){
          rewritePendingText();
          showResult('bad',d.slipReviewMessage||'ตรวจสอบสลิปไม่สำเร็จ กรุณาแนบสลิปที่ถูกต้องแล้วส่งใหม่อีกครั้ง');
          const btn=[...document.querySelectorAll('button')].find(x=>/ส่งสลิปให้ร้านตรวจสอบ|ส่งออเดอร์ให้ร้านตรวจสอบ/.test(x.textContent||''));
          if(btn)btn.disabled=false;
          return;
        }
        if(status==='รอเติม'&&d.orderReady===true&&d.paymentStatus==='ชำระแล้ว'){
          rewriteApprovedText();
          showResult('ok','✓ ร้านยืนยันสลิปแล้ว • ออเดอร์ถูกสร้างและอยู่ในสถานะรอเติม');
          try{localStorage.setItem('ymk_order_status_'+id,'รอเติม')}catch(e){}
        }
      },e=>console.warn('manual slip status watch failed',e));
    }catch(e){console.warn(e);}
  }

  function compressSlip(file){
    return new Promise((resolve,reject)=>{
      if(!file)return reject(new Error('กรุณาแนบสลิปก่อนส่ง'));
      if(!String(file.type||'').startsWith('image/'))return reject(new Error('กรุณาแนบสลิปเป็นรูปภาพ'));
      if(file.size>MAX_SOURCE_BYTES)return reject(new Error('สลิปมีขนาดเกิน 5MB กรุณาใช้รูปที่เล็กลง'));
      const reader=new FileReader(),img=new Image();
      reader.onerror=()=>reject(new Error('อ่านรูปสลิปไม่สำเร็จ'));
      img.onerror=()=>reject(new Error('เปิดรูปสลิปไม่สำเร็จ'));
      reader.onload=()=>img.src=String(reader.result||'');
      img.onload=()=>{
        try{
          const maxSide=1400,scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
          const width=Math.max(1,Math.round(img.naturalWidth*scale)),height=Math.max(1,Math.round(img.naturalHeight*scale));
          const c=document.createElement('canvas');c.width=width;c.height=height;
          const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(img,0,0,width,height);
          let q=.78,data=c.toDataURL('image/jpeg',q);
          while(data.length>MAX_DATA_URL_BYTES&&q>.42){q-=.08;data=c.toDataURL('image/jpeg',q);}
          if(data.length>MAX_DATA_URL_BYTES)throw new Error('รูปสลิปมีขนาดใหญ่เกินไป กรุณาครอปหรือใช้ภาพที่เล็กลง');
          resolve({data,width,height,bytes:data.length});
        }catch(e){reject(e)}
      };
      reader.readAsDataURL(file);
    });
  }

  async function isManualMode(db){
    try{const s=await db.collection('products').doc(SETTINGS_ID).get();return s.exists&&s.data()?.slipVerificationMode==='manual';}
    catch(e){return false;}
  }

  function install(){
    if(patched)return;
    if(typeof window.saveOrderToDemoAdmin!=='function')return setTimeout(install,120);
    patched=true;
    const original=window.saveOrderToDemoAdmin;
    window.saveOrderToDemoAdmin=async function(){
      const db=getDb();
      if(!db)return original.apply(this,arguments);
      const manual=await isManualMode(db);
      if(!manual)return original.apply(this,arguments);

      stopStatusWatch();
      const oldBox=document.getElementById('ymkManualReviewResult');if(oldBox)oldBox.remove();
      const slip=document.getElementById('slipFile')?.files?.[0]||null;
      const st=statusEl();if(st){st.style.display='block';st.className='verify-status';st.textContent='กำลังส่งสลิปให้ร้านตรวจสอบ…';}
      try{
        if(!slip)throw new Error('กรุณาแนบสลิปก่อนส่ง');
        const compressed=await compressSlip(slip);
        const id=(window.makeOrderId?.()||('YMK'+Date.now()+'-'+Math.random().toString(36).slice(2,7).toUpperCase()));
        window.currentOrderId=id;
        const order={
          id,
          createdAt:new Date().toISOString(),
          item:window.lastOrder?.item||'',pack:window.lastOrder?.pack||'',price:window.lastOrder?.price||'',
          paymentMethod:typeof window.getPaymentMethod==='function'?window.getPaymentMethod():'',
          uid:(document.getElementById('orderUid')?.value||'').trim(),
          server:document.getElementById('orderServer')?.value||'Asia',
          name:(document.getElementById('orderName')?.value||'').trim(),
          paymentStatus:'รอร้านตรวจสอบการชำระเงิน',shopStatus:'รอเติม',orderReady:false,
          slipVerified:false,slipVerificationMode:'manual',slipAttached:true,
          slipFileName:slip.name||'slip.jpg',slipPath:'order_slips/'+id
        };
        const batch=db.batch();
        batch.set(db.collection('orders').doc(id),{...order,createdAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
        batch.set(db.collection('order_slips').doc(id),{
          orderId:id,imageData:compressed.data,mimeType:'image/jpeg',width:compressed.width,height:compressed.height,bytes:compressed.bytes,
          verified:false,verifiedAmount:null,transRef:'',verificationMode:'manual',createdAt:firebase.firestore.FieldValue.serverTimestamp()
        });
        await batch.commit();
        if(st){st.className='verify-status ok';st.textContent='✓ ส่งสลิปแล้ว • รอร้านยืนยันก่อนสร้างออเดอร์: '+id;}
        setTimeout(()=>startStatusWatch(id),80);
        setTimeout(rewritePendingText,160);
        setTimeout(rewritePendingText,500);
        return true;
      }catch(e){
        console.error(e);
        if(st){st.className='verify-status';st.textContent='ส่งสลิปไม่สำเร็จ: '+(e?.message||'ไม่ทราบสาเหตุ');}
        return false;
      }
    };
  }

  window.ymkWatchManualSlip=startStatusWatch;
  install();
})();
