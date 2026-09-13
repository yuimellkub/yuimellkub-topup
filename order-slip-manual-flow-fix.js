(function(){
  'use strict';
  const SETTINGS_ID='ymk_store_settings';
  const MAX_SOURCE_BYTES=5*1024*1024;
  const MAX_DATA_URL_BYTES=520000;
  const SUBMIT_URL='https://yuimellkub-slip.yuimellkubtopup.workers.dev/manual-slip';
  let patched=false,statusUnsub=null,pendingReviewId='';
  function getDb(){try{if(!window.firebase||!window.YUIMELLKUB_FIREBASE_CONFIG)return null;if(!firebase.apps.length)firebase.initializeApp(window.YUIMELLKUB_FIREBASE_CONFIG);return firebase.firestore();}catch(e){return null;}}
  function statusEl(){return document.getElementById('adminSaveStatus');}
  function stopWatch(){if(statusUnsub){try{statusUnsub();}catch(e){}statusUnsub=null;}pendingReviewId='';}
  function makeReviewId(){const d=new Date(),p=n=>String(n).padStart(2,'0');return 'SLIP'+String(d.getFullYear()).slice(-2)+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())+'-'+Math.random().toString(36).slice(2,5).toUpperCase();}
  function getLastOrderSafe(){try{return typeof lastOrder!=='undefined'&&lastOrder?lastOrder:{};}catch(e){return {};}}
  function getPaymentSafe(){try{return typeof getPaymentMethod==='function'?getPaymentMethod():'';}catch(e){return '';}}
  function scrubReferenceText(root){
    const walker=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT);let n;
    while((n=walker.nextNode())){
      const t=n.nodeValue||'';
      if(!t)continue;
      n.nodeValue=t
        .replace(/เลขออเดอร์:\s*(?:SLIP|YMK)[A-Z0-9-]+\s*•\s*เก็บเลขนี้ไว้สำหรับติดตามสถานะ/g,'')
        .replace(/เลขออเดอร์:\s*(?:SLIP|YMK)[A-Z0-9-]+/g,'')
        .replace(/เลขอ้างอิงสลิป/g,'')
        .replace(/เลขออเดอร์ของคุณ/g,'')
        .replace(/ยังไม่มีเลขออเดอร์\s*•\s*ร้านจะสร้างออเดอร์หลังยืนยันสลิปแล้ว/g,'')
        .replace(/ร้านได้รับสลิปในระบบแล้ว\s*ไม่ต้องส่งซ้ำค่ะ\s*♡?/g,'');
    }
  }
  function cleanPostOrderPanel(){
    document.querySelectorAll('button,a').forEach(el=>{const t=(el.textContent||'').trim();if(/^(Messenger|LINE)$/i.test(t)){const wrap=el.parentElement;if(wrap&&wrap.children.length<=2&&[...wrap.children].every(x=>/^(Messenger|LINE)$/i.test((x.textContent||'').trim())))wrap.style.display='none';else el.style.display='none';}});
    scrubReferenceText(document.body);
    document.querySelectorAll('div,p,span,strong,b,h1,h2,h3,h4,small').forEach(el=>{if(el.children.length)return;const t=(el.textContent||'').trim();if(!t)el.style.display='none';});
  }
  function addApprovedNote(orderId){
    const card=document.getElementById('ymkForceCard');if(!card)return;
    const candidates=[...card.querySelectorAll('div,p,strong,b,h1,h2,h3,h4')].filter(el=>(el.textContent||'').includes('ร้านยืนยันสลิปแล้ว')).sort((a,b)=>(a.textContent||'').length-(b.textContent||'').length);
    const heading=candidates[0];if(!heading)return;
    let panel=heading;
    while(panel.parentElement&&panel.parentElement!==card&&(panel.parentElement.textContent||'').includes('ร้านยืนยันสลิปแล้ว'))panel=panel.parentElement;
    let note=card.querySelector('#ymkApprovedOrderNote');
    if(note&&note.parentElement!==panel){note.remove();note=null;}
    if(!note){note=document.createElement('div');note.id='ymkApprovedOrderNote';note.style.cssText='display:block!important;margin-top:8px;text-align:center;font-size:13px;line-height:1.7;color:#9a526d;font-weight:700';panel.appendChild(note);}
    note.innerHTML='<div style="display:block!important;font-size:12px;font-weight:600;margin-bottom:2px">เลขออเดอร์</div><button type="button" id="ymkApprovedOrderId" style="display:inline-block!important;border:0;background:transparent;padding:0;color:#9a526d;font:inherit;font-size:16px;font-weight:800;cursor:pointer">'+String(orderId||'')+'</button><div style="display:block!important;font-size:12px;font-weight:600;margin-top:5px">ออเดอร์เข้าสู่ระบบแล้ว • กรุณารอดำเนินการเติมเกม ♡</div>';
    const btn=note.querySelector('#ymkApprovedOrderId');if(btn&&!btn.dataset.copyBound){btn.dataset.copyBound='1';btn.addEventListener('click',async()=>{const id=String(orderId||'');if(!id)return;try{await navigator.clipboard.writeText(id);}catch(e){const ta=document.createElement('textarea');ta.value=id;ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}const old=btn.textContent;btn.textContent='คัดลอกแล้ว ✓';setTimeout(()=>btn.textContent=old,900);});}
  }
  function rewritePending(reviewId){const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){if(!n.nodeValue)continue;n.nodeValue=n.nodeValue.replace('✓ ส่งออเดอร์เรียบร้อยแล้ว ♡','✓ ส่งสลิปเรียบร้อยแล้ว • รอร้านตรวจสอบ ♡').replace('ส่งออเดอร์เรียบร้อยแล้ว ♡','ส่งสลิปเรียบร้อยแล้ว • รอร้านตรวจสอบ ♡').replace('กรุณาบันทึกเลขออเดอร์นี้ไว้สำหรับติดตามสถานะ','').replace('รบกวนส่งสลิปในแชท Messenger อีกครั้งด้วยนะคะ ♡','');}cleanPostOrderPanel();if(reviewId)document.querySelectorAll('button,a').forEach(el=>{if(/คัดลอกเลขออเดอร์/.test(el.textContent||''))el.style.display='none';});}
  function rewriteApproved(reviewId,orderId){window.currentOrderId=orderId;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){if(!n.nodeValue)continue;n.nodeValue=n.nodeValue.replace('✓ ส่งสลิปเรียบร้อยแล้ว • รอร้านตรวจสอบ ♡','✓ ร้านยืนยันสลิปแล้ว ♡').replace('✓ ยืนยันสลิปแล้ว • สร้างออเดอร์เรียบร้อยแล้ว ♡','✓ ร้านยืนยันสลิปแล้ว ♡').replace(reviewId,orderId);}cleanPostOrderPanel();addApprovedNote(orderId);[50,150,400,900,1600].forEach(ms=>setTimeout(()=>{cleanPostOrderPanel();addApprovedNote(orderId);},ms));}
  function show(kind,msg){const st=statusEl();if(!st)return;st.style.display='block';st.className=kind==='ok'?'verify-status ok':'verify-status';st.textContent=msg;}
  function watchReview(reviewId){const db=getDb();if(!db)return;stopWatch();pendingReviewId=reviewId;rewritePending(reviewId);show('wait','กำลังรอร้านตรวจสอบสลิป • ยังไม่มีการสร้างออเดอร์');statusUnsub=db.collection('order_status').doc(reviewId).onSnapshot(snap=>{if(reviewId!==pendingReviewId||!snap.exists)return;const d=snap.data()||{};if(d.status==='สลิปไม่ผ่าน'||d.paymentStatus==='สลิปไม่ผ่าน'){rewritePending(reviewId);show('bad',d.slipReviewMessage||'ตรวจสอบสลิปไม่สำเร็จ กรุณาแนบสลิปที่ถูกต้องแล้วส่งใหม่อีกครั้ง');document.querySelectorAll('button').forEach(b=>{if(/ส่งสลิปให้ร้านตรวจสอบ|ส่งออเดอร์ให้ร้านตรวจสอบ/.test(b.textContent||''))b.disabled=false;});return;}if(d.status==='ยืนยันแล้ว'&&d.paymentStatus==='ชำระแล้ว'&&d.approvedOrderId){rewriteApproved(reviewId,String(d.approvedOrderId));show('ok','✓ ร้านยืนยันสลิปแล้ว • เลขออเดอร์ '+d.approvedOrderId);try{localStorage.setItem('ymk_order_status_'+d.approvedOrderId,'รอเติม')}catch(e){}}},e=>console.warn('manual review watch failed',e));}
  function compressSlip(file){return new Promise((resolve,reject)=>{if(!file)return reject(new Error('กรุณาแนบสลิปก่อนส่ง'));if(!String(file.type||'').startsWith('image/'))return reject(new Error('กรุณาแนบสลิปเป็นรูปภาพ'));if(file.size>MAX_SOURCE_BYTES)return reject(new Error('สลิปมีขนาดเกิน 5MB กรุณาใช้รูปที่เล็กลง'));const r=new FileReader(),img=new Image();r.onerror=()=>reject(new Error('อ่านรูปสลิปไม่สำเร็จ'));img.onerror=()=>reject(new Error('เปิดรูปสลิปไม่สำเร็จ'));r.onload=()=>img.src=String(r.result||'');img.onload=()=>{try{const s=Math.min(1,1400/Math.max(img.naturalWidth,img.naturalHeight)),width=Math.max(1,Math.round(img.naturalWidth*s)),height=Math.max(1,Math.round(img.naturalHeight*s)),c=document.createElement('canvas');c.width=width;c.height=height;const x=c.getContext('2d',{alpha:false});x.fillStyle='#fff';x.fillRect(0,0,width,height);x.drawImage(img,0,0,width,height);let q=.78,data=c.toDataURL('image/jpeg',q);while(data.length>MAX_DATA_URL_BYTES&&q>.42){q-=.08;data=c.toDataURL('image/jpeg',q);}if(data.length>MAX_DATA_URL_BYTES)throw new Error('รูปสลิปมีขนาดใหญ่เกินไป กรุณาครอปหรือใช้ภาพที่เล็กลง');resolve({data,width,height,bytes:data.length});}catch(e){reject(e)}};r.readAsDataURL(file);});}
  async function isManual(db){try{const s=await db.collection('products').doc(SETTINGS_ID).get();return s.exists&&s.data()?.slipVerificationMode==='manual';}catch(e){return false;}}
  async function submitReview(payload){const r=await fetch(SUBMIT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});let data={};try{data=await r.json();}catch(e){}if(!r.ok||!data.ok){const code=data.error||('HTTP_'+r.status);throw new Error(code==='IMAGE_TOO_LARGE'?'รูปสลิปมีขนาดใหญ่เกินไป กรุณาใช้ภาพที่เล็กลง':code==='INVALID_IMAGE'?'รูปสลิปไม่ถูกต้อง กรุณาเลือกภาพใหม่':code==='REVIEW_ID_EXISTS'?'ระบบสร้างเลขอ้างอิงซ้ำ กรุณากดส่งอีกครั้ง':'ระบบส่งสลิปขัดข้อง กรุณาลองใหม่อีกครั้ง');}return data;}
  function install(){if(patched)return;if(typeof window.saveOrderToDemoAdmin!=='function')return setTimeout(install,120);patched=true;const original=window.saveOrderToDemoAdmin;window.saveOrderToDemoAdmin=async function(){const db=getDb();if(!db)return original.apply(this,arguments);if(!(await isManual(db)))return original.apply(this,arguments);stopWatch();const slip=document.getElementById('slipFile')?.files?.[0]||null;show('wait','กำลังส่งสลิปให้ร้านตรวจสอบ…');try{const compressed=await compressSlip(slip),reviewId=makeReviewId();window.currentOrderId=reviewId;const order=getLastOrderSafe();const draft={item:order.item||'',pack:order.pack||'',price:order.price||'',paymentMethod:getPaymentSafe(),uid:(document.getElementById('orderUid')?.value||'').trim(),server:document.getElementById('orderServer')?.value||'Asia',name:(document.getElementById('orderName')?.value||'').trim()};if(!draft.item||!draft.pack)console.warn('manual review order detail missing',draft);await submitReview({reviewId,...draft,imageData:compressed.data,width:compressed.width,height:compressed.height,bytes:compressed.bytes});show('ok','✓ ส่งสลิปแล้ว • รอร้านตรวจสอบ');setTimeout(()=>watchReview(reviewId),60);setTimeout(()=>rewritePending(reviewId),150);setTimeout(()=>rewritePending(reviewId),500);return true;}catch(e){console.error(e);show('bad','ส่งสลิปไม่สำเร็จ: '+(e?.message||'ไม่ทราบสาเหตุ'));return false;}};}
  window.ymkWatchManualSlip=watchReview;install();
})();