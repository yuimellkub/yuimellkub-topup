(function(){
  const labels={all:'ทั้งหมด',echoes:'เติมกระดุม',skins:'เติมสกิน',accessories:'เติมประดับ'};
  let active='all';

  function ensureUI(){
    const list=document.getElementById('productList');
    if(!list) return;
    let bar=document.getElementById('productCategoryTabs');
    if(!bar){
      bar=document.createElement('div');
      bar.id='productCategoryTabs';
      bar.style.cssText='display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 14px;padding:6px;background:#fff;border:1px solid #f2ccdc;border-radius:16px;';
      ['all','echoes','skins','accessories'].forEach(key=>{
        const b=document.createElement('button');
        b.type='button';
        b.dataset.category=key;
        b.textContent=labels[key];
        b.style.cssText='min-width:0;height:42px;border-radius:12px;border:1px solid #efc8d7;background:#fff0f6;color:#92566e;font-weight:850;cursor:pointer;padding:0 8px;';
        b.addEventListener('click',()=>{active=key;applyFilter();});
        bar.appendChild(b);
      });
      list.parentNode.insertBefore(bar,list);
    }
    applyFilter();
  }

  function applyFilter(){
    const bar=document.getElementById('productCategoryTabs');
    if(bar){
      bar.querySelectorAll('button').forEach(b=>{
        const on=b.dataset.category===active;
        b.style.background=on?'#e889ad':'#fff0f6';
        b.style.color=on?'#fff':'#92566e';
        b.style.borderColor=on?'#e889ad':'#efc8d7';
      });
    }
    const list=document.getElementById('productList');
    if(!list) return;
    list.querySelectorAll('.productEdit').forEach(card=>{
      const cat=card.querySelector('.p-category')?.value || '';
      card.style.display=(active==='all'||cat===active)?'':'none';
    });
  }

  const observer=new MutationObserver(()=>{ensureUI();applyFilter();});
  function start(){
    ensureUI();
    const list=document.getElementById('productList');
    if(list) observer.observe(list,{childList:true,subtree:true});
    document.addEventListener('change',e=>{if(e.target?.classList?.contains('p-category')) applyFilter();});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();