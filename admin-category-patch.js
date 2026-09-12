(function(){
  const defaults={all:'ทั้งหมด',echoes:'เติมกระดุม',skins:'เติมสกิน',accessories:'เติมประดับ'};
  let labels={...defaults};
  let custom=[];
  let active='all';
  let busy=false;

  const slug=s=>'custom_'+String(s||'').trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9ก-๙_\-]/g,'').slice(0,50);
  const saveLocal=()=>{try{localStorage.setItem('ymk_custom_categories',JSON.stringify(custom));}catch(e){}};
  function loadLocal(){try{const v=JSON.parse(localStorage.getItem('ymk_custom_categories')||'[]');custom=Array.isArray(v)?v:[];}catch(e){custom=[];}custom.forEach(x=>labels[x.id]=x.name);}
  function ensureCustom(id,name){if(!id||defaults[id]||id==='all')return;const n=String(name||id).trim()||id;let item=custom.find(x=>x.id===id);if(!item){item={id,name:n};custom.push(item);}else item.name=n;labels[id]=n;saveLocal();}
  function keys(){return ['all','echoes','skins','accessories',...custom.map(x=>x.id)];}

  function addOptions(){
    document.querySelectorAll('.p-category').forEach(sel=>{
      const current=sel.value;
      custom.forEach(x=>{
        let o=[...sel.options].find(v=>v.value===x.id);
        if(!o){o=document.createElement('option');o.value=x.id;sel.appendChild(o);}
        o.textContent=x.name;
      });
      if(current&&[...sel.options].some(o=>o.value===current))sel.value=current;
    });
  }

  function applyFilter(){
    const list=document.getElementById('productList');
    if(list){list.querySelectorAll('.productEdit').forEach(card=>{const cat=card.querySelector('.p-category')?.value||'';card.style.display=(active==='all'||cat===active)?'':'none';});}
    const bar=document.getElementById('productCategoryTabs');
    if(bar)bar.querySelectorAll('[data-category]').forEach(b=>{const on=b.dataset.category===active;b.style.background=on?'#e889ad':'#fff0f6';b.style.color=on?'#fff':'#92566e';b.style.borderColor=on?'#e889ad':'#efc8d7';});
  }

  function renderTabs(){
    const list=document.getElementById('productList');if(!list)return;
    let bar=document.getElementById('productCategoryTabs');
    if(!bar){bar=document.createElement('div');bar.id='productCategoryTabs';bar.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px;padding:6px;background:#fff;border:1px solid #f2ccdc;border-radius:16px;';list.parentNode.insertBefore(bar,list);}
    bar.innerHTML='';
    keys().forEach(key=>{const b=document.createElement('button');b.type='button';b.dataset.category=key;b.textContent=labels[key]||key;b.style.cssText='min-width:110px;height:42px;border-radius:12px;border:1px solid #efc8d7;background:#fff0f6;color:#92566e;font-weight:850;cursor:pointer;padding:0 12px;';b.addEventListener('click',()=>{active=key;applyFilter();});bar.appendChild(b);});
    const add=document.createElement('button');add.type='button';add.textContent='+ สร้างหมวด';add.style.cssText='height:42px;border-radius:12px;border:1px dashed #df8eaf;background:#fff;color:#c9638d;font-weight:850;cursor:pointer;padding:0 14px;';add.addEventListener('click',createCategory);bar.appendChild(add);
    const edit=document.createElement('button');edit.type='button';edit.textContent='✎ แก้ชื่อหมวด';edit.style.cssText='height:42px;border-radius:12px;border:1px solid #efc8d7;background:#fff;color:#c9638d;font-weight:850;cursor:pointer;padding:0 14px;';edit.addEventListener('click',chooseRename);bar.appendChild(edit);
    applyFilter();
  }

  function createCategory(){
    if(busy)return;const name=prompt('ชื่อหมวดหมู่ใหม่ เช่น เติมบ้าน');if(!name||!name.trim())return;
    let id=slug(name);if(!id||id==='custom_')id='custom_'+Date.now();
    if(labels[id]){alert('มีหมวดหมู่นี้แล้วค่ะ');return;}
    ensureCustom(id,name.trim());addOptions();renderTabs();active=id;applyFilter();
  }

  function chooseRename(){
    if(!custom.length){alert('ยังไม่มีหมวดที่สร้างเองให้แก้ไขค่ะ');return;}
    const menu=custom.map((x,i)=>(i+1)+'. '+x.name).join('\n');
    const pick=prompt('เลือกหมวดที่จะแก้ชื่อ โดยพิมพ์เลข\n\n'+menu);
    if(!pick)return;const idx=Number(pick)-1;if(!Number.isInteger(idx)||idx<0||idx>=custom.length){alert('เลขหมวดไม่ถูกต้องค่ะ');return;}
    renameCategory(custom[idx].id);
  }

  async function renameCategory(id){
    const item=custom.find(x=>x.id===id);if(!item)return;
    const name=prompt('ชื่อใหม่ของหมวด',item.name);if(!name||!name.trim()||name.trim()===item.name)return;
    busy=true;item.name=name.trim();labels[id]=item.name;saveLocal();addOptions();renderTabs();
    try{
      if(typeof db!=='undefined'&&db&&typeof auth!=='undefined'&&auth?.currentUser){
        const snap=await db.collection('products').where('category','==',id).get();
        if(!snap.empty){const batch=db.batch();snap.docs.forEach(doc=>batch.set(doc.ref,{categoryLabel:item.name,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true}));await batch.commit();}
      }
    }catch(e){console.warn('rename category products failed',e);}finally{busy=false;}
  }

  function syncFromProducts(){
    try{
      if(typeof db==='undefined'||!db)return;
      db.collection('products').onSnapshot(s=>{let changed=false;s.docs.forEach(d=>{const p=d.data()||{},id=String(p.category||'');if(id&&!defaults[id]&&id!=='all'){const before=labels[id];ensureCustom(id,String(p.categoryLabel||before||id));if(before!==labels[id])changed=true;}});if(changed)renderTabs();addOptions();applyFilter();},()=>{});
    }catch(e){}
  }

  function start(){
    loadLocal();renderTabs();addOptions();
    document.addEventListener('change',e=>{if(e.target?.classList?.contains('p-category'))applyFilter();});
    document.addEventListener('ymk-product-saved',e=>{const d=e.detail||{};if(d.category&&!defaults[d.category])ensureCustom(d.category,d.categoryLabel||d.category);addOptions();renderTabs();active=d.category||active;applyFilter();});
    setInterval(()=>{addOptions();applyFilter();},1200);
    syncFromProducts();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();