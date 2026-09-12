(function(){
  const STORAGE='ymk_admin_categories_v1';
  const DEFAULTS=[
    {id:'echoes',name:'เติมกระดุม'},
    {id:'skins',name:'เติมสกิน'},
    {id:'accessories',name:'เติมประดับ'}
  ];
  let categories=[];
  let active='all';
  let productCategories=new Map();
  let productsUnsub=null;

  function loadCategories(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE)||'[]');
      if(Array.isArray(saved)) categories=saved.filter(x=>x&&x.id&&x.name);
    }catch(e){categories=[];}
    DEFAULTS.forEach(d=>{
      if(!categories.some(x=>x.id===d.id)) categories.push({...d});
    });
    saveCategories();
  }

  function saveCategories(){
    try{localStorage.setItem(STORAGE,JSON.stringify(categories));}catch(e){}
  }

  function labelFor(id){
    return categories.find(x=>x.id===id)?.name || id;
  }

  function makeId(name){
    const base=String(name||'').trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9ก-๙_-]/g,'').slice(0,40);
    return 'custom_'+(base||Date.now());
  }

  function ensureBar(){
    const list=document.getElementById('productList');
    if(!list)return null;
    let bar=document.getElementById('ymkCategoryBar');
    if(bar)return bar;
    bar=document.createElement('div');
    bar.id='ymkCategoryBar';
    bar.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px;padding:7px;background:#fff;border:1px solid #f2ccdc;border-radius:16px;';
    list.parentNode.insertBefore(bar,list);
    return bar;
  }

  function renderBar(){
    const bar=ensureBar();
    if(!bar)return;
    bar.innerHTML='';
    const all=[{id:'all',name:'ทั้งหมด'},...categories];
    all.forEach(cat=>{
      const b=document.createElement('button');
      b.type='button';
      b.dataset.cat=cat.id;
      b.textContent=cat.name;
      b.style.cssText='height:40px;padding:0 13px;border-radius:11px;border:1px solid #efc8d7;background:#fff0f6;color:#92566e;font-weight:850;cursor:pointer;';
      b.addEventListener('click',()=>{active=cat.id;applyFilter();paintTabs();});
      bar.appendChild(b);
    });

    const add=document.createElement('button');
    add.type='button';
    add.textContent='+ สร้างหมวด';
    add.style.cssText='height:40px;padding:0 13px;border-radius:11px;border:1px dashed #df8eaf;background:#fff;color:#c9638d;font-weight:850;cursor:pointer;';
    add.addEventListener('click',createCategory);
    bar.appendChild(add);

    const edit=document.createElement('button');
    edit.type='button';
    edit.textContent='✎ แก้ชื่อหมวด';
    edit.style.cssText='height:40px;padding:0 13px;border-radius:11px;border:1px solid #efc8d7;background:#fff;color:#c9638d;font-weight:850;cursor:pointer;';
    edit.addEventListener('click',chooseRename);
    bar.appendChild(edit);
    paintTabs();
  }

  function paintTabs(){
    const bar=document.getElementById('ymkCategoryBar');
    if(!bar)return;
    bar.querySelectorAll('button[data-cat]').forEach(b=>{
      const on=b.dataset.cat===active;
      b.style.background=on?'#e889ad':'#fff0f6';
      b.style.color=on?'#fff':'#92566e';
      b.style.borderColor=on?'#e889ad':'#efc8d7';
    });
  }

  function addOptionsAndRestore(){
    document.querySelectorAll('#productList .productEdit').forEach(card=>{
      const sel=card.querySelector('.p-category');
      if(!sel)return;
      categories.forEach(cat=>{
        let opt=[...sel.options].find(o=>o.value===cat.id);
        if(!opt){
          opt=document.createElement('option');
          opt.value=cat.id;
          sel.appendChild(opt);
        }
        opt.textContent=cat.name;
      });
      const realCat=productCategories.get(card.dataset.id);
      if(realCat && [...sel.options].some(o=>o.value===realCat)) sel.value=realCat;
      if(!sel.dataset.ymkCategoryBound){
        sel.dataset.ymkCategoryBound='1';
        sel.addEventListener('change',()=>{
          productCategories.set(card.dataset.id,sel.value);
          applyFilter();
        });
      }
    });
    applyFilter();
  }

  function applyFilter(){
    document.querySelectorAll('#productList .productEdit').forEach(card=>{
      const sel=card.querySelector('.p-category');
      const cat=sel?.value || productCategories.get(card.dataset.id) || '';
      card.style.display=(active==='all'||cat===active)?'':'none';
    });
  }

  function createCategory(){
    const name=prompt('ชื่อหมวดหมู่ใหม่ เช่น เติมบ้าน');
    if(!name||!name.trim())return;
    if(categories.some(x=>x.name.trim()===name.trim())){alert('มีหมวดชื่อนี้แล้วค่ะ');return;}
    let id=makeId(name);
    while(categories.some(x=>x.id===id)) id='custom_'+Date.now();
    categories.push({id,name:name.trim()});
    saveCategories();
    renderBar();
    addOptionsAndRestore();
    active=id;
    applyFilter();
    paintTabs();
  }

  function chooseRename(){
    if(!categories.length)return;
    const menu=categories.map((x,i)=>(i+1)+'. '+x.name).join('\n');
    const pick=prompt('เลือกหมวดที่จะแก้ชื่อ โดยพิมพ์เลข\n\n'+menu);
    if(!pick)return;
    const i=Number(pick)-1;
    if(!Number.isInteger(i)||i<0||i>=categories.length){alert('เลขหมวดไม่ถูกต้องค่ะ');return;}
    const cat=categories[i];
    const name=prompt('ชื่อใหม่ของหมวด',cat.name);
    if(!name||!name.trim())return;
    cat.name=name.trim();
    saveCategories();
    renderBar();
    addOptionsAndRestore();
    updateLabelsOnline(cat.id,cat.name);
  }

  async function updateLabelsOnline(id,name){
    try{
      if(typeof db==='undefined'||!db||typeof auth==='undefined'||!auth?.currentUser)return;
      const snap=await db.collection('products').where('category','==',id).get();
      if(snap.empty)return;
      const batch=db.batch();
      snap.docs.forEach(doc=>batch.set(doc.ref,{categoryLabel:name,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true}));
      await batch.commit();
    }catch(e){console.warn('category label update failed',e);}
  }

  function startProductSync(){
    try{
      if(typeof db==='undefined'||!db)return setTimeout(startProductSync,250);
      if(productsUnsub)return;
      productsUnsub=db.collection('products').onSnapshot(snap=>{
        productCategories.clear();
        let added=false;
        snap.docs.forEach(doc=>{
          const p=doc.data()||{};
          const cat=String(p.category||'echoes');
          productCategories.set(doc.id,cat);
          if(!categories.some(x=>x.id===cat)){
            categories.push({id:cat,name:String(p.categoryLabel||cat)});
            added=true;
          }
        });
        if(added){saveCategories();renderBar();}
        setTimeout(addOptionsAndRestore,0);
      },err=>console.warn('category product sync failed',err));
    }catch(e){setTimeout(startProductSync,500);}
  }

  function start(){
    loadCategories();
    renderBar();
    addOptionsAndRestore();
    const list=document.getElementById('productList');
    if(list){
      const observer=new MutationObserver(()=>setTimeout(addOptionsAndRestore,0));
      observer.observe(list,{childList:true});
    }
    startProductSync();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();