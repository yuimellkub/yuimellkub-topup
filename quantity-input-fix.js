(function(){
  function fix(){
    document.querySelectorAll('.ymk-qty-input').forEach(input=>{
      input.type='text';
      input.inputMode='numeric';
      input.setAttribute('pattern','[0-9]*');
      if(!String(input.value||'').trim()) input.value='1';
      input.style.setProperty('color','#71465a','important');
      input.style.setProperty('-webkit-text-fill-color','#71465a','important');
      input.style.setProperty('font-size','15px','important');
      input.style.setProperty('font-weight','500','important');
      input.style.setProperty('line-height','32px','important');
      input.style.setProperty('padding','0','important');
      input.style.setProperty('appearance','none','important');
      input.style.setProperty('-webkit-appearance','none','important');
    });
  }
  fix();
  new MutationObserver(fix).observe(document.body,{childList:true,subtree:true});
})();