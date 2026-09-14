(function(){
  'use strict';

  const style=document.createElement('style');
  style.textContent=`
    .ymk-order-select{display:inline-flex;align-items:center;gap:7px;margin:0 0 10px;font-size:12px;font-weight:800;color:#8f5d71;user-select:none}
    .ymk-order-select input{width:18px;height:18px;accent-color:#e889ad}
    #ymkBulkDelete,#ymkSelectAll{border:1px solid #efc8d7;border-radius:12px;padding:10px 14px;font-weight:800;cursor:pointer;background:#fff0f6;color:#92566e}
    #ymkBulkDelete{background:#fff;color:#a65367}
    #ymkBulkDelete:disabled{opacity:.5;cursor:not-allowed}
  `;
  document.head.appendChild(style);

  function number(v){return Number(String(v||'').replace(/,/g,''))||0;}

  function packTotal(text){
    const raw=String(text||'').trim();
    if(!raw)return 0;
    let total=0,found=false;
    raw.split('+').forEach(part=>{
      const p=part.trim();
      let m=p.match(/([\d,]+)\s*[×xX*]\s*([\d,]+)/);
      if(m){total+=number(m[1])*number(m[2]);found=true;return;}
      m=p.match(/^([\d,]+)$/);
      if(m){total+=number(m[1]);found=true;}
    });
    return found?total:0;
  }

  function rowValue(card,label){
    const row=[...card.querySelectorAll('.row')].find(r=>{
      const b=r.querySelector('b');return b&&String(b.textContent||'').trim()===label;
    });
    if(!row)return {row:null,value:''};
    const clone=row.cloneNode(true),b=clone.querySelector('b');if(b)b.remove();
    return {row,value:String(clone.textContent||'').trim()};
  }

  function fixActualPackItem(card){
    const item=rowValue(card,'รายการ'),pack=rowValue(card,'แพ็ก');
    if(!item.row||!pack.row)return;
    if(!/กระดุม/.test(item.value))return;
    const total=packTotal(pack.value);if(!total)return;
    const desired=number((item.value.match(/[\d,]+/)||[])[0]);
    const display=total.toLocaleString('en-US')+' กระดุม';
    if(item.row.dataset.ymkPackTotal===display)return;
    item.row.dataset.ymkPackTotal=display;
    item.row.innerHTML='<b>รายการ</b>'+display;
    if(desired&&desired!==total)item.row.title='ลูกค้าระบุ '+desired.toLocaleString('en-US')+' กระดุม • ระบบใช้แพ็กจริงรวม '+total.toLocaleString('en-US')+' กระดุม';
  }

  function selectedIds(){
    return [...document.querySelectorAll('#orders .ymk-order-check:checked')]
      .map(x=>x.closest('.card')?.dataset.id||'').filter(Boolean);
  }

  function updateBulkButton(){
    const btn=document.getElementById('ymkBulkDelete');if(!btn)return;
    const n=selectedIds().length;btn.disabled=n===0;btn.textContent=n?'ลบที่เลือก ('+n+')':'ลบที่เลือก';
  }

  function enhanceCards(){
    document.querySelectorAll('#orders .card').forEach(card=>{
      fixActualPackItem(card);
      if(card.querySelector('.ymk-order-check'))return;
      const top=card.querySelector('.cardTop');if(!top)return;
      const label=document.createElement('label');label.className='ymk-order-select';
      label.innerHTML='<input type="checkbox" class="ymk-order-check"> เลือกออเดอร์นี้';
      top.before(label);
      label.querySelector('input').addEventListener('change',updateBulkButton);
    });
    updateBulkButton();
  }

  function installToolbar(){
    if(document.getElementById('ymkBulkDelete'))return;
    const clear=document.getElementById('clearAll');if(!clear)return;
    const all=document.createElement('button');all.type='button';all.id='ymkSelectAll';all.textContent='เลือกทั้งหมด';
    const del=document.createElement('button');del.type='button';del.id='ymkBulkDelete';del.textContent='ลบที่เลือก';del.disabled=true;
    clear.parentNode.insertBefore(all,clear);
    clear.parentNode.insertBefore(del,clear);

    all.addEventListener('click',()=>{
      const checks=[...document.querySelectorAll('#orders .ymk-order-check')];
      const shouldCheck=checks.some(x=>!x.checked);
      checks.forEach(x=>x.checked=shouldCheck);
      all.textContent=shouldCheck?'ยกเลิกเลือกทั้งหมด':'เลือกทั้งหมด';
      updateBulkButton();
    });

    del.addEventListener('click',async()=>{
      const ids=selectedIds();if(!ids.length)return;
      if(!confirm('ต้องการลบออเดอร์ที่เลือก '+ids.length+' รายการใช่ไหมคะ?\nการลบนี้ย้อนกลับไม่ได้'))return;
      const old=del.textContent;del.disabled=true;del.textContent='กำลังลบ...';
      try{
        if(online&&db&&auth?.currentUser){
          for(let i=0;i<ids.length;i+=120){
            const batch=db.batch();
            ids.slice(i,i+120).forEach(id=>{
              batch.delete(db.collection('orders').doc(id));
              batch.delete(db.collection('order_status').doc(id));
              batch.delete(db.collection('order_slips').doc(id));
            });
            await batch.commit();
          }
        }else{
          const key=(typeof KEY==='string'&&KEY)?KEY:'yuimellkub_admin_orders_v1';
          const arr=JSON.parse(localStorage.getItem(key)||'[]');
          localStorage.setItem(key,JSON.stringify(arr.filter(o=>!ids.includes(String(o.id||'')))));
          if(typeof load==='function')load();
        }
        alert('ลบออเดอร์ที่เลือกเรียบร้อยแล้วค่ะ ♡');
      }catch(e){alert('ลบออเดอร์ไม่สำเร็จ: '+(e?.message||e));}
      finally{del.textContent=old;updateBulkButton();}
    });
  }

  const root=document.getElementById('orders');
  if(root)new MutationObserver(enhanceCards).observe(root,{childList:true,subtree:true});
  installToolbar();enhanceCards();
})();
