(function(){

const CACHE = 'ymk_production_products_cache_v3';

let items = [];
let active = 'all';

const clean = v => String(v || '').trim();

const esc = v =>
  String(v == null ? '' : v).replace(
    /[&<>"']/g,
    c => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[c])
  );


/* =========================
   CATEGORY
========================= */

function key(p){

  const c = clean(p.category).toLowerCase();
  const l = clean(p.categoryLabel);

  if(
    c === 'echoes' ||
    c === 'echo' ||
    l === 'เติมกระดุม' ||
    l === 'กระดุม'
  ){
    return 'echoes';
  }

  if(
    c === 'skins' ||
    l === 'เติมสกิน'
  ){
    return 'skins';
  }

  if(
    c === 'accessories' ||
    c === 'accessory' ||
    l === 'เติมประดับ'
  ){
    return 'accessory';
  }

  if(l === 'แพ็กสกิน'){
    return 'skinpack';
  }

  if(l === 'สัตว์เลี้ยง'){
    return 'pets';
  }

  if(l === 'ห้อง'){
    return 'room';
  }

  return c || l;
}


/* =========================
   STOCK
========================= */

function unavailable(p){

  return (
    p.status === 'out' ||
    p.status === 'paused' ||
    (
      !p.unlimitedStock &&
      p.stock != null &&
      Number(p.stock) <= 0
    )
  );
}


/* =========================
   PRODUCT CARD
   ใช้โครงหน้าตาของ Preview V65
========================= */

function card(p){

  const bad = unavailable(p);

  const img =
    p.image ||
    p.imageUrl ||
    p.icon ||
    '';

  const send =
    p.sendEnabled === true &&
    Number(p.sendPrice || 0) > 0;

  return `
    <div
      class="product ymk-production-card"
      data-product-id="${esc(p.id)}"
      data-ready-category="${esc(p.category || '')}"
    >

      ${
        img
        ? `
          <div class="gem ymk-production-image">
            <img
              src="${esc(img)}"
              alt="${esc(p.name || 'สินค้า')}"
            >
          </div>
        `
        : `
          <div class="gem">♡</div>
        `
      }

      <b>
        ${esc(p.name || 'สินค้า')}
      </b>

      <div class="price">
        ฿${Number(p.price || 0).toLocaleString('th-TH')}
      </div>

      <button
        type="button"

        class="ready-stock-order-btn"

        data-ready-name="${esc(p.name || 'สินค้า')}"

        data-ready-price="${Number(p.price || 0)}"

        data-ready-category="${esc(p.category || '')}"

        data-send-enabled="${send ? '1' : '0'}"

        data-send-price="${
          send
          ? Number(p.sendPrice || 0)
          : 0
        }"

        ${bad ? 'disabled' : ''}
      >

        ${
          bad
          ? (
              p.status === 'paused'
              ? 'ปิดชั่วคราว'
              : 'สินค้าหมด'
            )
          : 'สั่งซื้อ'
        }

      </button>

    </div>
  `;
}


/* =========================
   PRODUCT PANE
========================= */

function pane(name){

  return document.querySelector(
    `.realProductPane[data-product-pane="${name}"]`
  );
}


function ensureGrid(p){

  let g =
    p &&
    p.querySelector('.products');

  if(p && !g){

    p.innerHTML = '';

    g = document.createElement('div');

    g.className = 'products';

    p.appendChild(g);
  }

  return g;
}


/* =========================
   FILTER PRODUCTS
========================= */

function list(){

  return items

    .filter(p =>

      p.visible !== false &&

      (
        active === 'all' ||
        key(p) === active
      )

    )

    .sort((a,b) =>

      Number(a.categoryOrder || 999) -
      Number(b.categoryOrder || 999)

      ||

      Number(a.order || 0) -
      Number(b.order || 0)

    );
}


/* =========================
   RENDER
========================= */

function render(){

  /*
    หน้า "ทั้งหมด"
    ใช้พื้นที่ pane echoes
    แต่เอาสินค้าทุกหมวดมาแสดง
  */

  const target =
    active === 'all'
    ? 'echoes'
    : active;

  const p = pane(target);

  if(!p){
    return;
  }


  document
    .querySelectorAll(
      '.realProductPane[data-product-pane]'
    )
    .forEach(x => {

      x.classList.toggle(
        'on',
        x === p
      );

    });


  const g = ensureGrid(p);

  const rows = list();


  g.innerHTML =

    rows.length

    ? rows
        .map(card)
        .join('')

    : `
        <div class="categoryPlaceholder">

          <b>
            ♡ ยังไม่มีสินค้า
          </b>

        </div>
      `;


  /*
    แจ้งระบบอื่นว่า
    สินค้าจริง render แล้ว

    เช่น:
    - แบบส่ง
    - popup
    - order system
  */

  document.dispatchEvent(

    new CustomEvent(

      'ymk-storefront-products-rendered',

      {
        detail:{
          count:rows.length,
          category:active
        }
      }

    )

  );

}


/* =========================
   STYLE
   ไม่สร้างดีไซน์การ์ดใหม่
   ใช้ CSS ของ Preview V65
========================= */

function style(){

  if(
    document.getElementById(
      'ymkProductionV12'
    )
  ){
    return;
  }


  const s =
    document.createElement(
      'style'
    );


  s.id =
    'ymkProductionV12';


  s.textContent = `

    .ymk-production-card{

      animation:
        ymkProdIn
        .28s
        ease
        both;

    }


    .ymk-production-image{

      height:72px!important;

      display:flex!important;

      align-items:center!important;

      justify-content:center!important;

      overflow:hidden!important;

    }


    .ymk-production-image img{

      width:66px!important;

      height:66px!important;

      max-width:66px!important;

      max-height:66px!important;

      object-fit:contain!important;

      display:block!important;

    }


    .ymk-production-card button:disabled{

      opacity:.55!important;

      cursor:not-allowed!important;

    }


    @keyframes ymkProdIn{

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

  `;


  document.head.appendChild(s);

}


/* =========================
   CATEGORY BUTTONS
========================= */

function bind(){

  document.addEventListener(

    'click',

    e => {

      const b =
        e.target.closest(
          '.catbar [data-maincat]'
        );


      if(!b){
        return;
      }


      active =
        clean(
          b.dataset.maincat
        )
        ||
        'all';


      document
        .querySelectorAll(
          '.catbar [data-maincat]'
        )
        .forEach(x => {

          x.classList.toggle(
            'on',
            x === b
          );

        });


      setTimeout(
        render,
        0
      );

    },

    true

  );

}


/* =========================
   CACHE
   เก็บเฉพาะสินค้าจริง
========================= */

function cached(){

  try{

    const a =
      JSON.parse(

        localStorage.getItem(
          CACHE
        )

        ||

        '[]'

      );


    if(
      Array.isArray(a) &&
      a.length
    ){

      items = a;

      window.YMK_PRODUCTION_PRODUCTS =
        items;

      render();

    }

  }
  catch(e){}

}


/* =========================
   FIRESTORE
========================= */

function connect(){

  if(
    !window.firebase ||
    !firebase.firestore
  ){

    setTimeout(
      connect,
      120
    );

    return;
  }


  firebase
    .firestore()
    .collection('products')
    .onSnapshot(

      snapshot => {

        items =
          snapshot.docs.map(

            doc =>
              Object.assign(

                {
                  id:doc.id
                },

                doc.data()

              )

          );


        window.YMK_PRODUCTION_PRODUCTS =
          items;


        try{

          localStorage.setItem(

            CACHE,

            JSON.stringify(
              items
            )

          );

        }
        catch(e){}


        render();

      },


      error => {

        console.warn(
          'production products failed',
          error
        );

      }

    );

}


/* =========================
   START
========================= */

function boot(){

  style();

  bind();

  /*
    ให้สินค้าจริงที่ cache ไว้
    ขึ้นก่อน
  */

  cached();


  /*
    แล้ว sync Production
    จาก Firestore
  */

  connect();


  /*
    เผื่อ Preview V65
    สร้าง pane ช้ากว่า script
  */

  setTimeout(
    render,
    150
  );

  setTimeout(
    render,
    400
  );

}


if(
  document.readyState ===
  'loading'
){

  document.addEventListener(
    'DOMContentLoaded',
    boot
  );

}
else{

  boot();

}

})();
