importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyB2_JvGY-ttHw-32yYZO3FMDsW8R5S6BSE',
  authDomain: 'yuimellkub-topup.firebaseapp.com',
  projectId: 'yuimellkub-topup',
  storageBucket: 'yuimellkub-topup.firebasestorage.app',
  messagingSenderId: '858747570015',
  appId: '1:858747570015:web:314732a955dec360df18ea'
});

const messaging=firebase.messaging();

messaging.onBackgroundMessage(payload=>{
  const data=payload?.data||{};
  const notification=payload?.notification||{};
  const title=notification.title||data.title||'Yuimellkub • มีสลิปรอตรวจสอบ 🔔';
  const body=notification.body||data.body||'มีออเดอร์ใหม่รอร้านยืนยันสลิป';
  const orderId=data.orderId||'';
  self.registration.showNotification(title,{
    body,
    tag:orderId?'ymk-slip-'+orderId:'ymk-slip-'+Date.now(),
    renotify:true,
    data:{url:data.url||'/yuimellkub-topup/admin.html',orderId}
  });
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=new URL(event.notification?.data?.url||'/yuimellkub-topup/admin.html',self.location.origin).href;
  event.waitUntil((async()=>{
    const clientsList=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of clientsList){
      if(client.url.includes('/yuimellkub-topup/admin.html')){
        await client.focus();
        return;
      }
    }
    if(clients.openWindow)await clients.openWindow(target);
  })());
});
