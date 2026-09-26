(function(){
  'use strict';
  const SETTINGS_ID='ymk_store_settings';
  const MAX_SOURCE_BYTES=5*1024*1024;
  const MAX_DATA_URL_BYTES=520000;
  const SUBMIT_URL='https://yuimellkub-slip.yuimellkubtopup.workers.dev/manual-slip';
  const ACTIVE_REVIEW_KEY='ymk_active_manual_review';
  const REVIEW_MODE_PREFIX='ymk_review_mode_';
  let patched=false,statusUnsub=null,statusPoll=null,pendingReviewId='';

  function getDb(){try{if(!window.firebase||!window.YUIMELLKUB_FIREBASE_CONFIG)return null;if(!firebase.apps.length)firebase.initializeApp(window.YUIMELLKUB_FIREBASE_CONFIG);return firebase.firestore();}catch(e){return null;}}
  function statusEl(){return document.getElementById('adminSaveStatus');}
  function rememberReview(id){try{if(id)localStorage.setItem(ACTIVE_REVIEW_KEY,String(id));else localStorage.removeItem(ACTIVE_REVIEW_KEY);}catch(e){}}
  function recalledReview(){try{return String(localStorage.getItem(ACTIVE_REVIEW_KEY)||'').trim();}catch(e){return '';}}
  function rememberReviewMode(id,mode){try{if(id)localStorage.setItem(REVIEW_MODE_PREFIX+String(id),mode==='send'?'send':'normal');}catch(e){}}
  function reviewMode(id){try{return localStorage.getItem(REVIEW_MODE_PREFIX+String(id))==='send'?'send':'normal';}catch(e){return 'normal';}}
  function clearReviewMode(id){try{localStorage.removeItem(REVIEW_MODE_PREFIX+String(id));}catch(e){}}
  function stopWatch(clearStored){if(statusUnsub){try{statusUnsub();}catch(e){}statusUnsub=null;}if(statusPoll){clearInterval(statusPoll);statusPoll=null;}pendingReviewId='';if(clearStored)rememberReview('');}
  function makeReviewId(){const d=new Date(),p=n=>String(n).padStart(2,'0');return 'SLIP'+String(d.getFullYear()).slice(-2)+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())+'-'+Math.random().toString(36).slice(2,5).toUpperCase();}
  function getLastOrderSafe(){try{return typeof lastOrder!=='undefined'&&lastOrder?lastOrder:{};}catch(e){return {};}}
  function getPaymentSafe(){try{return typeof getPaymentMethod==='function'?getPaymentMethod():'';}catch(e){return '';}}

  function copyOnlyOrderId(id,btn){const value=String(id||'').trim();if(!/^YMK\d{6}-\d{6}$/.test(value))return;const done=()=>{const old=btn.textContent;btn.textContent='คัดลอกแล้ว ✓';setTimeout(()=>btn.textContent=old,900);};try{navigator.clipboard.writeText(value).then(done).catch(()=>{const ta=document.createElement('textarea');ta.value=value;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();done();});}catch(e){const ta=document.createElement('textarea');ta.value=value;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();done();}}
  function statusCard(){return document.getElementById('ymkForceCard');}
  function resetCard(card){if(!card)return;card.style.setProperty('display','block','important');card.style.setProperty('height','auto','important');card.style.setProperty('min-height','0','important');card.style.setProperty('max-height','none','important');card.style.setProperty('overflow','visible','important');card.style.setProperty('box-sizing','border-box','important');card.style.setProperty('margin','14px 0 0','important');card.style.setProperty('padding','20px 16px','important');card.style.setProperty('border','1px solid #efc6d7','important');card.style.setProperty('border-radius','16px','important');card.style.setProperty('background','#fffafd','important');card.style.setProperty('color','#8f4f68','important');card.style.setProperty('text-align','center','important');}
  function renderPending(){const card=statusCard();if(!card)return;resetCard(card);card.dataset.ymkManualState='pending';card.innerHTML='<div style="font-size:20px;font-weight:900;line-height:1.45">✓ ส่งสลิปเรียบร้อยแล้ว ♡</div><div style="margin-top:3px;font-size:15px;font-weight:800;line-height:1.5;color:#9a526d">กำลังรอร้านตรวจสอบสลิป</div><div style="margin-top:12px;font-size:13px;font-weight:700;line-height:1.7;color:#9a687c">ร้านได้รับสลิปในระบบแล้ว ไม่ต้องส่งซ้ำนะคะ ♡</div><div style="margin-top:14px;padding:13px;border:1px solid #f0dfb0;border-radius:14px;background:#fff9e9;color:#76684a;font-size:13px;font-weight:700;line-height:1.7;text-align:left"><b>หมายเหตุ ♡</b><br>หากรอตรวจสอบเกินประมาณ <b>5–10 นาที</b> สามารถทักเพจหรือ LINE เพื่อแจ้งแอดมินตรวจสอบได้เลยนะคะ ♡</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><a href="https://m.me/yuimellkubtopup" target="_blank" rel="noopener" style="display:block;text-align:center;text-decoration:none;padding:10px 8px;border-radius:12px;background:#e27ca5;color:#fff;font-weight:900">ทักเพจ</a><a href="https://line.me/R/ti/p/@205svvxv" target="_blank" rel="noopener" style="display:block;text-align:center;text-decoration:none;padding:10px 8px;border:1px solid #e7a6bf;border-radius:12px;background:#fff;color:#c85f88;font-weight:900">ทัก LINE</a></div><div style="margin-top:12px;font-size:12px;font-weight:700;line-height:1.6;color:#9a687c">หลังตรวจสอบเรียบร้อย ระบบจะแสดงเลขออเดอร์สำหรับติดตามสถานะตามปกติ</div>';}
  function renderApproved(orderId,isSend){const id=String(orderId||'').trim(),card=statusCard();if(!card||!/^YMK\d{6}-\d{6}$/.test(id))return;resetCard(card);card.dataset.ymkManualState='approved';card.dataset.ymkOrderMode=isSend?'send':'normal';const message=isSend?'กรุณาเก็บเลขออเดอร์ไว้สำหรับติดตามสถานะนะคะ ♡':'กรุณาเก็บเลขออเดอร์ไว้สำหรับติดตามสถานะ<br>และรอร้านดำเนินการเติมสักครู่นะคะ ♡';const sendBox=isSend?'<div id="ymkSendAfterPaymentNotice" style="margin:12px 0 0;padding:13px;border:1px solid #efc6d7;border-radius:14px;background:#fff3f8;color:#8f4f68;font-size:13px;font-weight:700;line-height:1.7;text-align:left"><div style="font-size:15px;font-weight:900;text-align:center;margin-bottom:6px">📦 สำหรับออเดอร์แบบส่ง</div><div style="text-align:center">กรุณาติดต่อทางร้านเพื่อแจ้ง <b>สกิน / ไอเทมที่ต้องการให้ส่ง</b><br>พร้อมแจ้งเลขออเดอร์ให้แอดมินนะคะ ♡</div><div style="margin-top:8px"><b>หมายเหตุ:</b> แบบส่งจำเป็นต้องแอดเพื่อนภายในเกมและรอครบ <b>24 ชั่วโมง</b> ก่อนจึงจะสามารถส่งของขวัญได้ค่ะ</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px"><a href="https://m.me/yuimellkubtopup" target="_blank" rel="noopener" style="display:block;text-align:center;text-decoration:none;padding:10px 8px;border-radius:12px;background:#e27ca5;color:#fff;font-weight:900">ติดต่อเพจ</a><a href="https://line.me/R/ti/p/@205svvxv" target="_blank" rel="noopener" style="display:block;text-align:center;text-decoration:none;padding:10px 8px;border:1px solid #e7a6bf;border-radius:12px;background:#fff;color:#c85f88;font-weight:900">ติดต่อ LINE</a></div></div>':'';card.innerHTML='<div style="font-size:20px;font-weight:900;line-height:1.45">✓ ส่งออเดอร์เรียบร้อยแล้ว ♡</div><div style="margin-top:3px;font-size:14px;font-weight:700;line-height:1.5;color:#9a687c">ออเดอร์ของคุณเข้าสู่ระบบแล้ว</div><div style="margin-top:13px;font-size:15px;font-weight:900">เลขออเดอร์ของคุณ</div><div id="ymkApprovedOrderNumber" style="margin-top:5px;font-size:15px;font-weight:900;color:#8f4f68">'+id+'</div><div style="margin-top:10px;font-size:13px;font-weight:700;line-height:1.7;color:#9a687c">'+message+'</div>'+sendBox+'<button type="button" id="ymkApprovedOrderId" style="display:inline-block!important;margin-top:12px!important;border:1px solid #efbfd1!important;background:#fff3f8!important;padding:10px 17px!important;border-radius:12px!important;color:#9a526d!important;font:inherit!important;font-size:13px!important;font-weight:900!important;cursor:pointer!important">คัดลอกเลขออเดอร์</button>';const btn=card.querySelector('#ymkApprovedOrderId');if(btn)btn.addEventListener('click',()=>copyOnlyOrderId(id,btn));}
  function show(kind,msg){const st=statusEl();if(!st)return;st.style.display='block';st.className=kind==='ok'?'verify-status ok':'verify-status';st.textContent=msg;}

  function finishWatch(){if(statusUnsub){try{statusUnsub();}catch(e){}statusUnsub=null;}if(statusPoll){clearInterval(statusPoll);statusPoll=null;}}
  function applyReviewState(reviewId,d){if(String(reviewId)!==String(pendingReviewId))return;d=d||{};
    if(d.status==='สลิปไม่ผ่าน'||d.paymentStatus==='สลิปไม่ผ่าน'){renderPending();show('bad',d.slipReviewMessage||'ตรวจสอบสลิปไม่สำเร็จ กรุณาแนบสลิปที่ถูกต้องแล้วส่งใหม่อีกครั้ง');rememberReview('');clearReviewMode(reviewId);finishWatch();pendingReviewId='';document.querySelectorAll('button').forEach(b=>{if(/ส่งสลิปให้ร้านตรวจสอบ|ส่งออเดอร์ให้ร้านตรวจสอบ/.test(b.textContent||''))b.disabled=false;});return;}
    if(d.status==='ยืนยันแล้ว'&&d.paymentStatus==='ชำระแล้ว'&&d.approvedOrderId){const id=String(d.approvedOrderId),isSend=reviewMode(reviewId)==='send';window.currentOrderId=id;renderApproved(id,isSend);show('ok','✓ ส่งออเดอร์เข้าระบบแล้ว • เลขออเดอร์ '+id);rememberReview('');try{localStorage.setItem('ymk_order_status_'+id,'รอเติม')}catch(e){}clearReviewMode(reviewId);finishWatch();pendingReviewId='';return;}
    renderPending();show('wait','กำลังรอร้านตรวจสอบสลิป • ยังไม่มีการสร้างออเดอร์');
  }

  function watchReview(reviewId){const db=getDb();if(!db||!reviewId)return;stopWatch(false);pendingReviewId=String(reviewId);rememberReview(pendingReviewId);renderPending();show('wait','กำลังรอร้านตรวจสอบสลิป • ยังไม่มีการสร้างออเดอร์');const watchedId=pendingReviewId,ref=db.collection('order_status').doc(watchedId);const sync=()=>{if(watchedId!==pendingReviewId)return;ref.get().then(s=>{if(s.exists)applyReviewState(watchedId,s.data()||{});}).catch(e=>console.warn('manual review status read failed',e));};sync();statusUnsub=ref.onSnapshot(snap=>{if(watchedId!==pendingReviewId||!snap.exists)return;applyReviewState(watchedId,snap.data()||{});},e=>console.warn('manual review watch failed',e));statusPoll=setInterval(sync,500);}

  function compressSlip(file){return new Promise((resolve,reject)=>{if(!file)return reject(new Error('กรุณาแนบสลิปก่อนส่ง'));if(!String(file.type||'').startsWith('image/'))return reject(new Error('กรุณาแนบสลิปเป็นรูปภาพ'));if(file.size>MAX_SOURCE_BYTES)return reject(new Error('สลิปมีขนาดเกิน 5MB กรุณาใช้รูปที่เล็กลง'));const r=new FileReader(),img=new Image();r.onerror=()=>reject(new Error('อ่านรูปสลิปไม่สำเร็จ'));img.onerror=()=>reject(new Error('เปิดรูปสลิปไม่สำเร็จ'));r.onload=()=>img.src=String(r.result||'');img.onload=()=>{try{const s=Math.min(1,1400/Math.max(img.naturalWidth,img.naturalHeight)),width=Math.max(1,Math.round(img.naturalWidth*s)),height=Math.max(1,Math.round(img.naturalHeight*s)),c=document.createElement('canvas');c.width=width;c.height=height;const x=c.getContext('2d',{alpha:false});x.fillStyle='#fff';x.fillRect(0,0,width,height);x.drawImage(img,0,0,width,height);let q=.78,data=c.toDataURL('image/jpeg',q);while(data.length>MAX_DATA_URL_BYTES&&q>.42){q-=.08;data=c.toDataURL('image/jpeg',q);}if(data.length>MAX_DATA_URL_BYTES)throw new Error('รูปสลิปมีขนาดใหญ่เกินไป กรุณาครอปหรือใช้ภาพที่เล็กลง');resolve({data,width,height,bytes:data.length});}catch(e){reject(e)}};r.readAsDataURL(file);});}
  async function isManual(db){try{const s=await db.collection('products').doc(SETTINGS_ID).get();return s.exists&&s.data()?.slipVerificationMode==='manual';}catch(e){console.warn('manual mode check failed; using manual-safe flow',e);return true;}}
  function looksManual(){const t=document.body?.innerText||'';return /ส่งสลิปให้ร้านตรวจสอบ|ร้านจะตรวจสอบสลิปก่อน|รอร้านตรวจสอบ/.test(t);}
  async function sendDiscordNotice(kind,id,draft){
    try{
      const url='https://discordapp.com/api/webhooks/1553342049728602144/inLrGUzgyKrMFEi2WaohxdJYl65H6ITbmTvs8_yxl1d5rW9aRXth0Lb9-_ehLe5_LW2h';
      const isOrder=kind==='order';
      const title=isOrder?'🎀 มีออเดอร์ใหม่':'🔔 มีสลิปรอตรวจสอบ';
      const fields=[
        {name:isOrder?'เลขออเดอร์':'เลขอ้างอิง',value:String(id||'-'),inline:false},
        {name:'รายการ',value:String(draft.item||'-'),inline:true},
        {name:'แพ็ก',value:String(draft.pack||'-'),inline:true},
        {name:'ยอด',value:String(draft.price||'-'),inline:true},
        {name:'UID',value:String(draft.uid||'-'),inline:true},
        {name:'Server',value:String(draft.server||'Asia'),inline:true}
      ];
      const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:'<@&1552923566809419786>',allowed_mentions:{parse:[],roles:['1552923566809419786']},embeds:[{title:isOrder?'🎀 NEW ORDER • มีออเดอร์ใหม่':'🔔 SLIP REVIEW • สลิปรอตรวจสอบ',description:isOrder?'ชำระแล้ว • รอดำเนินการ ♡':'มีสลิปใหม่เข้ามา กรุณาตรวจสอบ ♡',color:isOrder?15107242:16762880,fields,timestamp:new Date().toISOString(),footer:{text:'Yuimellkub Top-up ♡'}}]})});
      if(!r.ok)throw new Error('Discord '+r.status);
      return true;
    }catch(e){console.warn('Discord order notice failed',e);return false;}
  }

  async function sendManualReviewEmail(reviewId,draft){
    try{
      const cfg=window.YUIMELLKUB_EMAILJS||{};
      if(!cfg.publicKey||!cfg.serviceId||!cfg.templateId){console.warn('manual review email skipped: EmailJS config incomplete');return false;}
      const key='ymk_manual_review_email_sent_'+reviewId;
      try{if(localStorage.getItem(key)==='1')return true;}catch(e){}
      const rawPrice=String(draft.price||'').trim();
      const priceText=rawPrice.replace(/\s*บาท\s*$/,'').trim();
      const subject=`🔔 มีสลิปรอตรวจสอบ #${reviewId} | ${priceText||'-'} บาท`;
      const payload={
        subject:subject,
        email_subject:subject,
        title:subject,
        order_id:reviewId,
        item:draft.item||'',
        pack:draft.pack||'',
        price:draft.price||'',
        uid:draft.uid||'',
        server:draft.server||'Asia',
        name:draft.name||'-',
        payment_method:draft.paymentMethod||'',
        status:'มีสลิปใหม่ • รอตรวจสอบ',
        created_at:new Date().toLocaleString('th-TH'),
        admin_url:'https://yuimellkub.github.io/yuimellkub-topup/admin.html'
      };
      const response=await fetch('https://api.emailjs.com/api/v1.0/email/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({service_id:cfg.serviceId,template_id:cfg.templateId,user_id:cfg.publicKey,template_params:payload})});
      const txt=await response.text();
      if(!response.ok)throw new Error((txt||'EmailJS error')+' ('+response.status+')');
      try{localStorage.setItem(key,'1');}catch(e){}
      console.log('manual review email sent',reviewId);
      return true;
    }catch(e){console.warn('manual review email failed',e);return false;}
  }

  async function submitReview(payload){const r=await fetch(SUBMIT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});let data={};try{data=await r.json();}catch(e){}if(!r.ok||!data.ok){const code=data.error||('HTTP_'+r.status);throw new Error(code==='IMAGE_TOO_LARGE'?'รูปสลิปมีขนาดใหญ่เกินไป กรุณาใช้รูปที่เล็กลง':code==='INVALID_IMAGE'?'รูปสลิปไม่ถูกต้อง กรุณาเลือกภาพใหม่':code==='REVIEW_ID_EXISTS'?'ระบบสร้างเลขอ้างอิงซ้ำ กรุณากดส่งอีกครั้ง':'ระบบส่งสลิปขัดข้อง กรุณาลองใหม่อีกครั้ง');}return data;}

  function install(){if(patched)return;if(typeof window.saveOrderToDemoAdmin!=='function')return setTimeout(install,120);patched=true;const original=window.saveOrderToDemoAdmin;window.saveOrderToDemoAdmin=async function(){const db=getDb();if(!db){if(looksManual()){show('bad','เชื่อมระบบตรวจสลิปชั่วคราว กรุณาลองใหม่อีกครั้ง • ยังไม่มีการสร้างออเดอร์');return false;}return original.apply(this,arguments);}if(!(await isManual(db)))return original.apply(this,arguments);stopWatch(true);const slip=document.getElementById('slipFile')?.files?.[0]||null;show('wait','กำลังเตรียมสลิป…');try{const compressed=await compressSlip(slip),reviewId=makeReviewId();window.currentOrderId=reviewId;rememberReview(reviewId);const order=getLastOrderSafe();const isSend=order.orderMode==='send'||order.pack==='แบบส่ง'||window.YMK_SEND_ORDER_META?.mode==='send'||window.YMK_SEND_SELECTION?.mode==='send';rememberReviewMode(reviewId,isSend?'send':'normal');const draft={item:order.item||'',pack:order.pack||'',price:order.price||'',orderMode:isSend?'send':'normal',paymentMethod:getPaymentSafe(),uid:(document.getElementById('orderUid')?.value||'').trim(),server:document.getElementById('orderServer')?.value||'Asia',name:(document.getElementById('orderName')?.value||'').trim()};if(!draft.item||!draft.pack)console.warn('manual review order detail missing',draft);watchReview(reviewId);show('wait','กำลังส่งสลิปให้ร้านตรวจสอบ…');try{await submitReview({reviewId,...draft,imageData:compressed.data,width:compressed.width,height:compressed.height,bytes:compressed.bytes});sendDiscordNotice('review',reviewId,draft);if(pendingReviewId===reviewId){renderPending();show('ok','✓ ส่งสลิปแล้ว • รอร้านตรวจสอบ');}return true;}catch(sendErr){console.warn('manual slip submit response failed; keeping status watcher active',sendErr);if(pendingReviewId===reviewId)show('wait','ส่งคำขอแล้ว • กำลังตรวจสอบสถานะกับระบบ…');setTimeout(()=>{if(pendingReviewId===reviewId){show('bad','ยังยืนยันการส่งสลิปไม่ได้ กรุณาลองอีกครั้ง • ระบบจะยังตรวจสถานะเดิมให้อัตโนมัติ');}},5000);return false;}}catch(e){console.error(e);stopWatch(true);show('bad','ส่งสลิปไม่สำเร็จ: '+(e?.message||'ไม่ทราบสาเหตุ'));return false;}};}

  function restoreWatch(){const id=recalledReview();if(/^SLIP\d{6}-\d{6}-[A-Z0-9]{3}$/.test(id))setTimeout(()=>watchReview(id),250);}
  window.ymkWatchManualSlip=watchReview;install();restoreWatch();
})();