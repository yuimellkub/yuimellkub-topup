(function(){
  function clean(v){return String(v||'').replace(/\s*[×xX]\s*\d+\s*$/,'').trim();}
  function amountFromName(name){
    if(window.YMK_BUTTON_PACKS?.buttonAmountFromName) return Number(window.YMK_BUTTON_PACKS.buttonAmountFromName(name)||0);
    const t=clean(name);
    const m=t.match(/(\d[\d,]*)\s*(?:กระดุม|ปุ่ม|buttons?)/i);
    if(m) return Number(m[1].replace(/,/g,''))||0;
    const a=[...t.matchAll(/\d[\d,]*/g)];
    return a.length ? Number(a[a.length-1][0].replace(/,/g,''))||0 : 0;
  }
  function bestPlan(target){
    if(window.YMK_BUTTON_PACKS?.bestPlan) return window.YMK_BUTTON_PACKS.bestPlan(target);
    return null;
  }
  document.addEventListener('click',function(e){
    const confirm=e.target.closest('.ymk-confirm-order');
    if(!confirm) return;
    const card=confirm.closest('.ready-stock-card');
    const btn=card?.querySelector('.ready-stock-order-btn');
    const input=card?.querySelector('.ymk-qty-input');
    if(!btn) return;
    const category=String(btn.dataset.readyCategory||'echoes');
    if(!['skins','accessories'].includes(category)) return;
    const base=btn.dataset.ymkBaseName||clean(btn.dataset.readyName||'');
    const each=amountFromName(base);
    const qty=Math.max(1,Math.floor(Number(input?.value)||1));
    const plan=each?bestPlan(each*qty):null;
    if(plan?.text){
      btn.dataset.readyDescription=plan.text;
      btn.dataset.ymkCalculatedPack=plan.text;
    }
  },true);
})();