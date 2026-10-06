(function(){
var auth=null,db=null,profile=null,history=[],requests=[],orders=[],unsubs=[];
function q(s){return document.querySelector(s)}function qa(s){return Array.from(document.querySelectorAll(s))}
function money(n){return '฿'+Number(n||0).toLocaleString('th-TH')}
function stop(){unsubs.forEach(function(x){try{x()}catch(e){}});unsubs=[]}
function render(){
 var guest=q('#guestMember'),logged=q('#loggedMember');if(guest)guest.hidden=!!profile;if(logged)logged.hidden=!profile;
 document.documentElement.classList.toggle('ymGuestSession',!profile);
 qa('[data-ym-order-pay="credit"]').forEach(function(b){b.hidden=!profile;b.style.display=profile?'':'none'});
 if(!profile)return;
 if(q('#memberName'))q('#memberName').textContent=profile.nickname||'สมาชิก Yuimellkub';
 if(q('#memberEmail'))q('#memberEmail').textContent=profile.email||'';
 qa('[data-wallet]').forEach(function(x){x.textContent=money(profile.credit)});
 var h=q('#walletHistory');if(h)h.innerHTML=history.length?history.map(function(x){return '<div><span>'+(x.label||x.type||'รายการเครดิต')+'</span><b>'+(Number(x.amount||0)>0?'+':'')+money(x.amount||0)+'</b></div>'}).join(''):'<div style="display:block;text-align:center;color:#a77b8b">ยังไม่มีประวัติเครดิต</div>';
 var ob=q('#memberOrders');if(ob)ob.innerHTML=orders.length?orders.map(function(o){return '<div class="card"><b>'+o.id+'</b><div class="ymMini"><div class="ymOrderDetailItem">'+(o.item||'-')+' · '+String(o.price||'-')+'</div><div>แพ็กที่เติม: '+(o.pack||'-')+'</div><div>UID: '+(o.uid||'-')+' · Server: '+(o.server||'-')+'</div></div><div class="ymStatus">สถานะ: '+(o.shopStatus||o.paymentStatus||'รอดำเนินการ')+'</div></div>'}).join(''):'<div class="card" style="text-align:center;color:#a77b8b">ยังไม่มีออเดอร์ในบัญชีนี้</div>';
 var st=q('#ymCreditReviewStatus'),pending=requests.find(function(x){return x.status==='pending'}),submit=q('#creditSubmit');if(submit)submit.disabled=!!pending;if(st&&pending){st.className='ymCreditReviewStatus show pending';st.textContent='ส่งสลิปเรียบร้อยแล้ว • กำลังรอร้านตรวจสอบ '+money(pending.amount)}
}
function watch(u){stop();if(!u){profile=null;history=[];requests=[];orders=[];render();return}
 unsubs.push(db.collection('members').doc(u.uid).onSnapshot(function(s){profile=s.exists?Object.assign({id:u.uid,email:u.email||''},s.data()):{id:u.uid,email:u.email||'',nickname:u.displayName||'',credit:0};render()}));
 unsubs.push(db.collection('credit_history').where('memberId','==',u.uid).onSnapshot(function(s){history=s.docs.map(function(d){return Object.assign({id:d.id},d.data())});render()},function(){}));
 unsubs.push(db.collection('credit_requests').where('memberId','==',u.uid).onSnapshot(function(s){requests=s.docs.map(function(d){return Object.assign({id:d.id},d.data())});render()},function(){}));
 unsubs.push(db.collection('orders').where('memberId','==',u.uid).onSnapshot(function(s){orders=s.docs.map(function(d){return Object.assign({id:d.id},d.data())});render()},function(){}));
}
function compress(file){return new Promise(function(resolve,reject){var r=new FileReader();r.onerror=function(){reject(Error('อ่านรูปสลิปไม่สำเร็จ'))};r.onload=function(){var im=new Image();im.onerror=function(){reject(Error('เปิดรูปสลิปไม่สำเร็จ'))};im.onload=function(){var max=1400,sc=Math.min(1,max/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(im.width*sc));cv.height=Math.max(1,Math.round(im.height*sc));cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);var quality=.82,data=cv.toDataURL('image/jpeg',quality);while(data.length>500000&&quality>.38){quality-=.08;data=cv.toDataURL('image/jpeg',quality)}if(data.length>520000)return reject(Error('รูปสลิปใหญ่เกินไป กรุณาใช้รูปที่เล็กลง'));resolve(data)};im.src=String(r.result||'')};r.readAsDataURL(file)})}
function boot(){if(!window.firebase||!firebase.auth||!firebase.firestore||!window.YUIMELLKUB_FIREBASE_CONFIG)return setTimeout(boot,250);try{if(!firebase.apps.length)firebase.initializeApp(window.YUIMELLKUB_FIREBASE_CONFIG)}catch(e){}auth=firebase.auth();db=firebase.firestore();window.YMK_MEMBER_PRODUCTION=true;
 if(window.YMPreviewStore){YMPreviewStore.me=function(){return profile};YMPreviewStore.history=function(){return history};YMPreviewStore.requests=function(){return requests}}
 window.addEventListener('click',async function(e){var b=e.target&&e.target.closest&&e.target.closest('#registerBtn,#loginBtn,#logoutBtn,#creditSubmit');if(!b)return;e.preventDefault();e.stopImmediatePropagation();
  try{
   if(b.id==='registerBtn'){var p=q('#regPass').value,p2=q('#regPass2').value,n=q('#regName').value.trim(),em=q('#regEmail').value.trim();if(p!==p2)throw Error('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกันค่ะ');var cr=await auth.createUserWithEmailAndPassword(em,p);await cr.user.updateProfile({displayName:n});await db.collection('members').doc(cr.user.uid).set({nickname:n,email:em,credit:0,status:'active',createdAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});}
   if(b.id==='loginBtn'){await auth.signInWithEmailAndPassword(q('#loginEmail').value.trim(),q('#loginPass').value);if(typeof window.ymMemberToast==='function')window.ymMemberToast('เข้าสู่ระบบสำเร็จ ♡','ยินดีต้อนรับกลับมา');}
   if(b.id==='logoutBtn'){await auth.signOut();}
   if(b.id==='creditSubmit'){if(!auth.currentUser)throw Error('กรุณาเข้าสู่ระบบก่อนค่ะ');var amt=Math.floor(Number(q('#creditAmount')&&q('#creditAmount').value)||0),file=q('#creditSlip')&&q('#creditSlip').files&&q('#creditSlip').files[0];if(!(amt>0))throw Error('กรุณากรอกจำนวนเครดิตที่ต้องการเติมค่ะ');if(!file)throw Error('กรุณาแนบสลิปชำระเงินก่อนส่งตรวจสอบค่ะ');if(requests.some(function(x){return x.status==='pending'}))throw Error('มีรายการเติมเครดิตที่กำลังรอตรวจสอบอยู่แล้วค่ะ');b.disabled=true;var data=await compress(file),ref=db.collection('credit_requests').doc();await ref.set({memberId:auth.currentUser.uid,nickname:profile&&profile.nickname||'',email:auth.currentUser.email||'',amount:amt,slipName:file.name||'slip.jpg',slipData:data,status:'pending',createdAt:firebase.firestore.FieldValue.serverTimestamp()});var st=q('#ymCreditReviewStatus');if(st){st.className='ymCreditReviewStatus show pending';st.textContent='ส่งสลิปเรียบร้อยแล้ว • กำลังรอร้านตรวจสอบ '+money(amt)}}
  }catch(err){alert(err.message||String(err));if(b.id==='creditSubmit')b.disabled=false}
 },true);
 auth.onAuthStateChanged(watch);
}
boot();
})();