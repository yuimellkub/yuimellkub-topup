(function(){
var CACHE='ymk_production_products_cache_v1',items=[],activeLabel='ทั้งหมด';
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function clean(v){return String(v||'').trim()}
function labelOf(p){return clean(p.categoryLabel||p.category||'เติมกระดุม')}
function isEcho(p){var c=clean(p.category).toLowerCase(),l=labelOf(p);return c==='echoes'||c==='echo'||l==='เติมกระดุม'||l==='กระดุม'}
function sameCategory(p,label){label=clean(label);if(label==='ทั้งหมด')return true;var pl=labelOf(p),c=clean(p.category);if(pl===label||c===label)return true;if(label==='เติมกระดุม')return isEcho(p);return false}
function off(p){return p.status==='out'||p.status==='paused'||(!p.unlimitedStock&&p.stock!=null&&Number(p.stock)<=0)}
function host(){
 var title=[].slice.call(document.querySelectorAll('h1,h2,h3,h4,b,strong,div,span')).find(function(x){var t=clean(x.textContent);return t==='🎀 สินค้าพร้อมเติม'||t==='สินค้าพร้อมเติม'});
 if(!title)return null;
 var root=title.closest('section,.card,.panel,[class*="ready"],[class*="stock"]')||title.parentElement;if(!root)return null;
 var b=root.querySelector('.ymk-production-products');if(!b){b=document.createElement('div');b.className='products ymk-production-products';root.appendChild(b)}
 root.querySelectorAll('.products:not(.ymk-production-products)').forEach(function(x){x.style.setProperty('display','none','important')});
 return b
}
function card(p){
 var disabled=off(p),status=disabled?(p.status==='paused'?'ปิดชั่วคราว':'สินค้าหมด'):'พร้อมเติม';
 var send=p.sendEnabled===true&&Number(p.sendPrice||0)>0,img=p.image||p.imageUrl||p.icon||'';
 return '<article class="product ready-stock-card'+(disabled?' is-soldout':'')+'" data-product-id="'+esc(p.id)+'" data-ready-category="'+esc(p.category||'')+'">'+
 '<div class="ymk-prod-image">'+(img?'<img src="'+esc(img)+'" alt="'+esc(p.name||'สินค้า')+'">':'<span class="ymk-no-image">◉</span>')+'</div>'+
 '<b class="ymk-prod-name">'+esc(p.name||'สินค้า')+'</b><span class="ready-stock-status ymk-prod-status">'+status+'</span>'+
 '<div class="ymk-store-bottom"><strong class="ymk-store-price">'+Number(p.price||0).toLocaleString('th-TH')+' บาท</strong>'+
 '<button type="button" class="ready-stock-order-btn" data-ready-name="'+esc(p.name||'สินค้า')+'" data-ready-price="'+Number(p.price||0)+'" data-ready-category="'+esc(p.category||'')+'" data-send-enabled="'+(send?'1':'0')+'" data-send-price="'+(send?Number(p.sendPrice):0)+'" '+(disabled?'disabled':'')+'>'+(disabled?status:'สั่งซื้อ')+'</button></div></article>'
}
function style(){
 if(document.getElementById('ymkProdV9Style'))return;var s=document.createElement('style');s.id='ymkProdV9Style';
 s.textContent='.ymk-production-products{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(155px,1fr))!important;gap:10px!important;opacity:1;transform:none}.ymk-production-products.ymk-refreshing .ready-stock-card{animation:ymkIn .28s ease both}@keyframes ymkIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}.ymk-production-products .ready-stock-card{box-sizing:border-box!important;min-width:0!important;overflow:hidden!important}.ymk-prod-image{height:86px!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;margin:4px auto 8px!important}.ymk-prod-image img{width:68px!important;height:68px!important;max-width:68px!important;max-height:68px!important;object-fit:contain!important;display:block!important}.ymk-no-image{font-size:48px;color:#e38caf}.ymk-prod-name{display:block}.ymk-prod-status{display:inline-flex;margin:6px 0}.ymk-store-bottom{margin-top:auto;display:flex;align-items:center;gap:8px;justify-content:space-between}.ymk-store-price{white-space:nowrap}.ymk-production-products.ymk-all{max-height:520px;overflow-y:auto;overscroll-behavior:contain;padding-right:4px}@media(max-width:699px){.ymk-production-products{grid-template-columns:repeat(2,minmax(0,1fr))!important}.ymk-prod-image{height:82px!important}.ymk-prod-image img{width:64px!important;height:64px!important;max-width:64px!important;max-height:64px!important}}';
 document.head.appendChild(s)
}
function render(animate){
 var b=host();if(!b)return;style();var rows=items.filter(function(p){return p.visible!==false&&sameCategory(p,activeLabel)}).sort(function(a,z){return Number(a.categoryOrder||999)-Number(z.categoryOrder||999)||Number(a.order||0)-Number(z.order||0)});
 b.classList.toggle('ymk-all',activeLabel==='ทั้งหมด');b.innerHTML=rows.map(card).join('');
 if(animate){b.classList.remove('ymk-refreshing');void b.offsetWidth;b.classList.add('ymk-refreshing');setTimeout(function(){b.classList.remove('ymk-refreshing')},350)}
 document.dispatchEvent(new CustomEvent('ymk-storefront-products-rendered',{detail:{count:rows.length,category:activeLabel}}))
}
function tabLabel(t){var x=clean(t&&t.textContent);return /^(ทั้งหมด|เติมกระดุม|แพ็กสกิน|สัตว์เลี้ยง|ห้อง|เติมสกิน|เติมประดับ)$/.test(x)?x:''}
function bind(){
 document.addEventListener('click',function(e){var t=e.target.closest('button,a');if(!t)return,l=tabLabel(t);if(!l)return;activeLabel=l;setTimeout(function(){render(false)},0)},true)
}
function cacheLoad(){try{var a=JSON.parse(localStorage.getItem(CACHE)||'[]');if(Array.isArray(a)&&a.length){items=a;render(false)}}catch(e){}}
function boot(){
 style();bind();cacheLoad();
 function connect(){if(!window.firebase||!firebase.firestore)return setTimeout(connect,120);firebase.firestore().collection('products').onSnapshot(function(s){items=s.docs.map(function(d){return Object.assign({id:d.id},d.data())});window.YMK_PRODUCTION_PRODUCTS=items;try{localStorage.setItem(CACHE,JSON.stringify(items))}catch(e){}render(true)},function(e){console.warn('production products failed',e)})}
 connect()
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot()
})();