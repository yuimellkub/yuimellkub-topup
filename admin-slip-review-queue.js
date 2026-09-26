(function(){
  'use strict';
  let unsub=null,seen=new Set(),initial=true;
  const style=document.createElement('style');
  style.textContent='.reviewQueueWrap{margin:16px 0}.reviewQueueTitle{font-weight:900;color:#8f4f68;margin-bottom:10px}.reviewQueueGrid{display:grid;gap:12px}.reviewCard{background:#fffafc;border:1px solid #efc8d7;border-radius:16px;padding:14px}.reviewCardTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.reviewRef{font-weight:900;color:#8f4f68}.reviewPrice{font-weight:900;color:#d96f9a}.reviewRows{display:grid;grid-template-columns:1fr 1fr;gap:7px 14px;margin-top:10px;font-size:12px}.reviewRows b{display:block;font-size:11px;color:#8f5d71}.reviewActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.reviewSlip{display:none;margin-top:10px}.reviewSlip.show{display:block}.reviewSlip img{max-width:440px;width:100%;max-height:600px;object-fit:contain;border-radius:12px;border:1px solid #f2ccdc}.reviewNote{font-size:11px;color:#9a687c;margin-top:8px}.reviewEmpty{font-size:12px;color:#aa7c8e;padding:12px;border:1px dashed #efc8d7;border-radius:12px;text-align:center}@media(max-width:620px){.reviewRows{grid-template-columns:1fr}}';
  document.head.appendChild(style);
  function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function pad(n){return String(n).padStart(2,'0');}
  function baseOrderId(){const d=new Date();return 'YMK'+String(d.getFullYear()).slice(-2)+pad(d.getMonth()+1)+pad(d.getDate())+'-'+pad(d.getHours())+pad(d.getMinutes())+pad(d.getSeconds());}
  async function uniqueOrderId(){let id=baseOrderId();const s=await db.collection('orders').doc(id).get();if(!s.exists)return id;return id+'-'+Math.random().toString(36).slice(2,4).toUpperCase();}
  function ensureRoot(){let root=document.getElementById('ymkSlipReviewQueue');if(root)return root;const orders=document.getElementById('orders');if(!orders)return null;root=document.createElement('section');root.id='ymkSlipReviewQueue';root.className='reviewQueueWrap';root.innerHTML='<div class="reviewQueueTitle">♡ สลิปรอร้านตรวจสอบ</div><div class="reviewQueueGrid"></div>';orders.parentNode.insertBefore(root,orders);return root;}
  function notifyPending(d,id){try{if(!('Notification'in window)||Notification.permission!=='granted')return;const n=new Notification('Yuimellkub • มีสลิปรอตรวจสอบ 🔔',{body:(d.item||'รายการใหม่')+(d.price?' • '+d.price:'')+'\n'+id,tag:'review-'+id});n.onclick=()=>{window.focus();n.close();};}catch(e){}}

  async function sendApprovedOrderDiscord(orderId,data){
    try{
      const url='https://discordapp.com/api/webhooks/1553342049728602144/inLrGUzgyKrMFEi2WaohxdJYl65H6ITbmTvs8_yxl1d5rW9aRXth0Lb9-_ehLe5_LW2h';
      const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'Yuimellkub Orders',allowed_mentions:{parse:[]},embeds:[{title:'🎀 มีออเดอร์ใหม่',description:'ชำระแล้ว • รอเติม',fields:[{name:'เลขออเดอร์',value:String(orderId||'-'),inline:false},{name:'รายการ',value:String(data.item||'-'),inline:true},{name:'แพ็ก',value:String(data.pack||'-'),inline:true},{name:'ยอด',value:String(data.price||'-'),inline:true},{name:'UID',value:String(data.uid||'-'),inline:true},{name:'Server',value:String(data.server||'Asia'),inline:true}],timestamp:new Date().toISOString()}]})});
      if(!r.ok)throw new Error('Discord '+r.status);
      return true;
    }catch(e){console.warn('Discord approved order notice failed',e);return false;}
  }

  async function sendApprovedOrderEmail(orderId,data){
    const c=window.YUIMELLKUB_EMAILJS||{};
    if(!(c.publicKey&&c.serviceId&&c.templateId)){console.warn('EmailJS config is incomplete in admin');return false;}
    try{
      const orderRef=db.collection('orders').doc(orderId);
      let order={};
      try{
        const snap=await orderRef.get();
        if(snap.exists)order=snap.data()||{};
      }catch(e){console.warn('approved order email read skipped',e);}
      /* The order has just been committed by approve(). Do not block the email on a
         second Firestore read, which can lag/fail under client rules. */
      if(order.emailNotifiedAt)return true;
      const rawPrice=String(order.price||data.price||'').trim();
      const priceText=rawPrice.replace(/\s*บาท\s*$/,'').trim();
      const subject=`🎀 มีออเดอร์ใหม่ #${orderId} | ${priceText||'-'} บาท`;
      const payload={
        subject:subject,email_subject:subject,title:subject,
        order_id:orderId,item:order.item||data.item||'',pack:order.pack||data.pack||'',price:rawPrice,
        uid:order.uid||data.uid||'',server:order.server||data.server||'Asia',name:order.name||data.name||'-',
        payment_method:order.paymentMethod||data.paymentMethod||'',status:'ชำระแล้ว • รอเติม',
        created_at:new Date().toLocaleString('th-TH'),admin_url:'https://yuimellkub.github.io/yuimellkub-topup/admin.html'
      };
      const r=await fetch('https://api.emailjs.com/api/v1.0/email/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({service_id:c.serviceId,template_id:c.templateId,user_id:c.publicKey,template_params:payload})});
      const text=await r.text();if(!r.ok)throw new Error((text||'EmailJS error')+' ('+r.status+')');
      try{await orderRef.set({emailNotifiedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});}catch(e){console.warn('email notified marker failed',e);}
      console.log('approved order email sent',orderId);return true;
    }catch(e){console.warn('approved order email failed',e);return false;}
  }

  async function approve(id,data){
    const orderId=await uniqueOrderId(),now=firebase.firestore.FieldValue.serverTimestamp(),batch=db.batch();
    batch.set(db.collection('orders').doc(orderId),{id:orderId,item:data.item||'',pack:data.pack||'',price:data.price||'',paymentMethod:data.paymentMethod||'',uid:data.uid||'',server:data.server||'Asia',name:data.name||'',paymentStatus:'ชำระแล้ว',shopStatus:'รอเติม',orderReady:true,slipAttached:true,slipVerified:false,slipVerificationMode:'manual-approved',sourceReviewId:id,createdAt:now},{merge:true});
    batch.set(db.collection('order_slips').doc(orderId),{orderId,imageData:data.imageData||'',mimeType:data.mimeType||'image/jpeg',width:data.width||0,height:data.height||0,bytes:data.bytes||0,verified:false,verificationMode:'manual-approved',reviewPending:false,sourceReviewId:id,createdAt:now});
    batch.set(db.collection('order_status').doc(orderId),{status:'รอเติม',paymentStatus:'ชำระแล้ว',orderReady:true,updatedAt:now},{merge:true});
    batch.set(db.collection('order_status').doc(id),{status:'ยืนยันแล้ว',paymentStatus:'ชำระแล้ว',orderReady:true,approvedOrderId:orderId,updatedAt:now},{merge:true});
    batch.set(db.collection('order_slips').doc(id),{reviewPending:false,reviewDecision:'approved',approvedOrderId:orderId,reviewedAt:now},{merge:true});
    await batch.commit();
    const emailOk=await sendApprovedOrderDiscord(orderId,data);
    return {orderId,emailOk};
  }
  async function reject(id){const now=firebase.firestore.FieldValue.serverTimestamp(),batch=db.batch();batch.set(db.collection('order_status').doc(id),{status:'สลิปไม่ผ่าน',paymentStatus:'สลิปไม่ผ่าน',orderReady:false,slipReviewMessage:'ตรวจสอบสลิปไม่สำเร็จ กรุณาแนบสลิปที่ถูกต้องแล้วส่งใหม่อีกครั้ง',updatedAt:now},{merge:true});batch.set(db.collection('order_slips').doc(id),{reviewPending:false,reviewDecision:'rejected',reviewedAt:now},{merge:true});await batch.commit();}
  function render(snap){
    const root=ensureRoot();if(!root)return;const grid=root.querySelector('.reviewQueueGrid'),docs=snap.docs;
    if(!docs.length){grid.innerHTML='<div class="reviewEmpty">ไม่มีสลิปรอตรวจสอบค่ะ ♡</div>';initial=false;return;}
    grid.innerHTML=docs.map(x=>{const d=x.data()||{},id=x.id;return '<div class="reviewCard" data-review="'+esc(id)+'"><div class="reviewCardTop"><div><div class="reviewRef">รอตรวจสลิป • '+esc(id)+'</div><div class="reviewNote">ยังไม่มีเลขออเดอร์</div></div><div class="reviewPrice">'+esc(d.price||'')+'</div></div><div class="reviewRows"><div><b>รายการ</b>'+esc(d.item||'-')+'</div><div><b>แพ็ก</b>'+esc(d.pack||'-')+'</div><div><b>UID</b>'+esc(d.uid||'-')+'</div><div><b>Server</b>'+esc(d.server||'-')+'</div><div><b>ชื่อเรียก</b>'+esc(d.name||'-')+'</div><div><b>ชำระผ่าน</b>'+esc(d.paymentMethod||'-')+'</div></div><div class="reviewActions"><button class="btn soft reviewView">ดูสลิป</button><button class="btn soft reviewDownload">ดาวน์โหลด</button><button class="manualSlipApprove">✓ ยืนยันการชำระเงิน</button><button class="manualSlipReject">✕ สลิปไม่ผ่าน</button></div><div class="reviewSlip"><img alt="รูปสลิปลูกค้า"></div><div class="reviewNote">ตรวจสอบว่าเงินเข้าจริงและยอดถูกต้องก่อนกดยืนยันค่ะ</div></div>';}).join('');
    docs.forEach(x=>{
      const d=x.data()||{},id=x.id,card=grid.querySelector('[data-review="'+CSS.escape(id)+'"]');if(!card)return;
      if(!initial&&!seen.has(id))notifyPending(d,id);seen.add(id);
      const img=card.querySelector('.reviewSlip img'),box=card.querySelector('.reviewSlip');
      card.querySelector('.reviewView').onclick=()=>{if(box.classList.contains('show')){box.classList.remove('show');card.querySelector('.reviewView').textContent='ดูสลิป';return;}img.src=d.imageData||'';box.classList.add('show');card.querySelector('.reviewView').textContent='ซ่อนสลิป';};
      card.querySelector('.reviewDownload').onclick=()=>{const a=document.createElement('a');a.href=d.imageData||'';a.download='slip-'+id+'.jpg';a.click();};
      card.querySelector('.manualSlipApprove').onclick=async e=>{if(!confirm('ตรวจสอบแล้วว่าเงินเข้าจริงและยอดถูกต้อง ใช่ไหมคะ?'))return;const b=e.currentTarget;b.disabled=true;b.textContent='กำลังสร้างออเดอร์…';try{const result=await approve(id,d);alert('ยืนยันแล้วค่ะ • สร้างออเดอร์ '+result.orderId+' แล้ว'+(result.emailOk?'':'\nอีเมลแจ้งเตือนไม่สำเร็จ แต่ออเดอร์สร้างเรียบร้อยแล้ว'));}catch(err){alert('ยืนยันไม่สำเร็จ: '+err.message);b.disabled=false;b.textContent='✓ ยืนยันการชำระเงิน';}};
      card.querySelector('.manualSlipReject').onclick=async e=>{if(!confirm('ยืนยันว่าไม่ผ่านการตรวจสอบสลิปใช่ไหมคะ?'))return;const b=e.currentTarget;b.disabled=true;try{await reject(id);}catch(err){alert('บันทึกผลไม่สำเร็จ: '+err.message);b.disabled=false;}};
    });initial=false;
  }
  function start(){if(!db||!auth)return setTimeout(start,300);auth.onAuthStateChanged(user=>{if(unsub){unsub();unsub=null;}if(!user){const r=document.getElementById('ymkSlipReviewQueue');if(r)r.remove();return;}unsub=db.collection('order_slips').where('reviewPending','==',true).onSnapshot(render,e=>console.warn('review queue failed',e));});}
  start();
})();
