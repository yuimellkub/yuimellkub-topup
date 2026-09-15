(function(){
  const PRICES={2888:1060,2688:985,2308:850,2158:800,1963:725,1733:640,2488:910,1888:700,1508:560,1068:405,788:295,628:240,258:100,228:95,208:85,198:80,1408:500,888:325,710:270,500:195,488:185,388:150,288:115,158:70,4888:1790,3912:1430,3688:1375,3288:1210,968:360,318:125,108:50,60:25,3888:1435,3268:1200,2818:1035,2618:960,1968:715,1788:660,1688:625,1588:590,1176:445,1138:430,938:350};
  const CATS=new Set(['skins','skin','accessories','accessory','pets','pet','room','rooms','house','houses','home']);
  const clean=v=>String(v||'').replace(/\s*[×xX]\s*\d+\s*$/,'').trim();
  function amount(name){const a=[...clean(name).matchAll(/\d[\d,]*/g)];return a.length?Number(a[a.length-1][0].replace(/,/g,''))||0:0;}
  function allowed(btn){const card=btn.closest('.ready-stock-card');const cat=String(btn.dataset.readyCategory||card?.dataset.readyCategory||card?.dataset.category||'').toLowerCase().trim();return CATS.has(cat);}
  function add(card){
    if(!card||card.querySelector('.ymk-send-choice'))return;
    const normal=card.querySelector('.ready-stock-order-btn');
    if(!normal||!allowed(normal)||normal.disabled)return;
    const n=amount(normal.dataset.readyName||'');
    const price=PRICES[n];
    if(!price)return;
    const b=document.createElement('button');
    b.type='button';b.className='ymk-send-choice';b.textContent='📦 แบบส่ง · '+price.toLocaleString('th-TH')+' บาท';
    b.style.cssText='width:100%;min-height:40px;margin-top:9px;border:1px solid #e7a6bf;border-radius:999px;background:#fff7fa;color:#c85f88;font:inherit;font-size:13px;font-weight:850;cursor:pointer;box-sizing:border-box';
    const bottom=card.querySelector('.ymk-store-bottom');
    if(bottom)bottom.insertAdjacentElement('afterend',b);else card.appendChild(b);
    b.addEventListener('click',function(e){
      e.preventDefault();e.stopPropagation();
      const base=clean(normal.dataset.ymkBaseName||normal.dataset.readyName||'สินค้า');
      window.YMK_SEND_SELECTION={mode:'send',name:base,category:normal.dataset.readyCategory||card.dataset.readyCategory||card.dataset.category||'',buttons:n,price:price};
      const ev=new CustomEvent('ymk-send-order-selected',{detail:window.YMK_SEND_SELECTION});document.dispatchEvent(ev);
      const old=b.textContent;b.textContent='เลือกแบบส่งแล้ว ✓';b.disabled=true;
      setTimeout(()=>{b.disabled=false;b.textContent=old;},900);
    });
  }
  function scan(){document.querySelectorAll('.ready-stock-card').forEach(add);}
  document.addEventListener('ymk-storefront-products-rendered',()=>setTimeout(scan,0));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();
  window.YMK_SEND_PRICES=PRICES;
})();