(function(){
  'use strict';
  const style=document.createElement('style');
  style.textContent='.slipTools{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.slipViewer{display:none;margin-top:10px;padding:10px;background:#fff7fa;border:1px solid #f2ccdc;border-radius:14px}.slipViewer.show{display:block}.slipViewer img{display:block;max-width:440px;width:100%;max-height:600px;object-fit:contain;margin:auto;border-radius:10px}.slipNotice{font-size:12px;color:#8f5d71;margin-top:8px}';
  document.head.appendChild(style);

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
      slip.after(tools,viewer);

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
          await batch.commit();viewer.remove();tools.remove();slip.textContent='ลบรูปสลิปแล้ว • ข้อมูลออเดอร์ยังอยู่';slip.classList.add('none');
        }catch(error){alert('ลบสลิปไม่สำเร็จ: '+error.message)}
      };
    });
  }
  new MutationObserver(enhance).observe(document.getElementById('orders'),{childList:true,subtree:true});
  enhance();
})();
