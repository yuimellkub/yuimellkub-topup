(function(){
  'use strict';

  const MAX_SOURCE_BYTES=5*1024*1024;
  const MAX_DATA_URL_BYTES=480000;

  const style=document.createElement('style');
  style.textContent=`
    .ymk-fulfillment-slip{display:none;margin-top:12px;padding:12px;border:1px solid #f2ccdc;border-radius:14px;background:#fff8fb}
    .ymk-fulfillment-slip.show{display:block}
    .ymk-fulfillment-slip-title{font-size:12px;font-weight:900;color:#8f4f68;margin-bottom:8px}
    .ymk-fulfillment-slip-actions{display:flex;gap:8px;flex-wrap:wrap}
    .ymk-fulfillment-slip-actions button{border:1px solid #efc8d7;border-radius:11px;padding:9px 12px;font-weight:800;cursor:pointer;background:#fff0f6;color:#92566e}
    .ymk-fulfillment-slip-actions .primary{background:#e889ad;color:#fff;border-color:#e889ad}
    .ymk-fulfillment-slip-note{font-size:11px;line-height:1.5;color:#a16b80;margin-top:8px}
    .ymk-fulfillment-slip-preview{display:none;margin-top:10px}
    .ymk-fulfillment-slip-preview.show{display:block}
    .ymk-fulfillment-slip-preview img{display:block;max-width:360px;width:100%;max-height:520px;object-fit:contain;border:1px solid #f2ccdc;border-radius:12px;background:#fff;margin-top:8px}
  `;
  document.head.appendChild(style);

  function compressImage(file){
    return new Promise((resolve,reject)=>{
      if(!file)return reject(new Error('กรุณาเลือกรูปสลิป'));
      if(!String(file.type||'').startsWith('image/'))return reject(new Error('กรุณาเลือกรูปภาพ'));
      if(file.size>MAX_SOURCE_BYTES)return reject(new Error('รูปมีขนาดเกิน 5MB กรุณาใช้รูปที่เล็กลง'));
      const r=new FileReader(),img=new Image();
      r.onerror=()=>reject(new Error('อ่านรูปไม่สำเร็จ'));
      img.onerror=()=>reject(new Error('เปิดรูปไม่สำเร็จ'));
      r.onload=()=>{img.src=String(r.result||'');};
      img.onload=()=>{
        try{
          const maxSide=1400;
          const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
          const w=Math.max(1,Math.round(img.naturalWidth*scale));
          const h=Math.max(1,Math.round(img.naturalHeight*scale));
          const c=document.createElement('canvas');c.width=w;c.height=h;
          const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
          let q=.82,data=c.toDataURL('image/jpeg',q);
          while(data.length>MAX_DATA_URL_BYTES&&q>.42){q-=.08;data=c.toDataURL('image/jpeg',q);}
          if(data.length>MAX_DATA_URL_BYTES)throw new Error('รูปยังมีขนาดใหญ่เกินไป กรุณาครอปหรือใช้ภาพที่เล็กลง');
          resolve(data);
        }catch(e){reject(e);}
      };
      r.readAsDataURL(file);
    });
  }

  async function refreshPanel(card){
    const panel=card.querySelector('.ymk-fulfillment-slip');
    const select=card.querySelector('.shopStatus');
    if(!panel||!select)return;
    panel.classList.toggle('show',select.value==='สำเร็จ');
    if(select.value!=='สำเร็จ'||panel.dataset.loaded==='1')return;
    panel.dataset.loaded='1';
    try{
      if(!db)return;
      const snap=await db.collection('order_status').doc(card.dataset.id).get();
      const data=snap.exists?(snap.data()||{}):{};
      paintSaved(panel,data.fulfillmentSlipData||'');
    }catch(e){console.warn('load fulfillment slip failed',e);}
  }

  function paintSaved(panel,data){
    const preview=panel.querySelector('.ymk-fulfillment-slip-preview');
    const img=preview?.querySelector('img');
    const note=panel.querySelector('.ymk-fulfillment-slip-note');
    if(data){
      if(img)img.src=data;
      preview?.classList.add('show');
      if(note)note.textContent='แนบสลิปเติมเกมแล้ว ✓ ลูกค้าจะเห็นเมื่อเช็กสถานะออเดอร์สำเร็จ';
    }else{
      if(img)img.removeAttribute('src');
      preview?.classList.remove('show');
      if(note)note.textContent='เมื่อแนบแล้ว ลูกค้าจะเห็นรูปนี้ในหน้าตรวจสอบสถานะและกดบันทึกได้';
    }
  }

  function enhance(){
    document.querySelectorAll('#orders .card').forEach(card=>{
      if(card.dataset.fulfillmentSlipEnhanced)return;
      card.dataset.fulfillmentSlipEnhanced='1';
      const statusBox=card.querySelector('.statusBox');
      const select=card.querySelector('.shopStatus');
      if(!statusBox||!select)return;
      const panel=document.createElement('div');
      panel.className='ymk-fulfillment-slip';
      panel.innerHTML=`
        <div class="ymk-fulfillment-slip-title">สลิปเติมเกมสำหรับลูกค้า</div>
        <input class="ymk-fulfillment-slip-input" type="file" accept="image/*" hidden>
        <div class="ymk-fulfillment-slip-actions">
          <button type="button" class="primary ymk-fulfillment-slip-upload">แนบ / เปลี่ยนสลิปเติมเกม</button>
          <button type="button" class="ymk-fulfillment-slip-remove">ลบสลิปเติมเกม</button>
        </div>
        <div class="ymk-fulfillment-slip-note">เมื่อแนบแล้ว ลูกค้าจะเห็นรูปนี้ในหน้าตรวจสอบสถานะและกดบันทึกได้</div>
        <div class="ymk-fulfillment-slip-preview"><img alt="สลิปเติมเกม"></div>
      `;
      statusBox.after(panel);
      const input=panel.querySelector('.ymk-fulfillment-slip-input');
      panel.querySelector('.ymk-fulfillment-slip-upload').onclick=()=>{
        if(select.value!=='สำเร็จ'){alert('กรุณาเปลี่ยนสถานะออเดอร์เป็น “สำเร็จ” ก่อนแนบสลิปเติมเกมค่ะ');return;}
        input.click();
      };
      input.onchange=async()=>{
        const file=input.files?.[0];if(!file)return;
        if(!db||!auth?.currentUser){alert('กรุณาเข้าสู่ระบบร้านก่อนค่ะ');input.value='';return;}
        const btn=panel.querySelector('.ymk-fulfillment-slip-upload'),old=btn.textContent;
        btn.disabled=true;btn.textContent='กำลังแนบ…';
        try{
          const imageData=await compressImage(file);
          await db.collection('order_status').doc(card.dataset.id).set({
            fulfillmentSlipAttached:true,
            fulfillmentSlipData:imageData,
            fulfillmentSlipFileName:file.name||'topup-slip.jpg',
            fulfillmentSlipUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()
          },{merge:true});
          try{await db.collection('orders').doc(card.dataset.id).set({fulfillmentSlipAttached:true},{merge:true});}catch(e){}
          paintSaved(panel,imageData);
        }catch(e){alert('แนบสลิปเติมเกมไม่สำเร็จ: '+(e?.message||e));}
        finally{btn.disabled=false;btn.textContent=old;input.value='';}
      };
      panel.querySelector('.ymk-fulfillment-slip-remove').onclick=async()=>{
        if(!db||!auth?.currentUser){alert('กรุณาเข้าสู่ระบบร้านก่อนค่ะ');return;}
        if(!confirm('ลบสลิปเติมเกมของออเดอร์นี้ใช่ไหมคะ?'))return;
        try{
          await db.collection('order_status').doc(card.dataset.id).set({
            fulfillmentSlipAttached:false,
            fulfillmentSlipData:firebase.firestore.FieldValue.delete(),
            fulfillmentSlipFileName:firebase.firestore.FieldValue.delete(),
            fulfillmentSlipUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()
          },{merge:true});
          try{await db.collection('orders').doc(card.dataset.id).set({fulfillmentSlipAttached:false},{merge:true});}catch(e){}
          paintSaved(panel,'');
        }catch(e){alert('ลบสลิปเติมเกมไม่สำเร็จ: '+(e?.message||e));}
      };
      select.addEventListener('change',()=>{panel.dataset.loaded='';refreshPanel(card);});
      refreshPanel(card);
    });
  }

  const root=document.getElementById('orders');
  if(root)new MutationObserver(enhance).observe(root,{childList:true,subtree:true});
  enhance();
})();