(function(){
  const NEW_TEXT='💬 พบปัญหา / สอบถามเพิ่มเติม ติดต่อเรา';
  function fix(){
    document.querySelectorAll('a,button,.contact-bar').forEach(el=>{
      const t=(el.textContent||'').trim();
      if(t.includes('สนใจเติม')&&t.toLowerCase().includes('yuimellkub')) el.textContent=NEW_TEXT;
    });
  }
  fix();
  new MutationObserver(fix).observe(document.body,{childList:true,subtree:true,characterData:true});
})();