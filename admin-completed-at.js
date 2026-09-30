(function(){'use strict';
function boot(){
  if(!window.firebase?.firestore)return setTimeout(boot,300);
  document.addEventListener('change',async function(e){
    const sel=e.target;
    if(!sel?.classList?.contains('shopStatus'))return;
    const card=sel.closest('.card'),id=card?.dataset?.id;
    if(!id)return;
    try{
      const ref=firebase.firestore().collection('orders').doc(id);
      if(sel.value==='สำเร็จ'){
        await ref.set({completedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
      }else{
        await ref.set({completedAt:firebase.firestore.FieldValue.delete()},{merge:true});
      }
    }catch(err){console.warn('completedAt update failed',err);}
  },true);
}
boot();
})();