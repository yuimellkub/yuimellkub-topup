(function(){
  const drafts=new Map();
  let savingId='';

  function readDraft(c){
    if(!c)return null;
    return {
      name:c.querySelector('.p-name')?.value??'',
      price:c.querySelector('.p-price')?.value??'',
      order:c.querySelector('.p-order')?.value??'',
      category:c.querySelector('.p-category')?.value??'echoes',
      status:c.querySelector('.p-status')?.value??'ready',
      stock:c.querySelector('.p-stock')?.value??'',
      unlimited:!!c.querySelector('.p-unlimited')?.checked,
      description:c.querySelector('.p-description')?.value??'',
      position:c.querySelector('.p-position')?.value??'center',
      visible:!!c.querySelector('.p-visible')?.checked
    };
  }

  function restoreDraft(c,d){
    if(!c||!d)return;
    const set=(s,v)=>{const el=c.querySelector(s);if(el)el.value=v;};
    set('.p-name',d.name);set('.p-price',d.price);set('.p-order',d.order);
    const cat=c.querySelector('.p-category');
    if(cat&&[...cat.options].some(o=>o.value===d.category)){cat.value=d.category;cat.dataset.ymkDirty='1';}
    set('.p-status',d.status);set('.p-stock',d.stock);set('.p-description',d.description);set('.p-position',d.position);
    const un=c.querySelector('.p-unlimited');if(un){un.checked=d.unlimited;const st=c.querySelector('.p-stock');if(st)st.disabled=d.unlimited;}
    const vis=c.querySelector('.p-visible');if(vis)vis.checked=d.visible;
  }

  function capture(e){
    const c=e.target?.closest?.('.productEdit');
    if(!c||!c.dataset.id)return;
    drafts.set(c.dataset.id,readDraft(c));
  }

  function restoreAll(){
    document.querySelectorAll('#productList .productEdit').forEach(c=>{
      const id=c.dataset.id;
      if(id&&drafts.has(id)&&id!==savingId)restoreDraft(c,drafts.get(id));
    });
  }

  function saveProduct(e){
    const btn=e.target.closest?.('.p-save');
    if(!btn)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(!db||!auth?.currentUser){alert('กรุณาเข้าสู่ระบบร้านก่อนค่ะ');return;}
    const c=btn.closest('.productEdit');if(!c)return;
    const id=c.dataset.id;
    const d=readDraft(c);
    const catSel=c.querySelector('.p-category');
    const category=d.category||'echoes';
    const categoryLabel=catSel?.selectedOptions?.[0]?.textContent?.trim()||category;
    const text=btn.textContent;
    savingId=id;btn.disabled=true;btn.textContent='กำลังบันทึก...';
    db.collection('products').doc(id).set({
      name:String(d.name).trim(),price:Number(d.price||0),order:Number(d.order||0),category,categoryLabel,
      status:d.status,stock:d.unlimited?null:Math.max(0,Number(d.stock||0)),unlimitedStock:d.unlimited,
      inventoryVersion:2,description:String(d.description).trim(),imagePosition:d.position,visible:d.visible,
      updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    },{merge:true}).then(()=>{
      drafts.delete(id);savingId='';
      btn.textContent='บันทึกแล้ว ✓';
      document.dispatchEvent(new CustomEvent('ymk-product-saved',{detail:{category,categoryLabel}}));
      setTimeout(()=>{const latest=document.querySelector('.productEdit[data-id="'+CSS.escape(id)+'"] .p-save');if(latest){latest.disabled=false;latest.textContent=text;}},500);
    }).catch(err=>{
      savingId='';btn.disabled=false;btn.textContent=text;alert('บันทึกไม่สำเร็จ: '+err.message);
    });
  }

  document.addEventListener('input',capture,true);
  document.addEventListener('change',capture,true);
  document.addEventListener('click',saveProduct,true);

  const startObserver=()=>{const list=document.getElementById('productList');if(!list)return;new MutationObserver(()=>setTimeout(restoreAll,0)).observe(list,{childList:true,subtree:false});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startObserver);else startObserver();
})();