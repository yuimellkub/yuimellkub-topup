(function(){
  'use strict';
  const style=document.createElement('style');
  style.textContent='.slipTools{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.slipViewer{display:none;margin-top:10px;padding:10px;background:#fff7fa;border:1px solid #f2ccdc;border-radius:14px}.slipViewer.show{display:block}.slipViewer img{display:block;max-width:440px;width:100%;max-height:600px;object-fit:contain;margin:auto;border-radius:10px}.slipNotice{font-size:12px;color:#8f5d71;margin-top:8px}.manualSlipCheck{margin-top:10px;padding:12px;border:1px solid #f2ccdc;border-radius:14px;background:#fff8fb}.manualSlipCheckTitle{font-size:12px;font-weight:900;color:#8f4f68;margin-bottom:8px}.manualSlipCheckActions{display:flex;gap:8px;flex-wrap:wrap}.manualSlipCheckActions button{border-radius:11px;padding:9px 12px;font-weight:850;cursor:pointer}.manualSlipApprove{border:1px solid #9bd4b3;background:#eaf9f0;color:#367651}.manualSlipReject{border:1px solid #efb6c5;background:#fff0f4;color:#a24761}.manualSlipCheckNote{font-size:11px;color:#9a687c;line-height:1.5;margin-top:8px}';
  document.head.appendChild(style);

  async function saveManualDecision(card,approved){
    if(!db||!auth?.currentUser)throw new Error('กรุณาเข้าสู่ระบบร้านก่อน');
    const id=card.dataset.id;
    const status=approved?'รอเติม':'มีปัญหา';
    const paymentStatus=approved?'ชำระแล้ว':'สลิปไม่ผ่าน';
    const batch=db.batch();
    batch.set(db.collection('orders').doc(id),{
      paymentStatus,
      shopStatus:status,
      manualSlipChecked:true,
      manualSlipApproved:approved,
      manualSlipCheckedAt:firebase.firestore.FieldValue.serverTimestamp()
    },{merge:true});
    batch.set(db.collection('order_status').doc(id),{
      status,
      paymentStatus,
      manualSlipChecked:true,
      manualSlipApproved:approved,
      updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    },{merge:true});
    await batch.commit();
    try{localStorage.setItem('ymk_order_status_'+id,status)}catch(e){}
    const sel=card.querySelector('.shopStatus');if(sel)sel.value=status;
    const pill=card.querySelector('.pill');if(pill)pill.textContent=paymentStatus;
  }

  function enhance(){
    document.querySelectorAll('#orders .card').forEach(card=>{
      if(card.dataset.slipEnhanced)return;
      card.dataset.slipEnhanced='1';
      const slip=card.querySelector('.slip');
      if(!slip||!slip.textContent.includes('แนบสลิป'))return;
      slip.textContent='✓ ลูกค้าแนบสลิปไว้ในระบบแล้ว';
      slip.classList.remove('none');
      const tools=document.createElement('div');
      tools.className='slipTools';
      tools.innerHTML='<button type="button" class="btn soft viewSlip">ดูสลิป</button><button type="button" class="btn soft downloadSlip">ดาวน์โหลด</button><button type="button" class="btn danger deleteSlip">ลบเฉพาะสลิป</button>';
      const viewer=document.createElement('div');viewer.className='slipViewer';
      const manual=document.createElement('div');manual.className='manualSlipCheck';
      manual.innerHTML='<div class="manualSlipCheckTitle">ตรวจสอบการชำระเงินโดยร้าน</div><div class="manualSlipCheckActions"><button type="button" class="manualSlipApprove">✓ ยืนยันการชำระเงิน</button><button type="button" class="manualSlipReject">✕ สลิปไม่ผ่าน</button></div><div class="manualSlipCheckNote">ตรวจยอด วันเวลา และรายการเงินจริงของร้านก่อนกดยืนยันค่ะ</div>';
      slip.after(tools,viewer,manual);

      async function getSlip(){
        if(!db||!auth?.currentUser)throw new Error('กรุณาเข้าสู่ระบบร้านก่อน');
        const snap=await db.collection('order_slips').doc(card.dataset.id).get();
        if(!snap.exists||!snap.data()?.imageData)throw new Error('ไม่พบรูปสลิปของออเดอร์นี้');
        return snap.data().imageData;
      }
      tools.querySelector('.viewSlip').onclick=async e=>{
        const btn=e.currentTarget;btn.disabled=true;btn.textContent='กำลังโหลด…';
        try{const data=await getSlip();viewer.innerHTML='<img alt="รูปสลิปลูกค้า">';viewer.querySelector('img').src=data;viewer.classList.toggle('show');btn.textContent=viewer.classList.contains('show')?'ซ่อนสลิป':'ดูสลิป'}
        catch(error){alert(error.message);btn.textContent='ดูสลิป'}finally{btn.disabled=false}
      };
      tools.querySelector('.downloadSlip').onclick=async()=>{
        try{const data=await getSlip();const a=document.createElement('a');a.href=data;a.download='slip-'+card.dataset.id+'.jpg';a.click()}catch(error){alert(error.message)}
      };
      tools.querySelector('.deleteSlip').onclick=async()=>{
        if(!confirm('ลบเฉพาะรูปสลิปของออเดอร์นี้ใช่ไหมคะ? ข้อมูลออเดอร์จะยังอยู่'))return;
        try{
          const batch=db.batch();
          batch.delete(db.collection('order_slips').doc(card.dataset.id));
          batch.update(db.collection('orders').doc(card.dataset.id),{slipAttached:false,slipPath:'',slipFileName:''});
          await batch.commit();viewer.remove();tools.remove();manual.remove();slip.textContent='ลบรูปสลิปแล้ว • ข้อมูลออเดอร์ยังอยู่';slip.classList.add('none');
        }catch(error){alert('ลบสลิปไม่สำเร็จ: '+error.message)}
      };
      manual.querySelector('.manualSlipApprove').onclick=async e=>{
        if(!confirm('ตรวจสอบแล้วว่าเงินเข้าจริงและยอดถูกต้อง ใช่ไหมคะ?'))return;
        const btn=e.currentTarget,old=btn.textContent;btn.disabled=true;btn.textContent='กำลังยืนยัน…';
        try{await saveManualDecision(card,true);manual.querySelector('.manualSlipCheckNote').textContent='✓ ร้านยืนยันการชำระเงินแล้ว — ออเดอร์เปลี่ยนเป็นรอเติม';}
        catch(error){alert('ยืนยันการชำระเงินไม่สำเร็จ: '+error.message)}finally{btn.disabled=false;btn.textContent=old}
      };
      manual.querySelector('.manualSlipReject').onclick=async e=>{
        if(!confirm('ยืนยันว่าไม่ผ่านการตรวจสอบสลิปใช่ไหมคะ?'))return;
        const btn=e.currentTarget,old=btn.textContent;btn.disabled=true;btn.textContent='กำลังบันทึก…';
        try{await saveManualDecision(card,false);manual.querySelector('.manualSlipCheckNote').textContent='✕ ร้านระบุว่าสลิปไม่ผ่าน — ออเดอร์เปลี่ยนเป็นมีปัญหา';}
        catch(error){alert('บันทึกผลไม่สำเร็จ: '+error.message)}finally{btn.disabled=false;btn.textContent=old}
      };
    });
  }
  const root=document.getElementById('orders');if(root)new MutationObserver(enhance).observe(root,{childList:true,subtree:true});
  enhance();
})();
