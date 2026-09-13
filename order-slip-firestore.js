(function(){
  'use strict';

  const MAX_SOURCE_BYTES=5*1024*1024;
  const MAX_DATA_URL_BYTES=520000;
  const EASYSLIP_WORKER_URL='https://yuimellkub-slip.yuimellkubtopup.workers.dev/';
  const MAX_SLIP_AGE_MS=30*60*1000;
  const FUTURE_TOLERANCE_MS=5*60*1000;
  const SETTINGS_ID='ymk_store_settings';
  const OLD_SLIP_COPY='ร้านจะตรวจสอบการชำระเงินภายหลัง ไม่มีการยืนยันว่าเงินเข้าอัตโนมัติ';
  const AUTO_SLIP_COPY='ระบบจะตรวจสอบสลิปอัตโนมัติก่อนส่งออเดอร์';
  const MANUAL_SLIP_COPY='ร้านจะตรวจสอบสลิปและการชำระเงินให้ภายหลัง';
  let currentSlipMode='auto';
  let modeUnsub=null;

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
      if(currentSlipMode==='manual'&&node.nodeValue.trim()==='ตรวจสลิปและส่งออเดอร์')node.nodeValue='ส่งออเดอร์ให้ร้านตรวจสอบ';
      if(currentSlipMode==='auto'&&node.nodeValue.trim()==='ส่งออเดอร์ให้ร้านตรวจสอบ')node.nodeValue='ตรวจสลิปและส่งออเดอร์';
    }
  }

  function setSlipMode(mode){
    currentSlipMode=mode==='manual'?'manual':'auto';
    updateSlipCopy();
  }

  function startModeListener(){
    try{
      if(!firebaseReady())return setTimeout(startModeListener,500);
      const {db}=getFirebaseServices();
      if(!db)return setTimeout(startModeListener,500);
      if(modeUnsub)modeUnsub();
      modeUnsub=db.collection('products').doc(SETTINGS_ID).onSnapshot(snap=>{
        setSlipMode(snap.exists&&snap.data()?.slipVerificationMode==='manual'?'manual':'auto');
      },()=>setSlipMode('auto'));
    }catch(e){
      setTimeout(startModeListener,800);
    }
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

  function parseMoney(value){
    const n=Number(String(value??'').replace(/[^0-9.-]/g,''));
    return Number.isFinite(n)?n:0;
  }

  function systemUnavailable(message,code='SYSTEM_UNAVAILABLE'){
    const e=new Error(message||'ระบบตรวจสลิปอัตโนมัติไม่พร้อมใช้งาน');
    e.slipSystemUnavailable=true;
    e.slipSystemCode=code;
    return e;
  }

  function isSystemFailure(response,result){
    const code=String(result?.error?.code||'').toUpperCase();
    if(response?.status===429||response?.status>=500)return true;
    if(response?.status===401)return true;
    if(response?.status===403)return true;
    return ['QUOTA_EXCEEDED','RATE_LIMIT_EXCEEDED','API_SERVER_ERROR','BRANCH_INACTIVE','SERVICE_BANNED','USER_BANNED','IP_NOT_ALLOWED','INVALID_API_KEY','MISSING_API_KEY'].includes(code);
  }

  async function getSlipMode(db){
    try{
      const snap=await db.collection('products').doc(SETTINGS_ID).get();
      const mode=snap.exists?snap.data()?.slipVerificationMode:'auto';
      setSlipMode(mode==='manual'?'manual':'auto');
    }catch(e){
      console.warn('read slip mode failed, using auto',e);
      setSlipMode('auto');
    }
    return currentSlipMode;
  }

  async function verifySlip(file,expectedAmount){
    if(!file) return null;
    if(!String(file.type||'').startsWith('image/'))throw new Error('กรุณาแนบสลิปเป็นรูปภาพ');
    if(file.size>MAX_SOURCE_BYTES)throw new Error('สลิปมีขนาดเกิน 5MB กรุณาใช้รูปที่เล็กลง');

    const form=new FormData();
    form.append('image',file,file.name||'slip.jpg');

    let response;
    try{
      response=await fetch(EASYSLIP_WORKER_URL,{method:'POST',body:form});
    }catch(error){
      throw systemUnavailable('เชื่อมระบบตรวจสลิปไม่ได้ ออเดอร์จะให้ร้านตรวจสอบแทน','NETWORK_ERROR');
    }

    let result=null;
    try{result=await response.json()}catch(error){}

    if(!response.ok||!result?.success){
      const message=result?.error?.message||result?.message||'ตรวจสอบสลิปไม่ผ่าน';
      const code=result?.error?.code||('HTTP_'+response.status);
      if(isSystemFailure(response,result))throw systemUnavailable(message,code);
      throw new Error(message);
    }

    const data=result.data||{};
    if(data.isDuplicate){
      throw new Error('สลิปนี้ถูกใช้ไปแล้ว กรุณาใช้สลิปใหม่');
    }

    const slipDate=data.rawSlip?.date||'';
    const slipTime=Date.parse(slipDate);
    if(!slipDate||Number.isNaN(slipTime)){
      throw new Error('ไม่พบวันและเวลาของรายการในสลิป กรุณาใช้สลิปใหม่');
    }

    const slipAge=Date.now()-slipTime;
    if(slipAge>MAX_SLIP_AGE_MS){
      throw new Error('สลิปนี้เก่าเกิน 30 นาที กรุณาใช้สลิปจากการชำระเงินครั้งล่าสุด');
    }
    if(slipAge< -FUTURE_TOLERANCE_MS){
      throw new Error('วันหรือเวลาในสลิปไม่ถูกต้อง กรุณาตรวจสอบเวลาในอุปกรณ์แล้วลองใหม่');
    }

    const amount=Number(data.amountInSlip??data.rawSlip?.amount?.amount);
    const expected=parseMoney(expectedAmount);
    if(expected>0&&Number.isFinite(amount)&&Math.abs(amount-expected)>0.01){
      throw new Error('ยอดในสลิปไม่ตรงกับยอดออเดอร์ (สลิป '+amount.toFixed(2)+' บาท / ออเดอร์ '+expected.toFixed(2)+' บาท)');
    }

    return {
      verified:true,
      amount:Number.isFinite(amount)?amount:null,
      transRef:data.rawSlip?.transRef||'',
      slipDate,
      isDuplicate:false
    };
  }

  function compressSlip(file){
    return new Promise((resolve,reject)=>{
      if(!file)return resolve({data:'',width:0,height:0,bytes:0});
      if(!String(file.type||'').startsWith('image/'))return reject(new Error('กรุณาแนบสลิปเป็นรูปภาพ'));
      if(file.size>MAX_SOURCE_BYTES)return reject(new Error('สลิปมีขนาดเกิน 5MB กรุณาใช้รูปที่เล็กลง'));

      const reader=new FileReader();
      const image=new Image();
      reader.onerror=()=>reject(new Error('อ่านรูปสลิปไม่สำเร็จ'));
      image.onerror=()=>reject(new Error('เปิดรูปสลิปไม่สำเร็จ'));
      reader.onload=()=>{ image.src=String(reader.result||''); };
      image.onload=()=>{
        try{
          const maxSide=1400;
          const scale=Math.min(1,maxSide/Math.max(image.naturalWidth,image.naturalHeight));
          const width=Math.max(1,Math.round(image.naturalWidth*scale));
          const height=Math.max(1,Math.round(image.naturalHeight*scale));
          const canvas=document.createElement('canvas');
          canvas.width=width;canvas.height=height;
          const ctx=canvas.getContext('2d',{alpha:false});
          ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
          ctx.drawImage(image,0,0,width,height);

          let quality=.78;
          let data=canvas.toDataURL('image/jpeg',quality);
          while(data.length>MAX_DATA_URL_BYTES&&quality>.42){
            quality-=.08;
            data=canvas.toDataURL('image/jpeg',quality);
          }
          if(data.length>MAX_DATA_URL_BYTES)throw new Error('รูปสลิปยังมีขนาดใหญ่เกินไป กรุณาครอปหรือใช้ภาพที่เล็กลง');
          resolve({data,width,height,bytes:data.length});
        }catch(error){reject(error)}
      };
      reader.readAsDataURL(file);
    });
  }

  saveOrderToDemoAdmin=async function(){
    const uid=(document.getElementById('orderUid')?.value||'').trim();
    const server=document.getElementById('orderServer')?.value||'Asia';
    const name=(document.getElementById('orderName')?.value||'').trim();
    const slip=document.getElementById('slipFile')?.files?.[0]||null;
    const order={
      id:currentOrderId||makeOrderId(),createdAt:new Date().toISOString(),
      item:lastOrder?.item||'',pack:lastOrder?.pack||'',price:lastOrder?.price||'',
      paymentMethod:getPaymentMethod(),uid,server,name,
      paymentStatus:'รอตรวจสอบการชำระเงิน',shopStatus:'รอเติม'
    };
    currentOrderId=order.id;
    const st=document.getElementById('adminSaveStatus');
    st.style.display='block';st.className='verify-status';

    if(firebaseReady()){
      try{
        const {db}=getFirebaseServices();
        const selectedMode=await getSlipMode(db);
        let verification=null;
        let manualReason='';

        if(slip&&selectedMode==='auto'){
          st.textContent='กำลังตรวจสอบสลิปอัตโนมัติ…';
          try{
            verification=await verifySlip(slip,order.price);
            order.paymentStatus='ตรวจสอบสลิปแล้ว';
            order.slipVerified=true;
            order.slipVerifiedAmount=verification.amount;
            order.slipTransRef=verification.transRef;
            order.slipTransactionDate=verification.slipDate;
            order.slipVerificationMode='auto';
          }catch(e){
            if(!e?.slipSystemUnavailable)throw e;
            manualReason=e.slipSystemCode||'SYSTEM_UNAVAILABLE';
            order.paymentStatus='รอร้านตรวจสอบการชำระเงิน';
            order.slipVerified=false;
            order.slipVerificationMode='manual-fallback';
            order.slipFallbackReason=manualReason;
            st.textContent='ระบบตรวจสลิปอัตโนมัติไม่พร้อมใช้งาน • จะส่งออเดอร์ให้ร้านตรวจสอบแทน…';
          }
        }else if(slip){
          order.paymentStatus='รอร้านตรวจสอบการชำระเงิน';
          order.slipVerified=false;
          order.slipVerificationMode='manual';
          st.textContent='โหมดร้านตรวจเอง • กำลังส่งสลิปและออเดอร์เข้าหลังบ้าน…';
        }

        if(!manualReason)st.textContent=verification?'ตรวจสลิปผ่านแล้ว กำลังบันทึกรูปและส่งออเดอร์…':(slip?'กำลังบันทึกรูปและส่งออเดอร์…':'กำลังส่งออเดอร์เข้าระบบออนไลน์…');
        const compressed=await compressSlip(slip);
        const batch=db.batch();
        const orderRef=db.collection('orders').doc(order.id);
        batch.set(orderRef,{...order,slipAttached:!!compressed.data,slipFileName:slip?(slip.name||'slip.jpg'):'',slipPath:compressed.data?'order_slips/'+order.id:'',createdAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
        if(compressed.data){
          const slipRef=db.collection('order_slips').doc(order.id);
          batch.set(slipRef,{orderId:order.id,imageData:compressed.data,mimeType:'image/jpeg',width:compressed.width,height:compressed.height,bytes:compressed.bytes,verified:!!verification,verifiedAmount:verification?.amount??null,transRef:verification?.transRef||'',verificationMode:order.slipVerificationMode||selectedMode,fallbackReason:manualReason,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
        }
        await batch.commit();
        try{
          await db.collection('order_status').doc(order.id).set({
            status:order.shopStatus,
            updatedAt:firebase.firestore.FieldValue.serverTimestamp()
          },{merge:true});
        }catch(e){
          console.warn('public status create skipped',e);
        }
        try{localStorage.setItem('ymk_order_status_'+order.id,order.shopStatus)}catch(e){}
        st.className='verify-status ok';
        st.textContent=verification
          ? '✓ ตรวจสลิปผ่านและส่งออเดอร์แล้ว: '+order.id
          : slip
            ? '✓ ส่งออเดอร์แล้ว • รอร้านตรวจสอบสลิป: '+order.id
            : '✓ ส่งออเดอร์แล้ว: '+order.id;
        return true;
      }catch(e){
        console.error(e);st.className='verify-status';
        st.textContent='ส่งออเดอร์ไม่สำเร็จ: '+(e?.message||'ไม่ทราบสาเหตุ');
        return false;
      }
    }

    st.className='verify-status';
    st.textContent='ยังเชื่อม Firebase ไม่ได้ จึงยังบันทึกรูปสลิปไม่ได้';
    return false;
  };
})();
