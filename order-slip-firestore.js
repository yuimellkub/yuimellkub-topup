(function(){
  'use strict';

  const MAX_SOURCE_BYTES=5*1024*1024;
  const MAX_DATA_URL_BYTES=520000;

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
        st.textContent=slip?'กำลังย่อและบันทึกรูปสลิป…':'กำลังส่งออเดอร์เข้าระบบออนไลน์…';
        const {db}=getFirebaseServices();
        const compressed=await compressSlip(slip);
        const batch=db.batch();
        const orderRef=db.collection('orders').doc(order.id);
        batch.set(orderRef,{...order,slipAttached:!!compressed.data,slipFileName:slip?(slip.name||'slip.jpg'):'',slipPath:compressed.data?'order_slips/'+order.id:'',createdAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
        if(compressed.data){
          const slipRef=db.collection('order_slips').doc(order.id);
          batch.set(slipRef,{orderId:order.id,imageData:compressed.data,mimeType:'image/jpeg',width:compressed.width,height:compressed.height,bytes:compressed.bytes,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
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
        st.textContent='✓ ส่งออเดอร์และบันทึกรูปสลิปเข้าระบบแล้ว: '+order.id;
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
