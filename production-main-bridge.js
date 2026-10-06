(function(){
 function start(){
  if(!window.firebase||!firebase.firestore||!window.YUIMELLKUB_FIREBASE_CONFIG)return setTimeout(start,200);
  try{if(!firebase.apps.length)firebase.initializeApp(window.YUIMELLKUB_FIREBASE_CONFIG)}catch(e){}
  var db=firebase.firestore();window.YMK_PRODUCTION_DB=db;
  document.documentElement.setAttribute('data-ymk-production','1');
  document.querySelectorAll('.preview,[class*="preview-badge"]').forEach(function(x){if(/preview/i.test(x.textContent||''))x.style.display='none'});
  db.collection('products').onSnapshot(function(s){window.YMK_PRODUCTION_PRODUCTS=s.docs.map(function(d){return Object.assign({id:d.id},d.data())});document.dispatchEvent(new CustomEvent('ymk-production-products',{detail:window.YMK_PRODUCTION_PRODUCTS}))});
  window.ymkProductionTrack=function(id,cb){if(!id)return function(){};return db.collection('order_status').doc(String(id)).onSnapshot(function(s){if(s.exists)cb(Object.assign({id:s.id},s.data()))})};
 }
 start();
})();