(function(){
  function bind(){
    const btn=document.getElementById('addProduct');
    if(!btn||btn.dataset.ymkAddFixed)return false;
    btn.dataset.ymkAddFixed='1';
    btn.addEventListener('click',async e=>{
      e.preventDefault();
      e.stopImmediatePropagation();
      if(typeof db==='undefined'||!db||typeof auth==='undefined'||!auth?.currentUser){alert('กรุณาเข้าสู่ระบบร้านก่อนค่ะ');return;}
      const active=typeof window.YMK_ADMIN_GET_ACTIVE_CATEGORY==='function'?window.YMK_ADMIN_GET_ACTIVE_CATEGORY():'all';
      const category=active&&active!=='all'?active:'skins';
      const categoryLabel=typeof window.YMK_ADMIN_GET_CATEGORY_LABEL==='function'?window.YMK_ADMIN_GET_CATEGORY_LABEL(category):category;
      const old=btn.textContent;
      btn.disabled=true;
      btn.textContent='กำลังเพิ่ม...';
      try{
        const ref=await db.collection('products').add({
          name:'สินค้าใหม่',price:0,description:'พร้อมเติมทันที',category,categoryLabel,
          status:'out',stock:0,unlimitedStock:false,visible:true,order:Date.now(),
          image:'',imagePosition:'center',createdAt:firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt:firebase.firestore.FieldValue.serverTimestamp(),inventoryVersion:2
        });
        setTimeout(()=>{
          const card=document.querySelector('.productEdit[data-id="'+ref.id+'"]');
          if(card){card.scrollIntoView({behavior:'smooth',block:'center'});card.querySelector('.p-name')?.focus();}
        },350);
      }catch(err){alert('เพิ่มสินค้าไม่สำเร็จ: '+err.message);}
      finally{btn.disabled=false;btn.textContent=old;}
    },true);
    return true;
  }
  if(!bind()){
    let n=0;const t=setInterval(()=>{n++;if(bind()||n>40)clearInterval(t);},250);
  }
})();