(function(){
var CACHE='ymk_production_products_cache_v2',items=[],active='all';

function clean(v){
  return String(v||'').trim()
}

function esc(v){
  return String(v==null?'':v).replace(/[&<>"']/g,function(c){
    return {
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[c]
  })
}

function label(p){
  return clean(p.categoryLabel||p.category)
}

function cat(p){
  var c=clean(p.category).toLowerCase();
  var l=label(p);

  if(
    c==='echoes'||
    c==='echo'||
    l==='เติมกระดุม'||
    l==='กระดุม'
  ) return 'echoes';

  if(
    c==='skins'||
    l==='เติมสกิน'
  ) return 'skins';

  if(
    c==='accessories'||
    c==='accessory'||
    l==='เติมประดับ'
  ) return 'accessory';

  if(
    l==='แพ็กสกิน'||
    c==='skinpack'
  ) return 'skinpack';

  if(
    l==='สัตว์เลี้ยง'||
    c==='pets'
  ) return 'pets';

  if(
    l==='ห้อง'||
    c==='room'
  ) return 'room';

  return c||l
}

function off(p){
  return (
    p.status==='out'||
    p.status==='paused'||
    (
      !p.unlimitedStock&&
      p.stock!=null&&
      Number(p.stock)<=0
    )
  )
}

function panes(){
  return [].slice.call(
    document.querySelectorAll(
      '.realProductPane[data-product-pane]'
    )
  )
}

function pane(name){
  return document.querySelector(
    '.realProductPane[data-product-pane="'+name+'"]'
  )
}

function grid(p){
  if(!p) return null;

  var g=p.querySelector('.products');

  if(!g){
    p.innerHTML='';
    g=document.createElement('div');
    g.className='products';
    p.appendChild(g)
  }

  return g
}

function card(p){
  var disabled=off(p);

  var status=disabled
    ?(
      p.status==='paused'
        ?'ปิดชั่วคราว'
        :'สินค้าหมด'
    )
    :'พร้อมเติม';

  var img=
    p.image||
    p.imageUrl||
    p.icon||
    '';

  var send=
    p.sendEnabled===true&&
    Number(p.sendPrice||0)>0;

  return (
    '<div '+
      'class="product ready-stock-card ymk-live-product" '+
      'data-product-id="'+esc(p.id)+'" '+
      'data-ready-category="'+esc(p.category||'')+'">'+

      '<div class="gem ymk-live-image">'+
        (
          img
            ?'<img src="'+esc(img)+'" alt="'+esc(p.name||'สินค้า')+'">'
            :'♡'
        )+
      '</div>'+

      '<b>'+
        esc(p.name||'สินค้า')+
      '</b>'+

      '<span class="ready-stock-status ymk-live-status">'+
        status+
      '</span>'+

      '<div class="ymk-store-bottom">'+

        '<div class="price">'+
          Number(p.price||0).toLocaleString('th-TH')+
          ' บาท'+
        '</div>'+

        '<button '+
          'type="button" '+
          'class="ready-stock-order-btn" '+

          'data-ready-name="'+
            esc(p.name||'สินค้า')+
          '" '+

          'data-ready-price="'+
            Number(p.price||0)+
          '" '+

          'data-ready-category="'+
            esc(p.category||'')+
          '" '+

          'data-send-enabled="'+
            (send?'1':'0')+
          '" '+

          'data-send-price="'+
            (
              send
                ?Number(p.sendPrice||0)
                :0
            )+
          '" '+

          (disabled?'disabled':'')+
        '>'+

          (disabled?status:'สั่งซื้อ')+

        '</button>'+

      '</div>'+
    '</div>'
  )
}

function css(){
  if(
    document.getElementById(
      'ymkV65LiveStyle'
    )
  ) return;

  var s=document.createElement('style');

  s.id='ymkV65LiveStyle';

  s.textContent=`

  .realProductPane .products{
    display:grid!important;
    grid-template-columns:
      repeat(4,minmax(0,1fr))!important;
    gap:10px!important;
    width:100%!important;
  }

  .realProductPane .product{
    width:auto!important;
    min-width:0!important;
    max-width:none!important;
    min-height:0!important;

    padding:16px 10px!important;

    border:
      1px solid
      var(--line)!important;

    border-radius:18px!important;

    text-align:center!important;

    background:
      linear-gradient(
        #fff,
        #fff8fb
      )!important;

    box-shadow:none!important;

    display:flex!important;
    flex-direction:column!important;

    box-sizing:border-box!important;
    overflow:hidden!important;
  }

  .ymk-live-image{
    height:74px!important;
    width:100%!important;

    display:flex!important;
    align-items:center!important;
    justify-content:center!important;

    margin:0!important;

    font-size:34px!important;

    background:transparent!important;
    border-radius:0!important;

    overflow:hidden!important;
  }

  .ymk-live-image img{
    width:66px!important;
    height:66px!important;

    max-width:66px!important;
    max-height:66px!important;

    object-fit:contain!important;

    display:block!important;
  }

  .ymk-live-product b{
    display:block!important;

    margin:6px!important;

    line-height:1.35!important;
  }

  .ymk-live-status{
    display:block!important;

    margin:
      2px 0
      4px!important;

    color:#8f6a79!important;

    font-size:13px!important;
  }

  .ymk-live-product
  .ymk-store-bottom{
    margin-top:auto!important;

    display:block!important;

    width:100%!important;
  }

  .ymk-live-product
  .price{
    font-size:20px!important;
    font-weight:900!important;

    color:#d86f99!important;

    margin:
      2px 0
      0!important;

    white-space:normal!important;
  }

  .ymk-live-product
  .ready-stock-order-btn{
    width:100%!important;
    min-width:0!important;

    height:auto!important;

    border:0!important;

    background:
      var(--p)!important;

    color:#fff!important;

    border-radius:10px!important;

    padding:9px!important;

    margin-top:10px!important;

    font-weight:900!important;

    cursor:pointer!important;
  }

  .ymk-live-product
  .ready-stock-order-btn:disabled{
    opacity:.55!important;

    cursor:not-allowed!important;
  }

  .ymk-live-product{
    animation:
      ymkV65ProductIn
      .28s
      ease
      both;
  }

  @keyframes ymkV65ProductIn{
    from{
      opacity:0;
      transform:
        translateY(7px);
    }

    to{
      opacity:1;
      transform:none;
    }
  }

  @media(max-width:780px){

    .realProductPane .products{
      grid-template-columns:
        repeat(
          2,
          minmax(0,1fr)
        )!important;
    }

    .ymk-live-image{
      height:70px!important;
    }

    .ymk-live-image img{
      width:62px!important;
      height:62px!important;

      max-width:62px!important;
      max-height:62px!important;
    }

  }

  `;

  document.head.appendChild(s)
}

function rows(name){
  return items
    .filter(function(p){
      return (
        p.visible!==false&&
        (
          name==='all'||
          cat(p)===name
        )
      )
    })
    .sort(function(a,b){

      var categoryOrder=
        Number(a.categoryOrder||999)-
        Number(b.categoryOrder||999);

      if(categoryOrder){
        return categoryOrder
      }

      return (
        Number(a.order||0)-
        Number(b.order||0)
      )
    })
}

function render(){
  css();

  /*
    "ทั้งหมด" ใช้ pane กระดุมเป็นพื้นที่แสดง
    แต่เอาสินค้าทุกหมวดมารวมกัน
  */
  var target=
    active==='all'
      ?'echoes'
      :active;

  var p=pane(target);

  if(!p) return;

  panes().forEach(function(x){
    x.classList.toggle(
      'on',
      x===p
    )
  });

  var g=grid(p);

  if(!g) return;

  var list=rows(active);

  g.innerHTML=
    list.length
      ?list.map(card).join('')
      :(
        '<div class="categoryPlaceholder">'+
          '<b>♡ ยังไม่มีสินค้า</b>'+
        '</div>'
      );

  /*
    ให้ระบบปุ่ม "แบบส่ง"
    ตรวจสินค้าที่ render ใหม่
  */
  document.dispatchEvent(
    new CustomEvent(
      'ymk-storefront-products-rendered',
      {
        detail:{
          count:list.length,
          category:active
        }
      }
    )
  )
}

function bind(){

  document.addEventListener(
    'click',
    function(e){

      var b=
        e.target.closest(
          '.catbar [data-maincat]'
        );

      if(!b) return;

      active=
        clean(b.dataset.maincat)||
        'all';

      setTimeout(
        render,
        0
      )
    },
    true
  )
}

function loadCache(){
  try{

    var a=
      JSON.parse(
        localStorage.getItem(CACHE)||
        '[]'
      );

    if(
      Array.isArray(a)&&
      a.length
    ){
      items=a;

      window.YMK_PRODUCTION_PRODUCTS=
        items;

      render()
    }

  }catch(e){}
}

function connect(){

  if(
    !window.firebase||
    !firebase.firestore
  ){
    setTimeout(
      connect,
      120
    );

    return
  }

  firebase
    .firestore()
    .collection('products')
    .onSnapshot(
      function(snapshot){

        items=
          snapshot.docs.map(
            function(doc){

              return Object.assign(
                {
                  id:doc.id
                },
                doc.data()
              )
            }
          );

        window.YMK_PRODUCTION_PRODUCTS=
          items;

        /*
          cache เฉพาะข้อมูลสินค้า
          Production จริง
        */
        try{
          localStorage.setItem(
            CACHE,
            JSON.stringify(items)
          )
        }catch(e){}

        render()
      },

      function(error){
        console.warn(
          'production products failed',
          error
        )
      }
    )
}

function boot(){

  css();

  bind();

  /*
    โหลดสินค้าจริงล่าสุดจาก cache ก่อน
    แล้ว Firestore sync ตามหลัง
  */
  loadCache();

  connect();

  /*
    เผื่อ UI v65 สร้าง pane
    หลัง script เริ่มทำงาน
  */
  setTimeout(
    render,
    150
  );

  setTimeout(
    render,
    400
  )
}

if(
  document.readyState===
  'loading'
){
  document.addEventListener(
    'DOMContentLoaded',
    boot
  )
}else{
  boot()
}

})();
