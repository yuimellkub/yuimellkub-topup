(function(){
  const BASE={all:'ทั้งหมด',echoes:'เติมกระดุม',skins:'เติมสกิน',accessories:'เติมประดับ'};
  let labels={...BASE}, custom=[], active='all', productCats={};

  function loadLocal(){
    try{
      Object.assign(labels,JSON.parse(localStorage.getItem('ymk_category_labels')||'{}'));
      const c=JSON.parse(localStorage.getItem('ymk_custom_categories')||'[]');
      custom=Array.isArray(c)?c:[];
    }catch(e){custom=[];}
    custom.forEach(x=>labels[x.id]=x.name);
  }
  function saveLocal(){
    try{
      localStorage.setItem('ymk_category_labels',JSON.stringify(labels));
      localStorage.setItem('ymk_custom_categories',JSON.stringify(custom));
    }catch(e){}
  }
  function keys(){return ['all','echoes','skins','accessories',...custom.map(x=>x.id)];}

  function patchSelects(){
    document.querySelectorAll('#productList .productEdit').forEach(card=>{
      const sel=card.querySelector('.p-category');
      if(!sel)return;
      const id=card.dataset.id||'';
      const wanted=sel.dataset.userChoice || productCats[id] || sel.value || 'echoes';
      ['echoes','skins','accessories'].forEach(k=>{
        const o=[...sel.options].find(x=>x.value===k);
        if(o)o.textContent=labels[k]||BASE[k];
      });
      custom.forEach(x=>{
        let o=[...sel.options].find(v=>v.value===x.id);
        if(!o){o=document.createElement('option');o.value=x.id;sel.appendChild(o);}
        o.textContent=labels[x.id]||x.name;
      });
      if([...sel.options].some(o=>o.value===wanted)) sel.value=wanted;
      if(!sel.dataset.categoryListener){
        sel.dataset.categoryListener='1';
        sel.addEventListener('change',()=>{
          sel.dataset.userChoice=sel.value;
          applyFilter();
        });
      }
    });
  }

  function applyFilter(){
    document.querySelectorAll('#productList .productEdit').forEach(card=>{
      const sel=card.querySelector('.p-category');
      const id=card.dataset.id||'';
      const cat=sel?.dataset.userChoice || productCats[id] || sel?.value || '';
      card.style.display=(active==='all'||cat===active)?'':'none';
    });
    document.querySelectorAll('#productCategoryTabs button[data-category]').forEach(b=>{
      const on=b.dataset.category===active;
      b.style.background=on?'#e889ad':'#fff0f6';
      b.style.color=on?'#fff':'#92566e';
      b.style.borderColor=on?'#e889ad':'#efc8d7';
    });
  }

  function renderBar(){
    const list=document.getElementById('productList');
    if(!list)return;
    let bar=document.getElementById('productCategoryTabs');
    if(!bar){
      bar=document.createElement('div');
      bar.id='productCategoryTabs';
      bar.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px;padding:6px;background:#fff;border:1px solid #f2ccdc;border-radius:16px;';
      list.parentNode.insertBefore(bar,list);
    }
    bar.innerHTML='';
    keys().forEach(id=>{
      const b=document.createElement('button');
      b.type='button'; b.dataset.category=id; b.textContent=labels[id]||id;
      b.className='btn soft';
      b.addEventListener('click',()=>{active=id;applyFilter();});
      bar.appendChild(b);
    });
    const add=document.createElement('button');
    add.type='button'; add.className='btn soft'; add.textContent='+ สร้างหมวด';
    add.addEventListener('click',()=>{
      const name=prompt('ชื่อหมวดหมู่ใหม่');
      if(!name||!name.trim())return;
      const id='custom_'+Date.now();
      custom.push({id,name:name.trim()}); labels[id]=name.trim(); saveLocal();
      renderBar(); patchSelects(); active=id; applyFilter();
    });
    bar.appendChild(add);

    const edit=document.createElement('button');
    edit.type='button'; edit.className='btn soft'; edit.textContent='✎ แก้ชื่อหมวด';
    edit.addEventListener('click',()=>{
      const editable=keys().filter(x=>x!=='all');
      const pick=prompt('เลือกหมวดที่จะแก้ชื่อ โดยพิมพ์เลข\n\n'+editable.map((id,i)=>(i+1)+'. '+(labels[id]||id)).join('\n'));
      if(!pick)return;
      const idx=Number(pick)-1;
      if(!Number.isInteger(idx)||idx<0||idx>=editable.length){alert('เลขหมวดไม่ถูกต้องค่ะ');return;}
      const id=editable[idx];
      const name=prompt('ชื่อใหม่ของหมวด',labels[id]||id);
      if(!name||!name.trim())return;
      labels[id]=name.trim();
      const c=custom.find(x=>x.id===id); if(c)c.name=name.trim();
      saveLocal(); renderBar(); patchSelects(); applyFilter();
    });
    bar.appendChild(edit);
    applyFilter();
  }

  function startFirestoreSync(){
    try{
      if(typeof db==='undefined'||!db)return setTimeout(startFirestoreSync,400);
      db.collection('products').onSnapshot(snap=>{
        const next={}; let added=false;
        snap.docs.forEach(doc=>{
          const p=doc.data()||{};
          const cat=String(p.category||'echoes');
          next[doc.id]=cat;
          if(cat && !BASE[cat] && !custom.some(x=>x.id===cat)){
            const name=String(p.categoryLabel||cat);
            custom.push({id:cat,name}); labels[cat]=name; added=true;
          }
        });
        productCats=next;
        if(added){saveLocal();renderBar();}
        setTimeout(()=>{patchSelects();applyFilter();},50);
      },()=>{});
    }catch(e){console.warn('category sync failed',e);}
  }

  function start(){
    loadLocal(); renderBar(); patchSelects(); startFirestoreSync();
    setInterval(()=>{patchSelects();applyFilter();},700);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();