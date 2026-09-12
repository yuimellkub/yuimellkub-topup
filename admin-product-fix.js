(function(){
  function saveProduct(e){
    const btn=e.target.closest?.('.p-save');
    if(!btn)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if(!db||!auth?.currentUser){alert('กรุณาเข้าสู่ระบบร้านก่อนค่ะ');return;}
    const c=btn.closest('.productEdit');
    if(!c)return;
    const id=c.dataset.id;
    const unlimited=!!c.querySelector('.p-unlimited')?.checked;
    const text=btn.textContent;
    btn.disabled=true;
    btn.textContent='กำลังบันทึก...';
    db.collection('products').doc(id).set({
      name:c.querySelector('.p-name').value.trim(),
      price:Number(c.querySelector('.p-price').value||0),
      order:Number(c.querySelector('.p-order').value||0),
      category:c.querySelector('.p-category').value,
      status:c.querySelector('.p-status').value,
      stock:unlimited?null:Math.max(0,Number(c.querySelector('.p-stock').value||0)),
      unlimitedStock:unlimited,
      inventoryVersion:2,
      description:c.querySelector('.p-description').value.trim(),
      imagePosition:c.querySelector('.p-position').value,
      visible:c.querySelector('.p-visible').checked,
      updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    },{merge:true}).then(()=>{
      btn.textContent='บันทึกแล้ว ✓';
      setTimeout(()=>{btn.disabled=false;btn.textContent=text;},700);
    }).catch(err=>{
      btn.disabled=false;btn.textContent=text;alert('บันทึกไม่สำเร็จ: '+err.message);
    });
  }

  async function repair(){
    if(!db||!auth?.currentUser)return;
    const snap=await db.collection('products').get();
    const base=new Set(['echoes-66','echoes-203','echoes-335','echoes-759','echoes-2227','echoes-3663','echoes-7249']);
    const batch=db.batch();let n=0;
    snap.docs.forEach(doc=>{
      const p=doc.data()||{};
      if(base.has(doc.id) && (p.inventoryVersion!==2 || (p.stock===0 && p.unlimitedStock===false && p.status==='out'))){
        batch.set(doc.ref,{status:'ready',stock:null,unlimitedStock:true,inventoryVersion:2,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});n++;
      } else if(p.inventoryVersion!==2 && p.stock==null && p.unlimitedStock==null){
        batch.set(doc.ref,{stock:null,unlimitedStock:true,inventoryVersion:2,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});n++;
      }
    });
    if(n)await batch.commit();
  }

  document.addEventListener('click',saveProduct,true);
  let count=0;
  const t=setInterval(()=>{
    count++;
    if(typeof db!=='undefined'&&db&&typeof auth!=='undefined'&&auth?.currentUser){clearInterval(t);repair().catch(console.warn);}
    if(count>40)clearInterval(t);
  },250);
})();