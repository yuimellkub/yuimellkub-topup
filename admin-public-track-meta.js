(function(){
  'use strict';

  function getDB(){
    try{
      if(!window.firebase || !firebase.firestore) return null;
      if(typeof auth !== 'undefined' && auth && !auth.currentUser) return null;
      return firebase.firestore();
    }catch(_){ return null; }
  }

  function rowValue(card,label){
    const rows=[...card.querySelectorAll('.row')];
    const row=rows.find(r=>{
      const b=r.querySelector('b');
      return b && String(b.textContent||'').trim()===label;
    });
    if(!row) return '';
    const clone=row.cloneNode(true);
    clone.querySelector('b')?.remove();
    return String(clone.textContent||'').trim();
  }

  function orderId(card){
    const direct=String(card.dataset.id||'').trim();
    if(/^YMK\d{6}-\d{6}$/i.test(direct)) return direct.toUpperCase();
    const match=String(card.textContent||'').match(/YMK\d{6}-\d{6}/i);
    return match ? match[0].toUpperCase() : '';
  }

  async function syncCard(card){
    const id=orderId(card);
    const store=getDB();
    if(!id || !store) return;
    const meta={
      orderId:id,
      item:rowValue(card,'รายการ'),
      pack:rowValue(card,'แพ็ก'),
      uid:rowValue(card,'UID'),
      server:rowValue(card,'Server'),
      publicTrackMetaUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()
    };
    Object.keys(meta).forEach(k=>{
      if(typeof meta[k]==='string' && !meta[k]) delete meta[k];
    });
    try{
      await store.collection('order_status').doc(id).set(meta,{merge:true});
    }catch(err){
      console.warn('public tracking metadata sync failed',id,err);
    }
  }

  function scan(){
    document.querySelectorAll('#orders .card').forEach(card=>syncCard(card));
  }

  document.addEventListener('change',e=>{
    if(e.target?.matches?.('#orders select.shopStatus')){
      const card=e.target.closest('.card');
      if(card) syncCard(card);
    }
  },true);

  const root=document.getElementById('orders');
  if(root) new MutationObserver(()=>scan()).observe(root,{childList:true,subtree:true});
  scan();
})();