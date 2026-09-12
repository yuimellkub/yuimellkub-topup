(function(){
  let observer=null;

  function norm(v){
    return String(v||'').toLowerCase().trim();
  }

  function ensureUI(){
    const orders=document.getElementById('orders');
    if(!orders) return;
    if(document.getElementById('orderFilterBar')) return;

    const bar=document.createElement('div');
    bar.id='orderFilterBar';
    bar.innerHTML=`
      <div style="display:grid;grid-template-columns:minmax(0,1.7fr) minmax(160px,.8fr) auto;gap:8px;align-items:center;margin:0 0 12px;padding:12px;background:#fff;border:1px solid #f2ccdc;border-radius:16px;box-shadow:0 6px 18px rgba(190,105,145,.06)">
        <input id="orderSearchInput" type="search" placeholder="ค้นหาเลขออเดอร์ / UID / ชื่อ / สินค้า" autocomplete="off" style="width:100%;height:42px;border:1px solid #efc8d7;border-radius:12px;padding:0 12px;background:#fff;color:#71465a;font:inherit;outline:none">
        <select id="orderStatusFilter" style="width:100%;height:42px;border:1px solid #efc8d7;border-radius:12px;padding:0 10px;background:#fff;color:#71465a;font:inherit">
          <option value="">ทุกสถานะ</option>
        </select>
        <button id="orderFilterClear" type="button" class="btn soft" style="height:42px;white-space:nowrap">ล้างตัวกรอง</button>
      </div>
      <div id="orderFilterCount" style="font-size:12px;color:#a16b80;margin:-4px 2px 10px"></div>
    `;
    orders.parentNode.insertBefore(bar,orders);

    document.getElementById('orderSearchInput').addEventListener('input',applyFilter);
    document.getElementById('orderStatusFilter').addEventListener('change',applyFilter);
    document.getElementById('orderFilterClear').addEventListener('click',()=>{
      document.getElementById('orderSearchInput').value='';
      document.getElementById('orderStatusFilter').value='';
      applyFilter();
    });

    const responsive=document.createElement('style');
    responsive.textContent='@media(max-width:650px){#orderFilterBar>div:first-child{grid-template-columns:1fr!important}#orderFilterClear{width:100%}}';
    document.head.appendChild(responsive);
  }

  function syncStatuses(){
    const select=document.getElementById('orderStatusFilter');
    const orders=document.getElementById('orders');
    if(!select||!orders) return;
    const current=select.value;
    const statuses=new Set();
    orders.querySelectorAll('.card .shopStatus').forEach(s=>{
      Array.from(s.options||[]).forEach(o=>{
        const v=String(o.value||o.textContent||'').trim();
        if(v) statuses.add(v);
      });
    });
    const existing=new Set(Array.from(select.options).map(o=>o.value));
    statuses.forEach(v=>{
      if(existing.has(v)) return;
      const o=document.createElement('option');
      o.value=v;o.textContent=v;
      select.appendChild(o);
    });
    if(Array.from(select.options).some(o=>o.value===current)) select.value=current;
  }

  function applyFilter(){
    const orders=document.getElementById('orders');
    if(!orders) return;
    ensureUI();
    syncStatuses();

    const q=norm(document.getElementById('orderSearchInput')?.value);
    const status=document.getElementById('orderStatusFilter')?.value||'';
    const cards=Array.from(orders.querySelectorAll('.card[data-id]'));
    let shown=0;

    cards.forEach(card=>{
      const hay=norm(card.textContent);
      const cardStatus=card.querySelector('.shopStatus')?.value||'';
      const okText=!q||hay.includes(q);
      const okStatus=!status||cardStatus===status;
      const show=okText&&okStatus;
      card.style.display=show?'':'none';
      if(show) shown++;
    });

    const count=document.getElementById('orderFilterCount');
    if(count){
      if(!cards.length) count.textContent='';
      else count.textContent=`แสดง ${shown} จาก ${cards.length} ออเดอร์`;
    }

    let noResult=document.getElementById('orderFilterEmpty');
    if(cards.length&&shown===0){
      if(!noResult){
        noResult=document.createElement('div');
        noResult.id='orderFilterEmpty';
        noResult.className='empty';
        noResult.textContent='ไม่พบออเดอร์ที่ตรงกับการค้นหา ♡';
        orders.appendChild(noResult);
      }
      noResult.style.display='block';
    }else if(noResult){
      noResult.style.display='none';
    }
  }

  function start(){
    const orders=document.getElementById('orders');
    if(!orders) return setTimeout(start,250);
    ensureUI();
    observer=new MutationObserver(()=>{
      syncStatuses();
      applyFilter();
    });
    observer.observe(orders,{childList:true,subtree:true});
    orders.addEventListener('change',e=>{
      if(e.target?.classList?.contains('shopStatus')) applyFilter();
    });
    applyFilter();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start);
  else start();
})();
