(function(){
'use strict';

/*
  YUIMELLKUB V19
  READY STOCK -> CALCULATOR CHECKOUT BRIDGE

  - Ready stock ไม่มี checkout flow ของตัวเองแล้ว
  - ใช้ checkout / payment / slip / success ของ Calculator Preview
  - ไม่ override motion / hover ของการ์ด
*/

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function clean(v){
  return String(v == null ? '' : v).trim();
}

function price(v){

  return Math.max(
    0,
    Number(
      String(v == null ? '' : v)
        .replace(/,/g,'')
        .replace(/[^\d.]/g,'')
    ) || 0
  );
}


/* =========================================================
   SEND BUTTON
   ========================================================= */

function installStyle(){

  if(
    $('#ymkReadyCalcBridgeStyle')
  ){
    return;
  }

  const s =
    document.createElement(
      'style'
    );

  s.id =
    'ymkReadyCalcBridgeStyle';

  /*
    ไม่ใส่ hover / transform / transition การ์ด
    ใช้ Motion ของ Preview เดิมทั้งหมด
  */

  s.textContent = `

    #products
    .ready-stock-card
    .ymk-store-bottom{
      display:flex;
      flex-direction:column;
      gap:7px;
    }

    #products
    .ready-stock-card
    .ymk-store-bottom
    > .ready-stock-order-btn,

    #products
    .ready-stock-card
    .ymk-store-bottom
    > .ymk-send-choice{
      width:100%;
      box-sizing:border-box;
      margin-top:0;
    }

    #products
    .ready-stock-card
    .ymk-send-choice{
      border:1px solid #efbfd1;
      background:#fff7fa;
      color:#c45f87;
    }

    html.ymDark
    #products
    .ready-stock-card
    .ymk-send-choice,

    body.ymDark
    #products
    .ready-stock-card
    .ymk-send-choice{
      background:#382930;
      border-color:#805066;
      color:#efb1c9;
    }

  `;

  document.head
    .appendChild(s);
}


function addSendButton(card){

  if(!card){
    return;
  }

  const normal =
    card.querySelector(
      '.ready-stock-order-btn'
    );

  const bottom =
    card.querySelector(
      '.ymk-store-bottom'
    );

  if(
    !normal ||
    !bottom
  ){
    return;
  }

  const enabled =

    normal.dataset
      .sendEnabled === '1'

    &&

    price(
      normal.dataset
        .sendPrice
    ) > 0;

  let send =
    card.querySelector(
      '.ymk-send-choice'
    );

  if(!enabled){

    if(send){
      send.remove();
    }

    return;
  }

  if(send){
    return;
  }

  send =
    document.createElement(
      'button'
    );

  send.type =
    'button';

  send.className =
    'ymk-send-choice';

  send.textContent =
    'แบบส่ง';

  send.setAttribute(
    'aria-label',
    'สั่งซื้อแบบส่ง'
  );

  bottom.appendChild(
    send
  );
}


function decorate(){

  $$(
    '#products .ready-stock-card'
  ).forEach(
    addSendButton
  );
}


/* =========================================================
   READY PRODUCT DATA
   ========================================================= */

function readyData(
  normal,
  mode
){

  if(
    !normal ||
    normal.disabled
  ){
    return null;
  }

  const card =
    normal.closest(
      '.ready-stock-card'
    );

  if(!card){
    return null;
  }

  const name =
    clean(

      normal.dataset
        .readyName

      ||

      card.querySelector(
        '.ymk-store-name'
      )?.textContent

      ||

      'สินค้า'
    );

  const unit =

    mode === 'send'

      ? price(
          normal.dataset
            .sendPrice
        )

      : price(
          normal.dataset
            .readyPrice
        );

  if(!(unit > 0)){
    return null;
  }

  const pack =

    mode === 'send'

      ? 'แบบส่ง'

      : name;

  return {

    type:
      'echoes',

    item:
      name,

    pack,

    price:
      unit,

    readyStock:
      true,

    productId:
      clean(
        normal.dataset
          .productId
      ),

    category:
      clean(
        normal.dataset
          .readyCategory
      ),

    orderMode:
      mode === 'send'
        ? 'send'
        : 'instant'
  };
}


/* =========================================================
   CALCULATOR FLOW
   ========================================================= */

function calcOrderButton(){

  return (

    $('#ymCalcOrder')

    ||

    $('#ymCalcPopupOrder')

    ||

    $('.ymCalcOrderBtn')

    ||

    $('[data-calc-order]')
  );
}


function openThroughCalculator(
  normal,
  mode
){

  const data =
    readyData(
      normal,
      mode
    );

  if(!data){
    return false;
  }

  /*
    ส่งข้อมูลสินค้าเข้า source-of-truth
    ตัวเดียวกับหมวดคำนวณ
  */

  window.YMK_LAST_CALC = {

    type:
      data.type,

    item:
      data.item,

    pack:
      data.pack,

    price:
      String(
        data.price
      ) +
      ' บาท'
  };


  /*
    เก็บ metadata สำหรับแบบส่ง
  */

  if(
    data.orderMode ===
    'send'
  ){

    window
      .YMK_SEND_SELECTION = {

        mode:
          'send',

        name:
          data.item,

        price:
          data.price,

        total:
          data.price,

        quantity:
          1,

        category:
          data.category,

        productId:
          data.productId
      };


    window
      .YMK_SEND_ORDER_META = {

        mode:
          'send',

        base:
          data.item,

        unit:
          data.price,

        total:
          data.price,

        q:
          1,

        productId:
          data.productId,

        category:
          data.category
      };

  }else{

    window
      .YMK_SEND_SELECTION =
        null;

    window
      .YMK_SEND_ORDER_META =
        null;
  }


  /*
    เรียก Flow ของ Calculator โดยตรง
    ไม่สร้าง Popup / Slip Flow แยกอีก
  */

  const trigger =
    calcOrderButton();

  if(!trigger){

    console.error(
      'YMK V19: calculator order button not found'
    );

    return false;
  }

  trigger.click();

  return true;
}


/* =========================================================
   READY STOCK CLICK
   ========================================================= */

document.addEventListener(
  'click',
  e=>{

    const send =
      e.target.closest?.(
        '.ymk-send-choice'
      );

    if(send){

      const normal =

        send
          .closest(
            '.ready-stock-card'
          )
          ?.querySelector(
            '.ready-stock-order-btn'
          );

      if(!normal){
        return;
      }

      e.preventDefault();

      e.stopPropagation();

      e.stopImmediatePropagation();

      openThroughCalculator(
        normal,
        'send'
      );

      return false;
    }


    const normal =
      e.target.closest?.(
        '.ready-stock-order-btn'
      );

    if(
      !normal

      ||

      normal.closest(
        '#ymkNativeOrderProxyHost'
      )
    ){
      return;
    }

    e.preventDefault();

    e.stopPropagation();

    e.stopImmediatePropagation();

    openThroughCalculator(
      normal,
      'instant'
    );

    return false;

  },
  true
);


/* =========================================================
   KEEP SEND META
   ========================================================= */

document.addEventListener(
  'click',
  e=>{

    if(

      !e.target.closest?.(
        '#ymOrderNext'
      )

      ||

      !document.body
        .classList
        .contains(
          'ymCalcCheckout'
        )
    ){
      return;
    }

    setTimeout(
      ()=>{

        try{

          if(

            window
              .YMK_SEND_SELECTION
              ?.mode ===
            'send'

            &&

            window.lastOrder
          ){

            window
              .lastOrder
              .orderMode =
              'send';

            window
              .lastOrder
              .pack =
              'แบบส่ง';
          }

        }catch(_){}

      },
      0
    );

  },
  false
);


/* =========================================================
   PRODUCT RENDER WATCH
   ========================================================= */

function startProductObserver(){

  const root =
    $('#products');

  if(!root){
    return;
  }

  let queued =
    false;

  new MutationObserver(
    ()=>{

      if(queued){
        return;
      }

      queued =
        true;

      requestAnimationFrame(
        ()=>{

          queued =
            false;

          decorate();
        }
      );

    }
  ).observe(
    root,
    {
      childList:true,
      subtree:true
    }
  );
}


/* =========================================================
   START
   ========================================================= */

function boot(){

  installStyle();

  decorate();

  document.addEventListener(
    'ymk-storefront-products-rendered',
    decorate
  );

  startProductObserver();
}


if(
  document.readyState ===
  'loading'
){

  document.addEventListener(
    'DOMContentLoaded',
    boot,
    {
      once:true
    }
  );

}else{

  boot();
}

})();
