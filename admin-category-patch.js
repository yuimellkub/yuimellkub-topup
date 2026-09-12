(function(){
  const defaults={all:'ทั้งหมด',echoes:'เติมกระดุม',skins:'เติมสกิน',accessories:'เติมประดับ'};
  let labels={...defaults};
  let active='all';
  let custom=[];
  const slug=s=>'custom_'+String(s||'').trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9ก-๙_\-]/g,'').slice(0,50);

  function loadLocal(){try{custom=JSON.parse(localStorage.getItem('ymk_custom_categories')||'[]');if(!Array.isArray(custom))custom=[];}catch(e){custom=[];}custom.forEach(x=>labels[x.id]=x.name);}
  function saveLocal(){try{localStorage.setItem('ymk_custom_categories',JSON.stringify(custom));}catch(e){}}
  function allKeys(){return ['all','echoes','skins','accessories',...custom.map(x=>x.id)];}

  function addOptions(){document.querySelectorAll('.p-category').forEach(sel=>{custom.forEach(x=>{if(![...sel.options].some(o=>o.value===x.id)){const o=document.createElement('option');o.value=x.id;o.textContent=x.name;sel.appendChild(o);}});});}

  function renderTabs(){const list=document.getElementById('productList');if(!list)return;let bar=document.getElementById('productCategoryTabs');if(!bar){bar=document.createElement('div');bar.id='productCategoryTabs';bar.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px;padding:6px;background:#fff;border:1px solid #f2ccdc;border-radius:16px;';list.parentNode.insertBefore(bar,list);}bar.innerHTML='';allKeys().forEach(key=>{const b=document.createElement('button');b.type='button';b.dataset.category=key;b.textContent=labels[key]||key;b.style.cssText='min-width:110px;height:42px;border-radius:12px;border:1px solid #efc8d7;background:#fff0f6;color:#92566e;font-weight:850;cursor:pointer;padding:0 12px;';b.onclick=()=>{active=key;applyFilter();};bar.appendChild(b);});const add=document.createElement('button');add.type='button';add.textContent='+ สร้างหมวด';add.style.cssText='min-width:110px;height:42px;border-radius:12px;border:1px dashed #df8eaf;background:#fff;color:#c9638d;font-weight:850;cursor:pointer;padding:0 12px;';add.onclick=createCategory;bar.appendChild(add);applyFilter();}

  async function createCategory(){const name=prompt('ชื่อหมวดหมู่ใหม่ เช่น เติมบ้าน');if(!name||!name.trim())return;let id=slug(name);if(!id||id==='custom_')id='custom_'+Date.now();if(labels[id]){alert('มีหมวดหมู่นี้แล้วค่ะ');return;}const item={id,name:name.trim()};custom.push(item);labels[id]=item.name;saveLocal();try{if(typeof db!=='undefined'&&db&&typeof auth!=='undefined'&&auth?.currentUser){await db.collection('product_categories').doc(id).set({name:item.name,order:custom.length,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});}}catch(e){console.warn('save category online failed',e);}addOptions();renderTabs();active=id;applyFilter();}

  function applyFilter(){const bar=document.getElementById('productCategoryTabs');if(bar)bar.querySelectorAll('button[data-category]').forEach(b=>{const on=b.dataset.category===active;b.style.background=on?'#e889ad':'#fff0f6';b.style.color=on?'#fff':'#92566e';b.style.borderColor=on?'#e889ad':'#efc8d7';});const list=document.getElementById('productList');if(!list)return;list.querySelectorAll('.productEdit').forEach(card=>{const cat=card.querySelector('.p-category')?.value||'';card.style.display=(active==='all'||cat===active)?'':'none';});}

  function syncOnline(){try{if(typeof db==='undefined'||!db)return setTimeout(syncOnline,300);db.collection('product_categories').onSnapshot(s=>{let changed=false;s.docs.forEach(d=>{const v=d.data()||{},id=d.id,name=String(v.name||id);if(!custom.some(x=>x.id===id)){custom.push({id,name});changed=true;}labels[id]=name;});if(changed)saveLocal();addOptions();renderTabs();},()=>{});}catch(e){}}
  const observer=new MutationObserver(()=>{addOptions();applyFilter();});
  function start(){loadLocal();renderTabs();addOptions();const list=document.getElementById('productList');if(list)observer.observe(list,{childList:true,subtree:true});document.addEventListener('change',e=>{if(e.target?.classList?.contains('p-category'))applyFilter();});syncOnline();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();