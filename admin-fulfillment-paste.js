(function(){
  'use strict';
  const MAX_IMAGES=30;
  const MAX_SOURCE_BYTES=5*1024*1024;
  const TOTAL_DATA_BUDGET=820000;

  const style=document.createElement('style');
  style.textContent=`
    .ymk-fulfillment-paste{border:1px solid #efc8d7;border-radius:11px;padding:9px 12px;font-weight:800;cursor:pointer;background:#fff0f6;color:#92566e}
    .ymk-fulfillment-paste-zone{margin-top:8px;padding:10px 12px;border:1px dashed #e8aec6;border-radius:11px;color:#9a687c;background:#fffafd;font-size:11px;line-height:1.5;outline:none}
    .ymk-fulfillment-paste-zone:focus{border-style:solid;box-shadow:0 0 0 2px rgba(232,137,173,.12)}
  `;
  document.head.appendChild(style);

  function dataUrlToFile(dataUrl,name){
    const p=String(dataUrl||'').split(','),m=(p[0]||'').match(/data:([^;]+);base64/);if(!m)return null;
    try{const bin=atob(p[1]||''),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);return new File([u8],name||'saved-slip.jpg',{type:m[1]||'image/jpeg'});}catch(e){return null;}
  }

  function compressImage(file,targetBytes){
    return new Promise((resolve,reject)=>{
      if(!file||!String(file.type||'').startsWith('image/'))return reject(new Error('คลิปบอร์ดไม่มีรูปภาพ'));
      if(file.size>MAX_SOURCE_BYTES)return reject(new Error('รูปมีขนาดเกิน 5MB'));
      const r=new FileReader(),img=new Image();
      r.onerror=()=>reject(new Error('อ่านรูปไม่สำเร็จ'));
      img.onerror=()=>reject(new Error('เปิดรูปไม่สำเร็จ'));
      r.onload=()=>img.src=String(r.result||'');
      img.onload=()=>{try{
        const maxSide=1100,scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
        const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
        const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
        let q=.74,data=c.toDataURL('image/jpeg',q);while(data.length>targetBytes&&q>.18){q-=.06;data=c.toDataURL('image/jpeg',q);}if(data.length>targetBytes)throw new Error('รูปมีขนาดใหญ่เกินไป');resolve(data);
      }catch(e){reject(e)}};
      r.readAsDataURL(file);
    });
  }

  async function currentImages(orderId){
    if(!db)return [];
    const s=await db.collection('order_status').doc(orderId).get();if(!s.exists)return [];
    const d=s.data()||{};if(Array.isArray(d.fulfillmentSlipDataList))return d.fulfillmentSlipDataList.filter(x=>typeof x==='string'&&x.startsWith('data:image/')).slice(0,MAX_IMAGES);
    return d.fulfillmentSlipData?[d.fulfillmentSlipData]:[];
  }

  async function savePasted(card,newFiles,btn){
    const select=card.querySelector('.shopStatus');
    if(!select||select.value!=='สำเร็จ'){alert('กรุณาเปลี่ยนสถานะออเดอร์เป็น “สำเร็จ” ก่อนแนบสลิปเติมเกมค่ะ');return;}
    if(!db||!auth?.currentUser){alert('กรุณาเข้าสู่ระบบร้านก่อนค่ะ');return;}
    const pasted=[...(newFiles||[])].filter(f=>String(f.type||'').startsWith('image/'));if(!pasted.length){alert('ไม่พบรูปภาพในคลิปบอร์ดค่ะ');return;}
    const oldText=btn?btn.textContent:'';if(btn){btn.disabled=true;btn.textContent='กำลังวางรูป…';}
    try{
      const saved=await currentImages(card.dataset.id);
      const oldFiles=saved.map((x,i)=>dataUrlToFile(x,'saved-'+(i+1)+'.jpg')).filter(Boolean);
      const all=[...oldFiles,...pasted].slice(0,MAX_IMAGES);
      if(oldFiles.length+pasted.length>MAX_IMAGES)alert('ระบบเก็บได้สูงสุด 30 รูป จึงรับเฉพาะรูปที่ยังมีพื้นที่ค่ะ');
      const target=Math.max(22000,Math.min(110000,Math.floor(TOTAL_DATA_BUDGET/Math.max(1,all.length))));
      const images=[];for(let i=0;i<all.length;i++){if(btn)btn.textContent=`กำลังบันทึก ${i+1}/${all.length}…`;images.push(await compressImage(all[i],target));}
      await db.collection('order_status').doc(card.dataset.id).set({
        fulfillmentSlipAttached:true,fulfillmentSlipCount:images.length,fulfillmentSlipDataList:images,
        fulfillmentSlipFileNames:images.map((_,i)=>'topup-slip-'+(i+1)+'.jpg'),
        fulfillmentSlipData:firebase.firestore.FieldValue.delete(),fulfillmentSlipFileName:firebase.firestore.FieldValue.delete(),
        fulfillmentSlipUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()
      },{merge:true});
      try{await db.collection('orders').doc(card.dataset.id).set({fulfillmentSlipAttached:true,fulfillmentSlipCount:images.length},{merge:true});}catch(e){}
      const panel=card.querySelector('.ymk-fulfillment-slip');if(panel){panel.dataset.loaded='';const preview=panel.querySelector('.ymk-fulfillment-slip-preview');if(preview){preview.innerHTML='';images.forEach((src,i)=>{const img=document.createElement('img');img.src=src;img.alt='สลิปเติมเกม '+(i+1);preview.appendChild(img);});preview.classList.toggle('show',images.length>0);}const note=panel.querySelector('.ymk-fulfillment-slip-note');if(note)note.textContent=`แนบสลิปเติมเกมแล้ว ${images.length} รูป ✓`;}
    }catch(e){alert('วางรูปไม่สำเร็จ: '+(e?.message||e));}
    finally{if(btn){btn.disabled=false;btn.textContent=oldText;}}
  }

  async function readClipboardImages(){
    if(!navigator.clipboard||!navigator.clipboard.read)throw new Error('เบราว์เซอร์นี้ไม่รองรับปุ่มอ่านคลิปบอร์ด ให้คลิกช่องแล้วกด Ctrl+V แทนค่ะ');
    const items=await navigator.clipboard.read(),files=[];
    for(const item of items){for(const type of item.types||[]){if(type.startsWith('image/')){const blob=await item.getType(type);files.push(new File([blob],'clipboard-'+Date.now()+'.png',{type}));break;}}}
    return files;
  }

  function enhance(){
    document.querySelectorAll('#orders .card').forEach(card=>{
      const panel=card.querySelector('.ymk-fulfillment-slip');if(!panel||panel.dataset.pasteEnhanced)return;panel.dataset.pasteEnhanced='1';
      const actions=panel.querySelector('.ymk-fulfillment-slip-actions');if(!actions)return;
      const btn=document.createElement('button');btn.type='button';btn.className='ymk-fulfillment-paste';btn.textContent='วางรูปจากคลิปบอร์ด';
      actions.insertBefore(btn,actions.children[1]||null);
      const zone=document.createElement('div');zone.className='ymk-fulfillment-paste-zone';zone.tabIndex=0;zone.textContent='คัดลอกรูปมาแล้ว คลิกตรงนี้แล้วกด Ctrl+V ได้เลย • รูปที่วางจะเพิ่มต่อจากรูปเดิม';panel.appendChild(zone);
      btn.onclick=async()=>{try{const files=await readClipboardImages();await savePasted(card,files,btn);}catch(e){alert(e?.message||e);}};
      zone.addEventListener('paste',async e=>{const files=[];for(const item of [...(e.clipboardData?.items||[])]){if(item.kind==='file'&&String(item.type||'').startsWith('image/')){const f=item.getAsFile();if(f)files.push(f);}}if(!files.length)return;e.preventDefault();await savePasted(card,files,btn);});
    });
  }

  const root=document.getElementById('orders');if(root)new MutationObserver(enhance).observe(root,{childList:true,subtree:true});
  setInterval(enhance,500);enhance();
})();