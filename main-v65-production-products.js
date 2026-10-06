(function(){
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function norm(v){v=String(v||'echoes').trim().toLowerCase();var m={
 'skin':'skins','สกิน':'skins','costume':'skins','costumes':'skins',
 'accessories':'accessory','เครื่องประดับ':'accessory','ประดับ':'accessory',
 'pet':'pets','สัตว์เลี้ยง':'pets','pets':'pets',
 'room':'room','rooms':'room','ห้อง':'room','เฟอร์นิเจอร์':'room',
 'echo':'echoes','กระดุม':'echoes','แพ็กกระดุม':'echoes',
 'all':'all','ทั้งหมด':'all'
};return m[v]||v}
function disabled(p){return p.status==='out'||p.status==='paused'||(!p.unlimitedStock&&p.stock!=null&&Number(p.stock)<=0)}
function card(p,cat){
 var off=disabled(p),label=off?(p.status==='paused'?'ปิดชั่วคราว':'สินค้าหมด'):'สั่งซื้อ';
 return '<div class="product ready-stock-card" data-product-id="'+esc(p.id)+'" data-ready-category="'+esc(p.category||cat)+'"><div class="gem liveImage">'+(p.image?'<img src="'+esc(p.image)+'" alt="'+esc(p.name||'สินค้า')+'">':'<span class="echoFallback">◉</span>')+'</div><b>'+esc(p.name||'สินค้า')+'</b><div class="price">฿'+Number(p.price||0).toLocaleString('th-TH')+'</div><button class="ready-stock-order-btn" data-ready-name="'+esc(p.name||'สินค้า')+'" data-ready-price="'+Number(p.price||0)+'" data-ready-category="'+esc(p.category||cat)+'" data-send-enabled="'+(p.sendEnabled===true?'1':'0')+'" data-send-price="'+Number(p.sendPrice||0)+'" '+(off?'disabled':'')+'>'+label+'</button></div>'
}
function boxFor(pane){var b=pane.querySelector('.products');if(!b){b=document.createElement('div');b.className='products';pane.innerHTML='';pane.appendChild(b)}return b}
function clearPreview(){
 document.querySelectorAll('.products').forEach(function(b){if(b.dataset.ymkProduction!=='1'){b.innerHTML='';b.dataset.ymkProduction='1'}});
}
function boot(){
 if(!window.firebase||!firebase.firestore)return setTimeout(boot,200);
 clearPreview();
 firebase.firestore().collection('products').onSnapshot(function(s){
  var all=s.docs.map(function(d){return Object.assign({id:d.id},d.data())}).filter(function(p){return p.visible!==false}).sort(function(a,b){return Number(a.order||0)-Number(b.order||0)});
  var groups={};all.forEach(function(p){var k=norm(p.category);(groups[k]||(groups[k]=[])).push(p)});
  var panes=[].slice.call(document.querySelectorAll('[data-product-pane]'));
  if(!panes.length){
   document.querySelectorAll('.productPane,.product-pane,[data-category]').forEach(function(p){if(panes.indexOf(p)<0)panes.push(p)});
  }
  panes.forEach(function(pane){
   var key=norm(pane.getAttribute('data-product-pane')||pane.getAttribute('data-category')||pane.dataset.category),rows=key==='all'?all:(groups[key]||[]);
   var box=boxFor(pane);box.dataset.ymkProduction='1';box.innerHTML=rows.map(function(p){return card(p,norm(p.category))}).join('');
   if(key==='all'){box.style.maxHeight='520px';box.style.overflowY='auto';box.style.overscrollBehavior='contain';box.style.paddingRight='4px'}
  });
  document.querySelectorAll('.gem.liveImage').forEach(function(g){g.style.height='54px';g.style.display='flex';g.style.alignItems='center';g.style.justifyContent='center';var im=g.querySelector('img');if(im){im.style.maxWidth='54px';im.style.maxHeight='54px';im.style.objectFit='contain'}});
  window.YMK_PRODUCTION_PRODUCTS=all;
  document.dispatchEvent(new CustomEvent('ymk-storefront-products-rendered',{detail:{count:all.length}}));
 });
}
boot();
})();