(function(){
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function norm(v){v=String(v||'echoes').toLowerCase();if(v==='skin')return'skins';if(v==='accessories')return'accessory';return v}
function boot(){
 if(!window.firebase||!firebase.firestore)return setTimeout(boot,200);
 var db=firebase.firestore();
 db.collection('products').onSnapshot(function(s){
  var all=s.docs.map(function(d){return Object.assign({id:d.id},d.data())}).filter(function(p){return p.visible!==false}).sort(function(a,b){return Number(a.order||0)-Number(b.order||0)});
  var groups={};all.forEach(function(p){var k=norm(p.category);(groups[k]||(groups[k]=[])).push(p)});
  Object.keys(groups).forEach(function(cat){
   var pane=document.querySelector('[data-product-pane="'+cat+'"]')||document.querySelector('[data-product-pane="'+(cat==='accessory'?'accessories':cat)+'"]');if(!pane)return;
   var box=pane.querySelector('.products');if(!box){box=document.createElement('div');box.className='products';pane.innerHTML='';pane.appendChild(box)}
   var rows=groups[cat];
   if(cat==='echoes'){
    var cards=[].slice.call(box.querySelectorAll('.product'));
    rows.forEach(function(p,i){
     var card=cards[i];if(!card)return;
     card.dataset.productId=p.id;card.dataset.category=cat;
     var gem=card.querySelector('.gem'),name=card.querySelector('b'),price=card.querySelector('.price'),btn=card.querySelector('button'); card.dataset.readyCategory=p.category||'echoes';
     if(gem){gem.innerHTML=p.image?'<img src="'+esc(p.image)+'" alt="'+esc(p.name||'สินค้า')+'">':'<span class="echoFallback">◉</span>';gem.classList.add('liveImage')}
     if(name)name.textContent=p.name||'สินค้า';if(price)price.textContent='฿'+Number(p.price||0).toLocaleString('th-TH');
     var disabled=p.status==='out'||p.status==='paused'||(!p.unlimitedStock&&p.stock!=null&&Number(p.stock)<=0);
     if(btn){btn.classList.add('ready-stock-order-btn');btn.dataset.readyName=p.name||'สินค้า';btn.dataset.readyPrice=String(Number(p.price||0));btn.dataset.readyCategory=p.category||'echoes';btn.dataset.sendEnabled=p.sendEnabled===true?'1':'0';btn.dataset.sendPrice=String(Number(p.sendPrice||0));btn.disabled=disabled;btn.textContent=disabled?(p.status==='paused'?'ปิดชั่วคราว':'หมดชั่วคราว'):'สั่งซื้อ'}
    });
    cards.slice(rows.length).forEach(function(x){x.style.display='none'});
   }else{
    box.innerHTML=rows.map(function(p){var disabled=p.status==='out'||p.status==='paused'||(!p.unlimitedStock&&p.stock!=null&&Number(p.stock)<=0);return '<div class="product" data-product-id="'+esc(p.id)+'"><div class="gem liveImage">'+(p.image?'<img src="'+esc(p.image)+'" alt="'+esc(p.name||'สินค้า')+'">':'<span class="echoFallback">◉</span>')+'</div><b>'+esc(p.name||'สินค้า')+'</b><div class="price">฿'+Number(p.price||0).toLocaleString('th-TH')+'</div><button '+(disabled?'disabled':'')+'>'+ (disabled?'หมดชั่วคราว':'สั่งซื้อ')+'</button></div>'}).join('');
   }
  });
  document.querySelectorAll('.gem.liveImage').forEach(function(g){g.style.height='54px';g.style.display='flex';g.style.alignItems='center';g.style.justifyContent='center';var im=g.querySelector('img');if(im){im.style.maxWidth='54px';im.style.maxHeight='54px';im.style.objectFit='contain'}});
  window.YMK_PRODUCTION_PRODUCTS=all;
 });
}
boot();
})();