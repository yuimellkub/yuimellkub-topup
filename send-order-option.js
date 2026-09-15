(function(){
  const PRICE_BY_CATEGORY={
    skins:{2888:1060,2688:985,2308:850,2158:800,1963:725,1733:640,318:125,288:115,258:100,108:50,60:25,3888:1435,3288:1205,3268:1200,2818:1035,2618:960,1968:715,1888:700,1788:660,1688:625,1588:590,1176:445,1138:430,938:350},
    accessories:{2488:910,1888:700,1508:560,1068:405,788:295,628:240,258:100,228:95,208:85,198:80},
    pets:{1408:500,888:325,788:295,710:270,500:195,488:185,388:150,288:115,158:70},
    room:{4888:1790,3912:1430,3688:1375,3288:1210,968:360}
  };
  const clean=v=>String(v||'').replace(/\s*[×xX]\s*\d+\s*$/,'').trim();
  function amount(name){const a=[...clean(name).matchAll(/\d[\d,]*/g)];return a.length?Number(a[a.length-1][0].replace(/,/g,''))||0:0;}
  function group(btn){
    const card=btn.closest('.ready-stock-card'),panel=card?.closest('[data-stock-panel]');
    const raw=String(btn.dataset.readyCategory||card?.dataset.readyCategory||card?.dataset.category||panel?.dataset.stockPanel||'').toLowerCase();
    const text=(clean(btn.dataset.readyName||'')+' '+raw+' '+String(panel?.textContent||'')).toLowerCase();
    if(/accessor|ประดับ/.test(raw)||/ประดับ/.test(text))return'accessories';
    if(/pet|สัตว์เลี้ยง/.test(raw)||/สัตว์เลี้ยง/.test(text))return'pets';
    if(/room|house|home|ห้อง/.test(raw)||/ห้อง/.test(text))return'room';
    if(/skin|สกิน/.test(raw)||/สกิน/.test(text))return'skins';
    return'';
  }
  function closeOther(except){document.querySelectorAll('.ready-stock-card').forEach(card=>{if(card===except)return;const btn=card.querySelector('.ready-stock-order-btn'),wrap=card.querySelector('.ymk-qty-wrap'),send=card.querySelector('.ymk-send-choice');if(wrap)wrap.style.display='none';if(btn){btn.dataset.ymkQtyOpen='0';btn.style.display='';}if(send)send.style.display='';});}
  function add(card){
    if(!card||card.querySelector('.ymk-send-choice'))return;
    const normal=card.querySelector('.ready-stock-order-btn');if(!normal||normal.disabled)return;
    const g=group(normal),n=amount(normal.dataset.readyName||''),price=PRICE_BY_CATEGORY[g]?.[n];if(!price)return;
    const bottom=card.querySelector('.ymk-store-bottom');if(!bottom)return;
    bottom.style.setProperty('display','grid','important');bottom.style.setProperty('grid-template-columns','minmax(0,1fr) 112px 112px','important');bottom.style.setProperty('align-items','center','important');bottom.style.setProperty('gap','8px','important');normal.style.setProperty('width','112px','important');normal.style.setProperty('min-width','112px','important');normal.style.setProperty('padding','0 10px','important');
    const b=document.createElement('button');b.type='button';b.className='ymk-send-choice';b.textContent='📦 แบบส่ง';b.style.cssText='width:112px;min-width:112px;height:44px;border:1px solid #e7a6bf;border-radius:999px;background:#fff7fa;color:#c85f88;font:inherit;font-size:13px;font-weight:850;white-space:nowrap;cursor:pointer;box-sizing:border-box';bottom.appendChild(b);
    b.onclick=function(e){
      e.preventDefault();e.stopPropagation();closeOther(card);
      const base=clean(normal.dataset.ymkBaseName||normal.dataset.readyName||'สินค้า'),oldPrice=normal.dataset.readyPrice,oldName=normal.dataset.readyName;
      window.YMK_SEND_SELECTION={mode:'send',name:base,category:g,buttons:n,price};window.YMK_PENDING_ORDER_META={q:1,base,p:{send:true,total:price,unit:price}};
      normal.dataset.readyPrice=String(price);normal.dataset.readyName=base;normal.dataset.ymkConfirming='1';
      normal.click();
      const patch=()=>{const total='ยอดรวม: '+price.toLocaleString('th-TH')+' บาท';document.querySelectorAll('textarea').forEach(el=>{if(/รายการ:|ยอดรวม:/.test(el.value||'')){let v=el.value||'';v=v.replace(/ยอดรวม:\s*[^\n\r]*/,total).replace(/แพ็ก(?:ที่เติม)?:\s*[^\n\r]*/,'แพ็ก: แบบส่ง');el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));}});const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let x;while(x=walker.nextNode()){const v=x.nodeValue||'';if(/ยอดรวม:\s*[\d,.]+\s*บาท/.test(v))x.nodeValue=v.replace(/ยอดรวม:\s*[\d,.]+\s*บาท/,total);if(v.includes('แพ็ก: พร้อมเติมทันที'))x.nodeValue=x.nodeValue.replace('แพ็ก: พร้อมเติมทันที','แพ็ก: แบบส่ง');}};[0,30,80,160,300,600].forEach(ms=>setTimeout(patch,ms));
      setTimeout(()=>{normal.dataset.readyPrice=oldPrice||'';normal.dataset.readyName=oldName||base;delete normal.dataset.ymkConfirming;},700);
    };
  }
  document.addEventListener('click',e=>{const normal=e.target.closest('.ready-stock-order-btn');if(!normal||normal.dataset.ymkConfirming==='1')return;const card=normal.closest('.ready-stock-card');closeOther(card);const send=card?.querySelector('.ymk-send-choice');if(send)send.style.display='none';},true);
  function scan(){document.querySelectorAll('.ready-stock-card').forEach(add);}
  document.addEventListener('ymk-storefront-products-rendered',()=>setTimeout(scan,0));if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();window.YMK_SEND_PRICES=PRICE_BY_CATEGORY;
})();