(function(){
  'use strict';

  const STYLE=`
  #ymkSalesSummary{margin:16px 0 14px;padding:14px;background:#fff;border:1px solid #f2ccdc;border-radius:18px;box-shadow:0 8px 24px rgba(190,105,145,.08)}
  #ymkSalesSummary .ssHead{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:11px}
  #ymkSalesSummary .ssTitle{font-weight:900;color:#8f4f68;font-size:15px}
  #ymkSalesSummary .ssHint{font-size:10px;color:#af8193;margin-top:2px}
  #ymkSalesSummary .ssGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
  #ymkSalesSummary .ssCard{padding:12px;border:1px solid #f2ccdc;border-radius:14px;background:#fff8fb;min-width:0}
  #ymkSalesSummary .ssLabel{font-size:11px;font-weight:800;color:#9b6a7d}
  #ymkSalesSummary .ssAmount{font-size:19px;line-height:1.2;font-weight:900;color:#d96f9a;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #ymkSalesSummary .ssCount{font-size:10px;color:#af8193;margin-top:4px}
  #ymkSalesSummary .ssEmpty{font-size:12px;color:#aa7c8e;text-align:center;padding:8px}
  @media(max-width:620px){#ymkSalesSummary .ssGrid{grid-template-columns:1fr}#ymkSalesSummary .ssAmount{font-size:18px}}
  `;

  function addUI(){
    if(document.getElementById('ymkSalesSummary')) return;
    const style=document.createElement('style'); style.textContent=STYLE; document.head.appendChild(style);
    const box=document.createElement('section');
    box.id='ymkSalesSummary';
    box.innerHTML=`<div class="ssHead"><div><div class="ssTitle">♡ สรุปยอดขาย</div><div class="ssHint">นับเฉพาะออเดอร์ที่สถานะ “สำเร็จ”</div></div></div><div class="ssGrid"><div class="ssCard"><div class="ssLabel">วันนี้</div><div class="ssAmount" data-k="day">—</div><div class="ssCount" data-c="day">กำลังโหลด...</div></div><div class="ssCard"><div class="ssLabel">เดือนนี้</div><div class="ssAmount" data-k="month">—</div><div class="ssCount" data-c="month">กำลังโหลด...</div></div><div class="ssCard"><div class="ssLabel">ปีนี้</div><div class="ssAmount" data-k="year">—</div><div class="ssCount" data-c="year">กำลังโหลด...</div></div></div>`;
    const notice=document.querySelector('.notice');
    if(notice) notice.insertAdjacentElement('afterend',box);
    else document.querySelector('.wrap')?.prepend(box);
  }

  const money=v=>new Intl.NumberFormat('th-TH',{maximumFractionDigits:2}).format(v)+' บาท';
  function numPrice(v){
    if(typeof v==='number') return Number.isFinite(v)?v:0;
    const n=Number(String(v??'').replace(/[^0-9.-]/g,''));
    return Number.isFinite(n)?n:0;
  }
  function asDate(o){
    const x=o.createdAt;
    if(x?.toDate) return x.toDate();
    if(x instanceof Date) return x;
    if(x){ const d=new Date(x); if(!isNaN(d)) return d; }
    return null;
  }
  function isSuccess(o){ return String(o.shopStatus||o.paymentStatus||'').trim()==='สำเร็จ'; }
  function sameDay(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}
  function summarize(rows){
    const now=new Date();
    const out={day:{sum:0,n:0},month:{sum:0,n:0},year:{sum:0,n:0}};
    rows.forEach(o=>{
      if(!isSuccess(o)) return;
      const d=asDate(o); if(!d) return;
      const p=numPrice(o.price);
      if(d.getFullYear()===now.getFullYear()){
        out.year.sum+=p; out.year.n++;
        if(d.getMonth()===now.getMonth()){
          out.month.sum+=p; out.month.n++;
          if(sameDay(d,now)){out.day.sum+=p;out.day.n++;}
        }
      }
    });
    Object.keys(out).forEach(k=>{
      const a=document.querySelector(`#ymkSalesSummary [data-k="${k}"]`);
      const c=document.querySelector(`#ymkSalesSummary [data-c="${k}"]`);
      if(a) a.textContent=money(out[k].sum);
      if(c) c.textContent=`${out[k].n.toLocaleString('th-TH')} ออเดอร์สำเร็จ`;
    });
  }
  function setMessage(msg){
    ['day','month','year'].forEach(k=>{
      const a=document.querySelector(`#ymkSalesSummary [data-k="${k}"]`); if(a)a.textContent='—';
      const c=document.querySelector(`#ymkSalesSummary [data-c="${k}"]`); if(c)c.textContent=msg;
    });
  }

  addUI();
  let unsub=null;
  function connect(){
    if(!window.firebase?.firestore || !window.firebase?.auth){ setTimeout(connect,500); return; }
    const auth=firebase.auth();
    auth.onAuthStateChanged(user=>{
      if(unsub){unsub();unsub=null;}
      if(!user){setMessage('เข้าสู่ระบบร้านเพื่อดูยอด');return;}
      const allowed=String(window.YUIMELLKUB_ADMIN_UID||'').trim();
      if(allowed && user.uid!==allowed){setMessage('ไม่มีสิทธิ์ดูยอด');return;}
      unsub=firebase.firestore().collection('orders').onSnapshot(snap=>{
        summarize(snap.docs.map(d=>({...d.data(),id:d.id})));
      },err=>{console.warn('sales summary failed',err);setMessage('โหลดสรุปยอดไม่ได้');});
    });
  }
  connect();
})();
