(function(){
'use strict';

/*
  YUIMELLKUB PRODUCTION V21
  - backend fields อยู่ใน hidden host
  - ไม่รบกวน layout
  - store-hours notice ไม่จับ field backend
  - Ready stock ใช้ Flow เดียวกับ Calculator
  - Member UI ตาม Firebase Auth
  - ส่งสลิปเข้า backend ก่อนขึ้น Pending
  - Tracking ใช้ Firestore จริง
*/

const $=
  s=>document.querySelector(s);

const $$=
  s=>[
    ...document.querySelectorAll(s)
  ];

const esc=
  v=>String(v??'')
    .replace(
      /[&<>"']/g,
      c=>({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#39;'
      }[c])
    );

const num=
  v=>{

    const m=
      String(v??'')
        .replace(
          /,/g,
          ''
        )
        .match(
          /\d+(?:\.\d+)?/
        );


    return (
      m
        ? Number(m[0])
        : 0
    );
  };

const fmt=
  n=>
    Math.round(
      Number(n)||
      0
    )
    .toLocaleString(
      'th-TH'
    );


let readyMeta=
  null;

window.YMK_ORDER_SOURCE=
  window.YMK_ORDER_SOURCE||
  null;
  
window.YMK_CALC_LOCKED_ORDER=
  window.YMK_CALC_LOCKED_ORDER||
  null;
let lastStatusText=
  '';


/* =========================================================
   CARD / MOTION
   ========================================================= */
function installStyle(){

  if(
    $('#ymkProductionV21Style')
  ){
    return;
  }

  const s=
    document.createElement(
      'style'
    );

  s.id=
    'ymkProductionV21Style';

  s.textContent=`

    #ymkBackendCompatHost{
      display:none!important;
      width:0!important;
      height:0!important;
      overflow:hidden!important;
      visibility:hidden!important;
      pointer-events:none!important;
    }

    /*
      การ์ดสินค้าใช้ CSS / Motion จาก Preview เดิม
      Production ไม่บังคับขนาดการ์ดซ้ำ
    */

    #products
    .ready-stock-card
    .ymk-send-choice{
      border:
        1px solid
        #efbfd1;

      background:
        #fff7fa;

      color:
        #c45f87;
    }

    html.ymDark
    #products
    .ready-stock-card
    .ymk-send-choice,

    body.ymDark
    #products
    .ready-stock-card
    .ymk-send-choice{
      background:
        #382930;

      border-color:
        #805066;

      color:
        #efb1c9;
    }

    #ymkForceCard,
    #ymkFinalOrderStatusCard{
      display:
        none!important;
    }

    .ymk-track-proof{
      margin-top:
        12px;

      padding:
        11px;

      border:
        1px solid
        #f0ccda;

      border-radius:
        13px;

      background:
        #fff8fb;
    }

    .ymk-track-proof-grid{
      display:
        grid;

      grid-template-columns:
        repeat(
          3,
          minmax(0,1fr)
        );

      gap:
        7px;

      margin-top:
        8px;
    }

    .ymk-track-proof-grid img{
      display:
        block;

      width:
        100%;

      aspect-ratio:
        1/1;

      object-fit:
        cover;

      border-radius:
        9px;

      cursor:
        pointer;

      background:
        #fff;
    }

    .ymk-track-save{
      width:
        100%;

      min-height:
        42px;

      margin-top:
        9px;

      border:
        0;

      border-radius:
        11px;

      background:
        #df76a0;

      color:
        #fff;

      font:
        inherit;

      font-size:
        12px;

      font-weight:
        900;

      cursor:
        pointer;
    }

    .ymk-track-problem{
      margin-top:
        10px;

      padding:
        11px;

      border:
        1px solid
        #efbfd0;

      border-radius:
        12px;

      background:
        #fff2f6;

      color:
        #9d5870;

      line-height:
        1.65;

      text-align:
        center;
    }

    .ymk-track-problem a{
      display:
        block;

      margin-top:
        8px;

      padding:
        9px 11px;

      border-radius:
        10px;

      background:
        #df76a0;

      color:
        #fff;

      text-decoration:
        none;

      font-weight:
        900;
    }

    .ymk-proof-viewer{
      position:
        fixed;

      inset:
        0;

      z-index:
        9999999;

      display:
        flex;

      align-items:
        center;

      justify-content:
        center;

      padding:
        20px;

      background:
        rgba(
          60,
          34,
          46,
          .76
        );
    }

    .ymk-proof-viewer img{
      max-width:
        94vw;

      max-height:
        90vh;

      object-fit:
        contain;

      border-radius:
        12px;

      background:
        #fff;
    }

  `;

  document.head
    .appendChild(s);
}

  



  




/* =========================================================
   BACKEND COMPAT HOST
   ========================================================= */

function backendHost(){

  let host=
    $('#ymkBackendCompatHost');


  if(!host){

    host=
      document.createElement(
        'div'
      );


    host.id=
      'ymkBackendCompatHost';


    host.setAttribute(
      'aria-hidden',
      'true'
    );


    document.body
      .appendChild(
        host
      );
  }


  return host;
}


function ensureLegacyFields(){

  const host=
    backendHost();


  const moveOrMake=(
    tag,
    id
  )=>{

    let el=
      $('#'+id);


    if(!el){

      el=
        document.createElement(
          tag
        );


      el.id=
        id;
    }


    if(
      el.parentElement !==
      host
    ){

      host.appendChild(
        el
      );
    }


    return el;
  };


  moveOrMake(
    'input',
    'orderUid'
  );


  moveOrMake(
    'input',
    'orderName'
  );


  let server=
    $('#orderServer');


  if(!server){

    server=
      document.createElement(
        'select'
      );


    server.id=
      'orderServer';


    server.innerHTML=

      '<option value="Asia">Asia</option>'+

      '<option value="NA-EU">NA-EU</option>'+

      '<option value="อื่น ๆ">อื่น ๆ</option>';
  }


  if(
    server.parentElement !==
    host
  ){

    host.appendChild(
      server
    );
  }


  const file=
    moveOrMake(
      'input',
      'slipFile'
    );


  file.type=
    'file';


  file.accept=
    'image/*';


  file.dataset
    .ymkBackendOnly=
    '1';


  const status=
    moveOrMake(
      'div',
      'adminSaveStatus'
    );


  status.dataset
    .ymkBackendOnly=
    '1';


  const badNotice=
    $('#ymkStoreHoursNotice');


  if(

    badNotice

    &&

    (
      badNotice.parentElement ===
      document.body

      ||

      badNotice.closest(
        '#ymkBackendCompatHost'
      )
    )

  ){

    badNotice.remove();
  }
}


/* =========================================================
   MEMBER AUTH
   ========================================================= */

function syncMemberUI(
  user
){

  const logged=
    !!user;


  const guest=
    $('#guestMember');


  const member=
    $('#loggedMember');


  if(guest){

    guest.hidden=
      logged;


    guest.style
      .setProperty(
        'display',
        logged
          ? 'none'
          : '',
        'important'
      );
  }


  if(member){

    member.hidden=
      !logged;


    member.style
      .setProperty(
        'display',
        logged
          ? ''
          : 'none',
        'important'
      );
  }


  document.documentElement
    .classList
    .toggle(
      'ymGuestSession',
      !logged
    );


  $$(
    '[data-ym-order-pay="credit"]'
  ).forEach(
    btn=>{

      btn.hidden=
        !logged;


      btn.style
        .setProperty(
          'display',
          logged
            ? ''
            : 'none',
          'important'
        );
    }
  );


  if(
    logged

    &&

    $('#memberEmail')
  ){

    $('#memberEmail')
      .textContent=
      user.email||
      '';
  }
}


function startMemberSync(){

  const start=()=>{

    if(
      !window.firebase

      ||

      !firebase.auth
    ){

      setTimeout(
        start,
        120
      );


      return;
    }


    firebase
      .auth()
      .onAuthStateChanged(
        user=>{

          syncMemberUI(
            user
          );


          requestAnimationFrame(
            ()=>syncMemberUI(
              user
            )
          );


          setTimeout(
            ()=>syncMemberUI(
              user
            ),
            180
          );
        }
      );
  };


  start();
}


/* =========================================================
   READY STOCK -> CALCULATOR
   ========================================================= */

function price(v){

  return Math.max(
    0,
    num(v)
  );
}


function addSendButton(card){

  const normal=
    card?.querySelector(
      '.ready-stock-order-btn'
    );


  const bottom=
    card?.querySelector(
      '.ymk-store-bottom'
    );


  if(
    !normal ||
    !bottom
  ){
    return;
  }


  const enabled=

    normal.dataset
      .sendEnabled ===
      '1'

    &&

    price(
      normal.dataset
        .sendPrice
    ) > 0;


  let send=
    card.querySelector(
      '.ymk-send-choice'
    );


  if(!enabled){

    send?.remove();

    return;
  }


  if(send){
    return;
  }


  send=
    document.createElement(
      'button'
    );


  send.type=
    'button';


  send.className=
    'ymk-send-choice';


  send.textContent=
    'แบบส่ง';


  bottom.appendChild(
    send
  );
}


function decorateCards(){

  $$(
    '#products .ready-stock-card'
  ).forEach(
    addSendButton
  );
}


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


  const card=
    normal.closest(
      '.ready-stock-card'
    );


  if(!card){
    return null;
  }


  const name=
    String(

      normal.dataset
        .readyName

      ||

      card.querySelector(
        '.ymk-store-name'
      )?.textContent

      ||

      'สินค้า'

    ).trim();


  const unit=

    mode ===
    'send'

      ? price(
          normal.dataset
            .sendPrice
        )

      : price(
          normal.dataset
            .readyPrice
        );


  if(!(unit>0)){
    return null;
  }


  return {

    item:
      name,

    pack:
      mode ===
      'send'
        ? 'แบบส่ง'
        : name,

    price:
      unit,

    orderMode:
      mode ===
      'send'
        ? 'send'
        : 'instant',

    productId:
      normal.dataset
        .productId||
      '',

    category:
      normal.dataset
        .readyCategory||
      ''
  };
}


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


function readyPackForUI(
  x,
  qty
){

  if(!x){
    return '';
  }

  if(
    x.orderMode ===
    'send'
  ){
    return 'แบบส่ง';
  }

  const m=
    String(
      x.item||
      ''
    )
      .match(
        /(\d[\d,]*)\s*(?:กระดุม|echoes?)/i
      );

  if(m){

    return (
      Number(
        m[1]
          .replace(
            /,/g,
            ''
          )
      )
      .toLocaleString(
        'th-TH'
      )
      +
      ' × '
      +
      qty
    );
  }

  /*
    สกิน / ประดับ / แพ็ก / สัตว์เลี้ยง / ห้อง:
    ห้ามดึงแพ็กคำนวณเก่ามาปน
  */
  return (
    x.item||
    x.pack||
    ''
  );
}


function syncReadyCheckoutUI(){

  if(
    window.YMK_ORDER_SOURCE !==
    'ready'
  ){
    return;
  }

  const x=
    readyMeta;

  if(!x){
    return;
  }

  const qty=
    Math.max(
      1,
      Number(
        $('#ymOrderQty')
          ?.value||
        1
      )
    );

  const total=
    Number(
      x.price||
      0
    )
    *
    qty;

  const pack=
    readyPackForUI(
      x,
      qty
    );

  window.YMK_ACTIVE_PRODUCT_ORDER={
    mode:
      x.orderMode,
    name:
      x.item,
    price:
      Number(
        x.price||
        0
      ),
    total,
    quantity:
      qty,
    pack,
    productId:
      x.productId,
    category:
      x.category
  };

  window.lastOrder={
    item:
      x.item,
    pack,
    price:
      fmt(total)+
      ' บาท',
    quantity:
      qty,
    orderMode:
      x.orderMode,
    productId:
      x.productId,
    category:
      x.category
  };

  window.YMK_LAST_CALC={
    type:
      'ready',
    item:
      x.item,
    pack,
    price:
      total,
    ready:
      true,
    orderMode:
      x.orderMode,
    productId:
      x.productId,
    category:
      x.category
  };

  window.YMK_CALC_CHECKOUT_STATE={
    ...window.YMK_LAST_CALC
  };

  // Single immutable checkout snapshot for all payment methods.
  window.YMK_CHECKOUT_ORDER = {
    source: 'ready',
    item: x.item,
    pack,
    price: total,
    quantity: qty,
    productId: x.productId,
    category: x.category,
    orderMode: x.orderMode
  };


  const selected=
    $('#ymOrderSelected');

  if(selected){

    selected.innerHTML=
      '<b>'+
      esc(x.item)+
      (
        qty>1
          ? ' × '+qty
          : ''
      )+
      '</b>'+
      (
        pack
          ? '<span class="ymPackLine">แพ็กที่เติม: '+
            esc(pack)+
            '</span>'
          : ''
      )+
      '<br>ราคา '+
      fmt(total)+
      ' บาท';
  }

  const amount=
    $('#ymOrderAmount');

  if(amount){

    amount.textContent=
      fmt(total)+
      ' บาท';
  }

  const summary=
    $('#ymOrderSummary');

  if(summary){

    const uid=
      String(
        $('#ymOrderUid')
          ?.value||
        ''
      ).trim();

    const server=
      String(
        $('#ymOrderServer')
          ?.value||
        'Asia'
      ).trim();

    const name=
      String(
        $('#ymOrderName')
          ?.value||
        ''
      ).trim();

    summary.innerHTML=
      '<b>'+
      esc(x.item)+
      (
        qty>1
          ? ' × '+qty
          : ''
      )+
      '</b>'+
      (
        pack
          ? '<span class="ymPackLine">แพ็กที่เติม: '+
            esc(pack)+
            '</span>'
          : ''
      )+
      '<br>UID: '+
      esc(uid||'-')+
      ' • Server: '+
      esc(server)+
      (
        name
          ? '<br>ชื่อ: '+
            esc(name)
          : ''
      );
  }
}


function openReadyViaCalculator(
  normal,
  mode
){

  const x=
    readyData(
      normal,
      mode
    );


  if(!x){
    return false;
  }


  /*
    READY STOCK = source of truth ของรอบล่าสุด
  */
  window.YMK_ORDER_SOURCE=
    'ready';

  readyMeta=
    null;

  window.lastOrder=
    null;

  window.YMK_LAST_CALC=
    null;

  window.YMK_CALC_CHECKOUT_STATE=
    null;

  window.YMK_SEND_SELECTION=
    null;

  window.YMK_SEND_ORDER_META=
    null;

  window.YMK_ACTIVE_PRODUCT_ORDER=
    null;

document.body.classList.remove(
  'ymCalcCheckout'
);



  readyMeta=
    {
      ...x
    };


  window.YMK_ACTIVE_PRODUCT_ORDER={
    mode:
      x.orderMode,
    name:
      x.item,
    price:
      x.price,
    total:
      x.price,
    quantity:
      1,
    pack:
      x.pack,
    productId:
      x.productId,
    category:
      x.category
  };


  window.YMK_LAST_CALC={

    type:
      'ready',

    item:
      x.item,

    pack:
      x.pack,

    price:
      fmt(
        x.price
      )+
      ' บาท'
  };


  if(
    x.orderMode ===
    'send'
  ){

    window
      .YMK_SEND_SELECTION={

        mode:
          'send',

        name:
          x.item,

        price:
          x.price,

        total:
          x.price,

        quantity:
          1,

        category:
          x.category,

        productId:
          x.productId
      };


    window
      .YMK_SEND_ORDER_META={

        mode:
          'send',

        base:
          x.item,

        unit:
          x.price,

        total:
          x.price,

        q:
          1,

        category:
          x.category,

        productId:
          x.productId
      };

  }else{

    window
      .YMK_SEND_SELECTION=
        null;


    window
      .YMK_SEND_ORDER_META=
        null;
  }


 const qty=
  $('#ymOrderQty');

if(qty){
  qty.value='1';
}

syncReadyCheckoutUI();

const overlay=
  $('#ymProductOrderOverlay');

if(!overlay){

  console.error(
    'YMK V21: product order overlay not found'
  );

  return false;
}

overlay.classList.add(
  'show'
);

return true;
  }

document.addEventListener(
  'click', 
  e=>{

    const send=
      e.target.closest?.(
        '.ymk-send-choice'
      );


    if(send){

      const normal=

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


      openReadyViaCalculator(
        normal,
        'send'
      );


      return false;
    }


    const normal=
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


    openReadyViaCalculator(
      normal,
      'instant'
    );


    return false;

  },
  true
);


function clearReadyProductState(){

  readyMeta=null;

  window.YMK_ACTIVE_PRODUCT_ORDER=null;
  window.YMK_SEND_SELECTION=null;
  window.YMK_SEND_ORDER_META=null;
  window.YMK_CALC_CHECKOUT_STATE=null;

  window.lastOrder=null;
  window.YMK_LAST_CALC=null;
  window.YMK_PENDING_ORDER_META=null;
  window.YMK_FORCED_PACK_META=null;
  if(
  typeof window.YMK_CLEAR_READY_PACK_PATCH ===
  'function'
){
  window.YMK_CLEAR_READY_PACK_PATCH();
}

  const selected=
    $('#ymOrderSelected');

  if(selected){
    selected.innerHTML='';
  }

  const summary=
    $('#ymOrderSummary');

  if(summary){
    summary.innerHTML='';
  }
}
/* =========================================================
   READY / CALCULATOR STATE
   ========================================================= */

/*
  Ready Stock:
  sync ข้อมูลเข้าหน้าชำระเงินตอนกด "ไปชำระเงิน" เท่านั้น

  ห้าม sync ซ้ำตอนกด QR / ธนาคาร / Wallet / เครดิต
  เพราะจะทำให้ Payment UI กระตุก
*/
window.addEventListener(
  'click',
  e=>{

    if(!readyMeta){
      return;
    }

    if(
      !e.target.closest?.(
        '#ymOrderNext'
      )
    ){
      return;
    }

    syncReadyCheckoutUI();

    requestAnimationFrame(
      ()=>{
        syncReadyCheckoutUI();
      }
    );

  },
  true
);


/*
  เปลี่ยนจำนวนสินค้า Ready Stock
*/
document.addEventListener(
  'input',
  e=>{

    if(
      readyMeta &&
      e.target?.id === 'ymOrderQty'
    ){
      syncReadyCheckoutUI();
    }

  },
  true
);


window.addEventListener(
  'click',
  e=>{

    const next=
      e.target.closest?.(
        '#ymOrderNext'
      );

    if(!next || !readyMeta){
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    syncReadyCheckoutUI();

    const orderOverlay=
      $('#ymProductOrderOverlay');

    const paymentOverlay=
      $('#ymProductPaymentOverlay');

    if(!paymentOverlay){
      console.error(
        'YMK: payment overlay not found'
      );
      return;
    }

    orderOverlay?.classList.remove(
      'show'
    );

    paymentOverlay.classList.add(
      'show'
    );

    return false;

  },
  true
);


window.addEventListener(
  'click',
  e=>{

    const calcBtn=
      e.target.closest?.(
        '#ymCalcOrder,'+
        '#ymCalcPopupOrder,'+
        '.ymCalcOrderBtn,'+
        '[data-calc-order]'
      );

    if(
      !calcBtn ||
      !e.isTrusted
    ){
      return;
    }

 
window.YMK_ORDER_SOURCE = 'calc';
window.YMK_CHECKOUT_ORDER = null;

// ยกเลิกข้อมูลล็อกจาก Calculator รอบก่อน
window.YMK_CALC_LOCKED_ORDER = null;

// ใช้ผล Calculator ล่าสุดเป็นต้นทาง
const calcResult = window.YMK_CALC_RESULT;

if (
  calcResult &&
  calcResult.item &&
  num(calcResult.price) > 0
) {
  window.YMK_CALC_LOCKED_ORDER = {
    item: String(calcResult.item),
    pack: String(calcResult.pack || ''),
    price: num(calcResult.price)
  };
  window.YMK_CHECKOUT_ORDER = {
    source: 'calc',
    ...window.YMK_CALC_LOCKED_ORDER
  };
} else {
  console.error(
    'YMK Calculator: ไม่พบผลคำนวณล่าสุดที่ถูกต้อง'
  );
}

readyMeta=null;

/*
  ออกจาก Ready Stock แล้ว:
  ล้าง metadata ของสินค้าพร้อมเติมเก่า
  แต่ห้ามล้าง lastOrder เพราะ Calculator จะใช้ตัวนี้
*/
window.YMK_SEND_SELECTION=null;
window.YMK_SEND_ORDER_META=null;
window.YMK_PENDING_ORDER_META=null;
window.YMK_ACTIVE_PRODUCT_ORDER=null;
window.YMK_CALC_CHECKOUT_STATE=null;
window.YMK_FORCED_PACK_META=null;

if(
  typeof window.YMK_CLEAR_READY_PACK_PATCH ===
  'function'
){
  window.YMK_CLEAR_READY_PACK_PATCH();
}

  },
  true
);
document.addEventListener(
  'click',
  e=>{

    const payBtn=
      e.target.closest?.(
        '[data-ym-order-pay]'
      );

    if(!payBtn){
      return;
    }

    requestAnimationFrame(
      ()=>{
const order=
  window.YMK_ORDER_SOURCE === 'calc'
    ? window.YMK_CALC_LOCKED_ORDER
    : window.lastOrder;

        if(!order){
          return;
        }

        /*
          Calculator:
          ยึดราคา + รายการ + แพ็ก
          จาก lastOrder รอบปัจจุบันเท่านั้น
        */
        if(
          window.YMK_ORDER_SOURCE ===
          'calc'
        ){

          const amount=
            $('#ymOrderAmount');

          const summary=
            $('#ymOrderSummary');

          const price=
            num(
              order.price
            );

          if(
            amount &&
            price > 0
          ){
            amount.textContent=
              fmt(price)+
              ' บาท';
          }

          if(summary){

            const uid=
              String(
                $('#ymOrderUid')
                  ?.value||
                ''
              ).trim();

            const server=
              String(
                $('#ymOrderServer')
                  ?.value||
                'Asia'
              ).trim();

            const name=
              String(
                $('#ymOrderName')
                  ?.value||
                ''
              ).trim();

            summary.innerHTML=
              '<b>'+
              esc(
                order.item||
                ''
              )+
              '</b>'+
              (
                order.pack
                  ? '<span class="ymPackLine">แพ็กที่เติม: '+
                    esc(order.pack)+
                    '</span>'
                  : ''
              )+
              '<br>UID: '+
              esc(uid||'-')+
              ' • Server: '+
              esc(server)+
              (
                name
                  ? '<br>ชื่อ: '+
                    esc(name)
                  : ''
              );
          }

          /*
            กัน script อื่นเอาราคา Ready เก่า
            กลับมาเขียนทับหลังเปลี่ยนช่องทางจ่าย
          */
          setTimeout(
            ()=>{

             const current=
  window.YMK_ORDER_SOURCE === 'calc'
    ? window.YMK_CALC_LOCKED_ORDER
    : window.lastOrder;

              if(
                !current ||
                window.YMK_ORDER_SOURCE !==
                'calc'
              ){
                return;
              }

              const amount=
                $('#ymOrderAmount');

              const price=
                num(
                  current.price
                );

              if(
                amount &&
                price > 0
              ){
                amount.textContent=
                  fmt(price)+
                  ' บาท';
              }

            },
            100
          );

          setTimeout(
            ()=>{

              
const current =
  window.YMK_CALC_LOCKED_ORDER;
  

              if(
                !current ||
                window.YMK_ORDER_SOURCE !==
                'calc'
              ){
                return;
              }

              const amount=
                $('#ymOrderAmount');

              const price=
                num(
                  current.price
                );

              if(
                amount &&
                price > 0
              ){
                amount.textContent=
                  fmt(price)+
                  ' บาท';
              }

            },
            300
          );
        }

      }
    );

  },
  true
);
/* =========================================================
   SLIP SUBMIT
   ========================================================= */

function copySlipToLegacy(){

  const source=
    $('#ymOrderSlip');


  const target=
    $('#slipFile');


  if(
    !source?.files?.[0]

    ||

    !target
  ){
    return false;
  }


  try{

    const dt=
      new DataTransfer();


    [...source.files]
      .forEach(
        f=>dt.items.add(f)
      );


    target.files=
      dt.files;


    return true;

  }catch(e){

    console.error(
      'copy slip failed',
      e
    );


    return false;
  }
}


// Keep all payment tabs bound to the same current order.
// The existing checkout controls, payment providers, and submit handlers remain unchanged.
function showUnifiedPaymentOrder(){
  const o = window.YMK_CHECKOUT_ORDER;
  if (!o || !(Number(o.price) > 0)) return;
  if (window.YMK_ORDER_SOURCE !== o.source) return;
  const amount = $('#ymOrderAmount');
  if (amount) amount.textContent = fmt(o.price) + ' บาท';
  const summary = $('#ymOrderSummary');
  if (!summary) return;
  const uid = String($('#ymOrderUid')?.value || '').trim();
  const server = String($('#ymOrderServer')?.value || 'Asia').trim();
  const name = String($('#ymOrderName')?.value || '').trim();
  summary.innerHTML = '<b>' + esc(o.item) +
    (o.source === 'ready' && o.quantity > 1 ? ' × ' + o.quantity : '') +
    '</b>' + (o.pack ? '<span class="ymPackLine">แพ็กที่เติม: ' + esc(o.pack) + '</span>' : '') +
    '<br>UID: ' + esc(uid || '-') + ' • Server: ' + esc(server) +
    (name ? '<br>ชื่อ: ' + esc(name) : '');
}
document.addEventListener('click', e => {
  if (!e.target.closest?.('[data-ym-order-pay]')) return;
  queueMicrotask(showUnifiedPaymentOrder);
  requestAnimationFrame(showUnifiedPaymentOrder);
  setTimeout(showUnifiedPaymentOrder, 80);
}, true);

function activePayment(){

  return (

    document.querySelector(
      '[data-ym-order-pay].on'
    )
      ?.dataset
      ?.ymOrderPay

    ||

    'qr'
  );
}


function prepareProductionSubmit(){

  ensureLegacyFields();


  $('#orderUid').value=
    $('#ymOrderUid')
      ?.value
      ?.trim()
    ||
    '';


  $('#orderName').value=
    $('#ymOrderName')
      ?.value
      ?.trim()
    ||
    '';


  $('#orderServer').value=
    $('#ymOrderServer')
      ?.value
    ||
    'Asia';


  copySlipToLegacy();


  window.getPaymentMethod=
    ()=>activePayment();


  if (window.YMK_ORDER_SOURCE === 'calc') {
    const order = window.YMK_CHECKOUT_ORDER;
    if (!order || !(order.price > 0)) {
      throw new Error('ไม่มีผล Calculator ที่ถูกต้องสำหรับสร้างออเดอร์');
    }
    window.lastOrder = {
      item: order.item,
      pack: order.pack,
      price: fmt(order.price) + ' บาท',
      quantity: 1
    };
    window.YMK_LAST_CALC = { ...order };
  }

  if(
    readyMeta && window.YMK_ORDER_SOURCE === 'ready'
  ){

    const qty=
      Math.max(
        1,
        Number(
          $('#ymOrderQty')
            ?.value ||
          1
        )
      );

    const total=
      Number(
        readyMeta.price ||
        0
      ) *
      qty;

    const pack=
      readyPackForUI(
        readyMeta,
        qty
      );

    window.YMK_ACTIVE_PRODUCT_ORDER={
      mode:
        readyMeta.orderMode,
      name:
        readyMeta.item,
      price:
        Number(
          readyMeta.price ||
          0
        ),
      total,
      quantity:
        qty,
      pack,
      productId:
        readyMeta.productId,
      category:
        readyMeta.category
    };

    window.lastOrder=
      window.lastOrder ||
      {};

    window.lastOrder.item=
      readyMeta.item;


    window.lastOrder.pack=
      window.YMK_ACTIVE_PRODUCT_ORDER
        .pack;


    window.lastOrder.price=
      fmt(
        window.YMK_ACTIVE_PRODUCT_ORDER
          .total
      )+
      ' บาท';


    window.lastOrder.orderMode=
      readyMeta.orderMode;


    window.lastOrder.productId=
      readyMeta.productId;


    window.lastOrder.category=
      readyMeta.category;
  }
}


function showSubmitError(
  text
){

  const st=
    $('#ymOrderStatus');


  if(!st){
    return;
  }


  st.className=
    'ymOrderStatus show';


  st.textContent=
    text;
}


function showPending(){

  const st=
    $('#ymOrderStatus');


  if(!st){
    return;
  }


  st.className=
    'ymOrderStatus show ok ymCalcPendingV33';


  st.innerHTML=

    '<div class="ymSlipCheck">✓</div>'+

    '<div class="ymSlipTitle">ส่งสลิปเรียบร้อยแล้ว ♡</div>'+

    '<div class="ymSlipSub">กำลังรอร้านตรวจสอบสลิป</div>'+

    '<div class="ymSlipReceived">ร้านได้รับสลิปในระบบแล้ว ไม่ต้องส่งซ้ำนะคะ ♡</div>'+

    '<div class="ymSlipReceived" style="margin-top:8px">หลังตรวจสอบเรียบร้อย ระบบจะแสดงเลขออเดอร์สำหรับติดตามสถานะตามปกติ</div>'+

    '<div class="ymSlipNote"><b>หมายเหตุ ♡</b><br>หากรอตรวจสอบเกินประมาณ <b>5–10 นาที</b> สามารถทักเพจหรือ LINE เพื่อแจ้งแอดมินตรวจสอบได้นะคะ ♡</div>'+

    '<div class="ymSlipContacts">'+

      '<a href="https://m.me/yuimellkubtopup" target="_blank" rel="noopener">ทักเพจ</a>'+

      '<a href="https://line.me/R/ti/p/@205svvxv" target="_blank" rel="noopener">ทัก LINE</a>'+

    '</div>';
}


function showApproved(
  id
){

  const st=
    $('#ymOrderStatus');


  if(!st){
    return;
  }


  st.className=
    'ymOrderStatus show ok ymSlipApprovedDone';


  const isSend=

    readyMeta
      ?.orderMode ===
      'send'

    ||

    window
      .YMK_SEND_SELECTION
      ?.mode ===
      'send'

    ||

    window.lastOrder
      ?.orderMode ===
      'send';


  st.innerHTML=

    '<div class="ymSlipCheck">✓</div>'+

    '<div class="ymSlipTitle">ยืนยันสลิปเรียบร้อยแล้ว ♡</div>'+

    '<div class="ymSlipSub">สร้างออเดอร์เข้าสู่ระบบเรียบร้อยแล้ว</div>'+

    '<div class="ymUIdLabel">เลขออเดอร์ของคุณ</div>'+

    '<b class="ymUId">'+
      esc(id)+
    '</b>'+

    (
      isSend

      ? '<div class="ymSlipReceived" style="margin-top:11px">รบกวนลูกค้าทักเพจร้าน พร้อมแจ้งเลขออเดอร์ <b>'+
        esc(id)+
        '</b> เพื่อให้ทางร้านดำเนินการแบบส่งต่อค่ะ ♡</div>'

      : ''
    )+

    '<div class="ymUActions">'+

      '<button type="button" class="ymOrderBack" data-v21-copy="'+
        esc(id)+
      '">คัดลอกเลขออเดอร์</button>'+

      '<button type="button" class="ymOrderNext" data-v21-new>ทำรายการออเดอร์ใหม่</button>'+

    '</div>';
}


window.addEventListener(
  'pointerdown',
  e=>{

    const btn=
      e.target.closest?.(
        '#ymOrderSubmit'
      );


    if(!btn){
      return;
    }


    if(
      activePayment() ===
      'credit'
    ){
      return;
    }


    btn.id=
      'ymOrderSubmitProdV21';

  },
  true
);


window.addEventListener(
  'click',
  async e=>{

    const btn=
      e.target.closest?.(
        '#ymOrderSubmitProdV21'
      );


    if(!btn){
      return;
    }


    e.preventDefault();

    e.stopPropagation();

    e.stopImmediatePropagation();


    const slip=
      $('#ymOrderSlip')
        ?.files?.[0];


    if(!slip){

      showSubmitError(
        'กรุณาแนบสลิปชำระเงินก่อนส่งตรวจสอบ'
      );


      btn.id=
        'ymOrderSubmit';


      return false;
    }


    if(
      !$('#ymOrderUid')
        ?.value
        ?.trim()
    ){

      showSubmitError(
        'กรุณากรอก UID / ID ผู้เล่น'
      );


      btn.id=
        'ymOrderSubmit';


      return false;
    }


    prepareProductionSubmit();


    if(
      typeof window
        .saveOrderToDemoAdmin !==
      'function'
    ){

      showSubmitError(
        'ระบบหลังบ้านยังโหลดไม่เสร็จ กรุณาลองใหม่อีกครั้ง'
      );


      btn.id=
        'ymOrderSubmit';


      return false;
    }


    btn.disabled=
      true;


    try{

      const ok=
        await window
          .saveOrderToDemoAdmin();


      if(
        ok !== true
      ){

        btn.disabled=
          false;


        btn.id=
          'ymOrderSubmit';


        return false;
      }


      showPending();

    }catch(err){

      console.error(
        'YMK V21 production submit failed',
        err
      );


      showSubmitError(
        'ส่งสลิปไม่สำเร็จ: '+
        (
          err?.message ||
          'กรุณาลองใหม่อีกครั้ง'
        )
      );


      btn.disabled=
        false;
    }


    btn.id=
      'ymOrderSubmit';


    return false;

  },
  true
);


/* =========================================================
   ADMIN STATUS
   ========================================================= */

function syncProductionStatus(){

  const source=
    $('#adminSaveStatus');


  if(!source){
    return;
  }


  const text=
    String(
      source.textContent ||
      ''
    ).trim();


  if(
    !text

    ||

    text ===
    lastStatusText
  ){
    return;
  }


  lastStatusText=
    text;


if(
  /สลิปไม่ผ่าน|ตรวจสอบสลิปไม่สำเร็จ|แนบสลิป.*ใหม่/
    .test(text)
){

  const st=
    $('#ymOrderStatus');

  const slip=
    $('#ymOrderSlip');

  const submit=
    $('#ymOrderSubmitProdV21') ||
    $('#ymOrderSubmit');

  if(slip){
    slip.value='';
  }

  $('#ymOrderSlipPreview')
    ?.replaceChildren();

  if(submit){

    submit.disabled=false;

    if(
      submit.id ===
      'ymOrderSubmitProdV21'
    ){
      submit.id=
        'ymOrderSubmit';
    }
  }

  if(st){

    st.className=
      'ymOrderStatus show';

    st.innerHTML=
      '<div class="ymSlipTitle">สลิปไม่ผ่าน</div>'+
      '<div class="ymSlipReceived" style="margin-top:8px">'+
        'กรุณาแนบสลิปที่ถูกต้อง แล้วส่งให้ร้านตรวจสอบใหม่อีกครั้งนะคะ ♡'+
      '</div>';
  }

  lastStatusText='';

  return;
}


if(
  /มีปัญหา|ผิดพลาด/
    .test(text)
){

  const st=
    $('#ymOrderStatus');

  if(st){

    st.className=
      'ymOrderStatus show';

    st.innerHTML=

      '<div class="ymSlipTitle">ออเดอร์มีปัญหา</div>'+

      '<div class="ymSlipReceived" style="margin-top:8px">'+
        esc(text)+
      '</div>'+

      '<div class="ymSlipNote">รบกวนติดต่อเข้ามาทางเพจเพื่อให้ทางร้านตรวจสอบและทำรายการใหม่ให้นะคะ ♡</div>'+

      '<div class="ymSlipContacts">'+

        '<a href="https://m.me/yuimellkubtopup" target="_blank" rel="noopener">ติดต่อเพจร้าน</a>'+

      '</div>';
  }

  return;
}


  const id=
    (
      text.match(
        /YMK\d{6}-\d{6}/
      )
      ||
      []
    )[0];


  if(
    id

    &&

    /ส่งออเดอร์เข้าระบบแล้ว|ยืนยันสลิป|เลขออเดอร์/
      .test(text)
  ){

    showApproved(
      id
    );


    return;
  }


  if(
    /รอร้านตรวจสอบ|กำลังรอร้านตรวจสอบ|ส่งสลิปแล้ว|กำลังส่งสลิป/
      .test(text)
  ){

    showPending();
  }
}


function startStatusWatch(){

  ensureLegacyFields();


  const source=
    $('#adminSaveStatus');


  if(!source){
    return;
  }


  new MutationObserver(
    syncProductionStatus
  ).observe(
    source,
    {
      childList:true,
      subtree:true,
      characterData:true
    }
  );


  syncProductionStatus();
}


/* =========================================================
   COPY / NEW ORDER
   ========================================================= */

document.addEventListener(
  'click',
  e=>{

    const copy=
      e.target.closest?.(
        '[data-v21-copy]'
      );


    if(copy){

      const id=
        copy.dataset
          .v21Copy;


      const done=()=>{

        const old=
          copy.textContent;


        copy.textContent=
          'คัดลอกแล้ว ✓';


        setTimeout(
          ()=>{

            if(
              copy.isConnected
            ){

              copy.textContent=
                old;
            }

          },
          900
        );
      };


      if(
        navigator.clipboard
          ?.writeText
      ){

        navigator.clipboard
          .writeText(id)
          .then(done)
          .catch(()=>{});
      }


      return;
    }


    if(
      e.target.closest?.(
        '[data-v21-new]'
      )
    ){

      readyMeta=
        null;


      lastStatusText=
        '';


      window.lastOrder=
        null;


      window.YMK_LAST_CALC=
        null;


      window.YMK_SEND_SELECTION=
        null;


      window.YMK_SEND_ORDER_META=
        null;


      const st=
        $('#ymOrderStatus');


      if(st){

        st.className=
          'ymOrderStatus';


        st.innerHTML=
          '';
      }


      const slip=
        $('#ymOrderSlip');


      if(slip){

        slip.value=
          '';
      }


      $('#ymOrderSlipPreview')
        ?.replaceChildren();


      $('#ymProductPaymentOverlay')
        ?.classList
        .remove(
          'show'
        );


      $('#ymProductOrderOverlay')
        ?.classList
        .remove(
          'show'
        );


      document.body
        .classList
        .remove(
          'ymCalcCheckout'
        );


      $('#products')
        ?.scrollIntoView({
          behavior:
            'smooth',

          block:
            'start'
        });
    }

  },
  true
);


/* =========================================================
   TRACKING
   ========================================================= */

function db(){

  try{

    if(
      !window.firebase

      ||

      !firebase.firestore
    ){
      return null;
    }


    return firebase
      .firestore();

  }catch(_){

    return null;
  }
}


function proofImages(data){

  if(
    Array.isArray(
      data?.fulfillmentSlipDataList
    )
  ){

    return data
      .fulfillmentSlipDataList
      .filter(
        x=>

          typeof x ===
          'string'

          &&

          x.startsWith(
            'data:image/'
          )
      );
  }


  if(
    typeof data
      ?.fulfillmentSlipData ===
      'string'

    &&

    data
      .fulfillmentSlipData
      .startsWith(
        'data:image/'
      )
  ){

    return [
      data
        .fulfillmentSlipData
    ];
  }


  return [];
}


function openProof(src){

  const viewer=
    document.createElement(
      'div'
    );


  viewer.className=
    'ymk-proof-viewer';


  viewer.innerHTML=

    '<img src="'+
      src+
    '" alt="สลิปการเติมเกม">';


  viewer.onclick=
    ()=>viewer.remove();


  document.body
    .appendChild(
      viewer
    );
}


function dataToBlob(src){

  const [
    meta,
    raw
  ]=
    src.split(',');


  const mime=
    (
      meta.match(
        /data:([^;]+)/
      )
      ||
      []
    )[1]
    ||
    'image/jpeg';


  const bin=
    atob(raw);


  const bytes=
    new Uint8Array(
      bin.length
    );


  for(
    let i=0;
    i<bin.length;
    i++
  ){

    bytes[i]=
      bin.charCodeAt(i);
  }


  return new Blob(
    [bytes],
    {
      type:mime
    }
  );
}


async function saveProofs(
  images,
  id,
  btn
){

  if(!images.length){
    return;
  }


  const old=
    btn.textContent;


  btn.disabled=
    true;


  try{

    for(
      let i=0;
      i<images.length;
      i++
    ){

      btn.textContent=

        'กำลังบันทึก '+

        (i+1)+

        '/'+

        images.length+

        '…';


      const blob=
        dataToBlob(
          images[i]
        );


      const url=
        URL.createObjectURL(
          blob
        );


      const a=
        document.createElement(
          'a'
        );


      a.href=
        url;


      a.download=

        'Yuimellkub-'+

        String(id)
          .replace(
            /[^A-Za-z0-9_-]/g,
            ''
          )+

        '-slip-'+

        (i+1)+

        '.jpg';


      a.style.display=
        'none';


      document.body
        .appendChild(a);


      a.click();


      a.remove();


      setTimeout(
        ()=>URL.revokeObjectURL(
          url
        ),
        3000
      );


      await new Promise(
        r=>setTimeout(
          r,
          220
        )
      );
    }


    btn.textContent=
      'บันทึกสลิปแล้ว ✓';

  }catch(err){

    console.error(
      'save fulfillment slip failed',
      err
    );


    btn.textContent=
      'บันทึกไม่สำเร็จ';
  }


  setTimeout(
    ()=>{

      if(
        btn.isConnected
      ){

        btn.textContent=
          old;


        btn.disabled=
          false;
      }

    },
    1300
  );
}


async function resolveOrder(raw){

  const store=
    db();


  if(!store){

    throw new Error(
      'เชื่อมระบบออเดอร์ไม่ได้'
    );
  }


  const input=
    String(
      raw||
      ''
    )
      .trim()
      .replace(
        /^#/,
        ''
      );


  if(!input){

    throw new Error(
      'กรุณากรอกเลขออเดอร์'
    );
  }


  let orderSnap=
    null;


  let id=
    input;


  if(
    /^YMK\d{6}-\d{6}$/
      .test(input)
  ){

    orderSnap=
      await store
        .collection(
          'orders'
        )
        .doc(
          input
        )
        .get();

  }else{

    const snap=
      await store
        .collection(
          'orders'
        )
        .limit(
          300
        )
        .get();


    const digits=
      input.replace(
        /\D/g,
        ''
      );


    const hit=
      snap.docs
        .find(
          doc=>{

            const full=
              String(
                doc.id
              );


            const only=
              full.replace(
                /\D/g,
                ''
              );


            return (

              full ===
              input

              ||

              only.endsWith(
                digits
              )

              ||

              full.endsWith(
                input
              )
            );
          }
        );


    if(hit){

      id=
        hit.id;


      orderSnap=
        hit;
    }
  }


  if(
    !orderSnap

    ||

    !orderSnap.exists
  ){

    return null;
  }


  const order={

    id,

    ...orderSnap.data()
  };


  const statusSnap=

    await store
      .collection(
        'order_status'
      )
      .doc(
        id
      )
      .get();


  const statusData=

    statusSnap.exists

      ? statusSnap.data()

      : {};


  return {

    ...order,

    ...statusData,

    id,

    proof:
      proofImages(
        statusData
      )
  };
}



let activeTrackStop=
  null;

let activeTrackId=
  '';

let activeTrackOrder=
  null;

let activeTrackStatus=
  null;

let activeTrackSignature=
  '';


function stopRealtimeTrack(){

  if(activeTrackStop){

    try{
      activeTrackStop();
    }catch(_){}
  }

  activeTrackStop=
    null;

  activeTrackId=
    '';

  activeTrackOrder=
    null;

  activeTrackStatus=
    null;

  activeTrackSignature=
    '';
}


function renderRealtimeTrack(){

  if(
    !activeTrackId ||
    !activeTrackOrder
  ){
    return;
  }

  const merged={
    ...activeTrackOrder,
    ...(activeTrackStatus||{}),
    id:
      activeTrackId,
    proof:
      proofImages(
        activeTrackStatus||{}
      )
  };

  const sig=
    JSON.stringify([
      merged.id,
      merged.shopStatus,
      merged.status,
      merged.paymentStatus,
      merged.item,
      merged.pack,
      merged.uid,
      merged.server,
      (merged.proof||[]).length,
      ...(merged.proof||[]).map(
        x=>String(x).slice(0,80)
      )
    ]);

  if(
    sig ===
    activeTrackSignature
  ){
    return;
  }

  activeTrackSignature=
    sig;

  renderTracked(
    merged,
    true
  );
}


function startRealtimeTrack(
  id,
  initialOrder
){

  stopRealtimeTrack();

  if(
    !id ||
    !/^YMK\d{6}-\d{6}$/.test(id)
  ){
    return;
  }

  const store=
    db();

  if(!store){
    return;
  }

  activeTrackId=
    id;

  activeTrackOrder=
    initialOrder
      ? {
          ...initialOrder,
          id
        }
      : null;

  let offOrder=
    null;

  let offStatus=
    null;

  offOrder=
    store
      .collection('orders')
      .doc(id)
      .onSnapshot(
        snap=>{

          if(!snap.exists){
            return;
          }

          activeTrackOrder={
            id:
              snap.id,
            ...snap.data()
          };

          renderRealtimeTrack();
        },
        err=>
          console.warn(
            'realtime order watch failed',
            err
          )
      );

  offStatus=
    store
      .collection(
        'order_status'
      )
      .doc(id)
      .onSnapshot(
        snap=>{

          activeTrackStatus=
            snap.exists
              ? snap.data()
              : {};

          renderRealtimeTrack();
        },
        err=>
          console.warn(
            'realtime status watch failed',
            err
          )
      );

  activeTrackStop=()=>{

    try{
      offOrder?.();
    }catch(_){}

    try{
      offStatus?.();
    }catch(_){}
  };
}


function playPop(){

  try{

    const AC=
      window.AudioContext

      ||

      window.webkitAudioContext;


    if(!AC){
      return;
    }


    const ac=
      new AC();


    const o=
      ac.createOscillator();


    const g=
      ac.createGain();


    o.type=
      'sine';


    o.frequency
      .setValueAtTime(
        620,
        ac.currentTime
      );


    o.frequency
      .exponentialRampToValueAtTime(
        880,
        ac.currentTime+.07
      );


    g.gain
      .setValueAtTime(
        .0001,
        ac.currentTime
      );


    g.gain
      .exponentialRampToValueAtTime(
        .065,
        ac.currentTime+.012
      );


    g.gain
      .exponentialRampToValueAtTime(
        .0001,
        ac.currentTime+.1
      );


    o.connect(g);


    g.connect(
      ac.destination
    );


    o.start();


    o.stop(
      ac.currentTime+.11
    );


    setTimeout(
      ()=>ac.close()
        .catch(()=>{}),
      180
    );

  }catch(_){}
}


function renderTracked(
  order,
  realtime=false
){

  const result=
    $('#orderPopupResult');


  if(!result){
    return;
  }


  result.classList
    .add(
      'show'
    );


  if(!order){

    result.innerHTML=

      '<div class="orderEmptyIcon">♡</div>'+

      'ไม่พบเลขออเดอร์นี้ในระบบ';


    playPop();


    return;
  }


  const status=
    String(

      order.shopStatus

      ||

      order.status

      ||

      order.paymentStatus

      ||

      'รอดำเนินการ'

    ).trim();


  const problem=

    /มีปัญหา|ผิดพลาด|ยกเลิก|ไม่สำเร็จ/
      .test(status);


  result.innerHTML=`

    <div class="orderDemoCard">

      <div class="orderDemoTop">

        <strong>
          ${esc(order.id)}
        </strong>

        <span class="statusPill">
          ${esc(status)}
        </span>

      </div>


      <div class="orderRows">

        <div>

          <small>
            รายการ
          </small>

          <b>
            ${esc(order.item||'-')}
          </b>

        </div>


        <div>

          <small>
            แพ็ก / ประเภท
          </small>

          <b>
            ${esc(order.pack||'-')}
          </b>

        </div>


        <div>

          <small>
            UID
          </small>

          <b>
            ${esc(order.uid||'-')}
          </b>

        </div>


        <div>

          <small>
            Server
          </small>

          <b>
            ${esc(order.server||'-')}
          </b>

        </div>

      </div>


      ${
        problem

        ? `

          <div class="ymk-track-problem">

            ออเดอร์นี้มีปัญหา
            รบกวนติดต่อเข้ามาทางเพจ
            เพื่อให้ทางร้านตรวจสอบ
            และทำรายการใหม่ให้นะคะ ♡

            <a
              href="https://m.me/yuimellkubtopup"
              target="_blank"
              rel="noopener"
            >
              ติดต่อเพจร้าน
            </a>

          </div>

        `

        : ''
      }


      ${
        order.proof?.length

        ? `

          <div class="ymk-track-proof">

            <b>

              สลิปการเติมเกม

              (${order.proof.length} รูป)

            </b>


            <div class="ymk-track-proof-grid">

              ${
                order.proof
                  .map(
                    (
                      src,
                      i
                    )=>

                    `

                      <img
                        src="${src}"
                        data-v21-proof="${i}"
                        alt="สลิปการเติมเกม ${i+1}"
                      >

                    `
                  )
                  .join('')
              }

            </div>


            <button
              type="button"
              class="ymk-track-save"
              data-v21-save
            >

              บันทึกสลิป${order.proof.length>1?'ทั้งหมด':''}

            </button>

          </div>

        `

        : (
            status ===
            'สำเร็จ'

            ? `

              <div
                style="
                  margin-top:10px;
                  text-align:center
                "
              >

                ออเดอร์สำเร็จแล้ว
                แต่ยังไม่มีสลิปที่ร้านแนบไว้

              </div>

            `

            : ''
          )
      }

    </div>
  `;


  result
    .querySelectorAll(
      '[data-v21-proof]'
    )
    .forEach(
      img=>{

        img.onclick=
          ()=>openProof(
            img.src
          );
      }
    );


  const save=
    result.querySelector(
      '[data-v21-save]'
    );


  if(save){

    save.onclick=
      ()=>saveProofs(
        order.proof,
        order.id,
        save
      );
  }


  if(!realtime){
    playPop();
  }
}


window.addEventListener(
  'pointerdown',
  e=>{

    const btn=
      e.target.closest?.(
        '#orderPopupSubmit'
      );


    if(btn){

      btn.id=
        'orderPopupSubmitProdV21';
    }

  },
  true
);


window.addEventListener(
  'click',
  async e=>{

    const btn=
      e.target.closest?.(
        '#orderPopupSubmitProdV21'
      );


    if(!btn){
      return;
    }


    e.preventDefault();

    e.stopPropagation();

    e.stopImmediatePropagation();


    stopRealtimeTrack();


    const result=
      $('#orderPopupResult');


    const input=
      $('#orderPopupInput');


    if(result){

      result.classList
        .add(
          'show'
        );


      result.textContent=
        'กำลังตรวจสอบออเดอร์…';
    }


    btn.disabled=
      true;


    try{

      const order=
        await resolveOrder(
          input?.value||
          ''
        );


      renderTracked(
        order
      );

      if(order?.id){
        startRealtimeTrack(
          order.id,
          order
        );
      }

    }catch(err){

      console.error(
        'track order failed',
        err
      );


      if(result){

        result.classList
          .add(
            'show'
          );


        result.textContent=

          err?.message

          ||

          'ตรวจสอบออเดอร์ไม่สำเร็จ';
      }
    }


    btn.disabled=
      false;


    btn.id=
      'orderPopupSubmit';


    return false;

  },
  true
);


/* =========================================================
   START
   ========================================================= */

function startProductObserver(){

  const root=
    $('#products');


  if(!root){
    return;
  }


  let queued=
    false;


  new MutationObserver(
    ()=>{

      if(queued){
        return;
      }


      queued=
        true;


      requestAnimationFrame(
        ()=>{

          queued=
            false;


          decorateCards();
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


function boot(){

  installStyle();

  ensureLegacyFields();

  decorateCards();

  startMemberSync();

  startStatusWatch();

  startProductObserver();


  document.addEventListener(
    'ymk-storefront-products-rendered',
    decorateCards
  );
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
