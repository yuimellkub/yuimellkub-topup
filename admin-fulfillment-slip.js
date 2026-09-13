(function(){
  'use strict';

  const MAX_SOURCE_BYTES=5*1024*1024;
  const MAX_DATA_URL_BYTES=155000;
  const MAX_IMAGES=5;

  const style=document.createElement('style');
  style.textContent=`
    .ymk-fulfillment-slip{display:none;margin-top:12px;padding:12px;border:1px solid #f2ccdc;border-radius:14px;background:#fff8fb}
    .ymk-fulfillment-slip.show{display:block}
    .ymk-fulfillment-slip-title{font-size:12px;font-weight:900;color:#8f4f68;margin-bottom:8px}
    .ymk-fulfillment-slip-actions{display:flex;gap:8px;flex-wrap:wrap}
    .ymk-fulfillment-slip-actions button{border:1px solid #efc8d7;border-radius:11px;padding:9px 12px;font-weight:800;cursor:pointer;background:#fff0f6;color:#92566e}
    .ymk-fulfillment-slip-actions .primary{background:#e889ad;color:#fff;border-color:#e889ad}
    .ymk-fulfillment-slip-note{font-size:11px;line-height:1.5;color:#a16b80;margin-top:8px}
    .ymk-fulfillment-slip-preview{display:none;margin-top:10px;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px}
    .ymk-fulfillment-slip-preview.show{display:grid}
    .ymk-fulfillment-slip-preview img{display:block;width:100%;height:190px;object-fit:contain;border:1px solid #f2ccdc;border-radius:12px;background:#fff}
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
          const maxSide=1200;
          const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
          const w=Math.max(1,Math.round(img.naturalWidth*scale));
          const h=Math.max(1,Math.round(img.naturalHeight*scale));
          const c=document.createElement('canvas');c.width=w;c.height=h;
          const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
          let q=.76,data=c.toDataURL('image/jpeg',q);
          while(data.length>MAX_DATA_URL_BYTES&&q>.30){q-=.07;data=c.toDataURL('image/jpeg',q);}
          if(data.length>MAX_DATA_URL_BYTES)throw new Error('รูปยังมีขนาดใหญ่เกินไป กรุณาครอปหรือใช้ภาพที่เล็กลง');
          resolve(data);
        }catch(e){reject(e);}
      };
      r.readAsDataURL(file);
    });
  }

  function getSavedImages(data){
    if(Array.isArray(data.fulfillmentSlipDataList)&&data.fulfillmentSlipDataList.length){
      return data.fulfillmentSlipDataList.filter(x=>typeof x==='string'&&x.startsWith('data:image/')).slice(0,MAX_IMAGES);
    }
    return data.fulfillmentSlipData?[data.fulfillmentSlipData]:[];
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
      paintSaved(panel,getSavedImages(data));
    }catch(e){console.warn('load fulfillment slips failed',e);}
  }

  function paintSaved(panel,images){
    const preview=panel.querySelector('.ymk-fulfillment-slip-preview');
    const note=panel.querySelector('.ymk-fulfillment-slip-note');
    const list=Array.isArray(images)?images.filter(Boolean):[];
    if(preview){
      preview.innerHTML='';
      list.forEach((src,i)=>{const img=document.createElement('img');img.alt='สลิปเติมเกม '+(i+1);img.src=src;preview.appendChild(img);});
      preview.classList.toggle('show',list.length>0);
    }
    if(note){
      note.textContent=list.length
        ? `แนบสลิปเติมเกมแล้ว ${list.length} รูป ✓ ลูกค้าจะเห็นทั้งหมดเมื่อเช็กสถานะออเดอร์สำเร็จ`
        : `แนบได้สูงสุด ${MAX_IMAGES} รูป • ลูกค้าจะเห็นรูปทั้งหมดในหน้าตรวจสอบสถานะและกดบันทึกได้`;
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
        <input class="ymk-fulfillment-slip-input" type="file" accept="image/*" multiple hidden>
        <div class="ymk-fulfillment-slip-actions">
          <button type="button" class="primary ymk-fulfillment-slip-upload">แนบ / เปลี่ยนสลิปเติมเกม</button>
          <button type="button" class="ymk-fulfillment-slip-remove">ลบสลิปเติมเกมทั้งหมด</button>
        </div>
        <div class="ymk-fulfillment-slip-note">แนบได้สูงสุด ${MAX_IMAGES} รูป • ลูกค้าจะเห็นรูปทั้งหมดในหน้าตรวจสอบสถานะและกดบันทึกได้</div>
        <div class="ymk-fulfillment-slip-preview"></div>
      `;
      statusBox.after(panel);
      const input=panel.querySelector('.ymk-fulfillment-slip-input');
      panel.querySelector('.ymk-fulfillment-slip-upload').onclick=()=>{
        if(select.value!=='สำเร็จ'){alert('กรุณาเปลี่ยนสถานะออเดอร์เป็น “สำเร็จ” ก่อนแนบสลิปเติมเกมค่ะ');return;}
        input.click();
      };
      input.onchange=async()=>{
        const files=[...(input.files||[])];if(!files.length)return;
        if(files.length>MAX_IMAGES){alert(`แนบได้สูงสุด ${MAX_IMAGES} รูปต่อออเดอร์ค่ะ`);input.value='';return;}
        if(!db||!auth?.currentUser){alert('กรุณาเข้าสู่ระบบร้านก่อนค่ะ');input.value='';return;}
        const btn=panel.querySelector('.ymk-fulfillment-slip-upload'),old=btn.textContent;
        btn.disabled=true;btn.textContent=`กำลังแนบ 0/${files.length}…`;
        try{
          const images=[];
          for(let i=0;i<files.length;i++){
            btn.textContent=`กำลังแนบ ${i+1}/${files.length}…`;
            images.push(await compressImage(files[i]));
          }
          await db.collection('order_status').doc(card.dataset.id).set({
            fulfillmentSlipAttached:true,
            fulfillmentSlipCount:images.length,
            fulfillmentSlipDataList:images,
            fulfillmentSlipFileNames:files.map(f=>f.name||'topup-slip.jpg'),
            fulfillmentSlipData:firebase.firestore.FieldValue.delete(),
            fulfillmentSlipFileName:firebase.firestore.FieldValue.delete(),
            fulfillmentSlipUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()
          },{merge:true});
          try{await db.collection('orders').doc(card.dataset.id).set({fulfillmentSlipAttached:true,fulfillmentSlipCount:images.length},{merge:true});}catch(e){}
          paintSaved(panel,images);
        }catch(e){alert('แนบสลิปเติมเกมไม่สำเร็จ: '+(e?.message||e));}
        finally{btn.disabled=false;btn.textContent=old;input.value='';}
      };
      panel.querySelector('.ymk-fulfillment-slip-remove').onclick=async()=>{
        if(!db||!auth?.currentUser){alert('กรุณาเข้าสู่ระบบร้านก่อนค่ะ');return;}
        if(!confirm('ลบสลิปเติมเกมทั้งหมดของออเดอร์นี้ใช่ไหมคะ?'))return;
        try{
          await db.collection('order_status').doc(card.dataset.id).set({
            fulfillmentSlipAttached:false,
            fulfillmentSlipCount:0,
            fulfillmentSlipDataList:firebase.firestore.FieldValue.delete(),
            fulfillmentSlipFileNames:firebase.firestore.FieldValue.delete(),
            fulfillmentSlipData:firebase.firestore.FieldValue.delete(),
            fulfillmentSlipFileName:firebase.firestore.FieldValue.delete(),
            fulfillmentSlipUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()
          },{merge:true});
          try{await db.collection('orders').doc(card.dataset.id).set({fulfillmentSlipAttached:false,fulfillmentSlipCount:0},{merge:true});}catch(e){}
          paintSaved(panel,[]);
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