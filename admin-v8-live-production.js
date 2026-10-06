(function(){
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function boot(){
 document.querySelectorAll('.preview').forEach(function(x){x.remove()});
 if(!window.firebase||!firebase.firestore||!window.YUIMELLKUB_FIREBASE_CONFIG)return setTimeout(boot,250);
 try{if(!firebase.apps.length)firebase.initializeApp(window.YUIMELLKUB_FIREBASE_CONFIG)}catch(e){}
 var db=firebase.firestore();window.db=db;
 var orders=document.querySelector('#orders');if(!orders)return;
 var old=orders.querySelector('.oldGrid');if(old)old.style.display='grid';
 var css=document.createElement('style');css.textContent='#orders .summary>div b{font-size:20px!important}#orders .summary>div b:after,#orders .summary>div .time:after,#orders .panel:nth-of-type(4):after{content:none!important}#orders .summary>div .time{font-size:11px!important}.oldGrid{display:grid!important;gap:10px!important}';document.head.appendChild(css);
 function fmt(t){try{var d=t&&t.toDate?t.toDate():new Date(t||Date.now());return d.toLocaleString('th-TH')}catch(e){return ''}}
 function ok(o){var s=String(o.shopStatus||o.status||'');return /สำเร็จ|เติมแล้ว|completed|success/i.test(s)}
 function amount(o){return Number(String(o.price||0).replace(/[^0-9.]/g,''))||0}
 db.collection('orders').onSnapshot(function(s){
  var a=s.docs.map(function(d){return Object.assign({id:d.id},d.data())});
  a.sort(function(x,y){var ax=x.createdAt&&x.createdAt.seconds||0,ay=y.createdAt&&y.createdAt.seconds||0;return ay-ax});
  var now=new Date(),day=0,month=0,year=0,dc=0,mc=0,yc=0;
  a.filter(ok).forEach(function(o){var d=o.createdAt&&o.createdAt.toDate?o.createdAt.toDate():new Date(o.createdAt||0),v=amount(o);if(d.getFullYear()===now.getFullYear()){year+=v;yc++;if(d.getMonth()===now.getMonth()){month+=v;mc++;if(d.getDate()===now.getDate()){day+=v;dc++}}}});
  var boxes=orders.querySelectorAll('.summary>div');[[day,dc],[month,mc],[year,yc]].forEach(function(v,i){if(!boxes[i])return;var b=boxes[i].querySelector('b'),t=boxes[i].querySelector('.time');if(b)b.textContent=v[0].toLocaleString('th-TH')+' บาท';if(t)t.textContent=v[1]+' ออเดอร์สำเร็จ'});
  if(old)old.innerHTML=a.slice(0,100).map(function(o){return '<div class="oldCard"><div class="itemTop"><div><div class="oid">'+esc(o.id)+'</div><div class="time">'+esc(fmt(o.createdAt))+'</div></div><div class="price">'+esc(o.price||0)+' บาท</div></div><div class="rows"><div class="row"><b>รายการ</b>'+esc(o.item||'-')+'</div><div class="row"><b>แพ็ก</b>'+esc(o.pack||'-')+'</div><div class="row"><b>UID / Server</b>'+esc(o.uid||'-')+' / '+esc(o.server||'-')+'</div></div><span class="pill">'+esc(o.shopStatus||o.status||'รอดำเนินการ')+'</span></div>'}).join('');
 });
 var credit=document.querySelector('#credit .panel'),accounts=document.querySelector('#accounts .panel');
 function live(col,cb){db.collection(col).onSnapshot(function(s){cb(s.docs.map(function(d){return Object.assign({id:d.id},d.data())}))},function(e){console.warn(col,e)})}
 live('credit_requests',function(a){if(!credit)return;credit.querySelector('.emptyState')?.remove();var h=credit.querySelector('#prodCredit')||document.createElement('div');h.id='prodCredit';h.innerHTML=a.length?a.map(function(r){return '<div class="item"><div class="itemTop"><div><b>'+esc(r.nickname||r.email||r.memberId||r.id)+'</b><div class="time">'+esc(r.status||'pending')+'</div></div><div class="price">'+Number(r.amount||0).toLocaleString('th-TH')+' บาท</div></div></div>'}).join(''):'<div class="emptyState"><b>ยังไม่มีคำขอเติมเครดิต</b></div>';if(!h.parentNode)credit.appendChild(h)});
 live('members',function(a){if(!accounts)return;accounts.querySelector('.emptyState')?.remove();var h=accounts.querySelector('#prodMembers')||document.createElement('div');h.id='prodMembers';h.innerHTML=a.length?a.map(function(m){return '<div class="item"><div class="itemTop"><div><b>'+esc(m.nickname||m.email||m.id)+'</b><div class="time">'+esc(m.email||m.id)+'</div></div><div class="price">เครดิต '+Number(m.credit||0).toLocaleString('th-TH')+' บาท</div></div></div>'}).join(''):'<div class="emptyState"><b>ยังไม่มีบัญชีสมาชิก</b></div>';if(!h.parentNode)accounts.appendChild(h)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();