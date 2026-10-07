(function(){
'use strict';

/* =========================================================
   YUIMELLKUB V18
   PREVIEW CARD + PREVIEW CHECKOUT FLOW
   production backend remains unchanged
   ========================================================= */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

let activeOrder = null;

const esc = v =>
  String(v ?? '').replace(/[&<>"']/g,c=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[c]));

const number = v => {
  const m = String(v ?? '')
    .replace(/,/g,'')
    .match(/\d+(?:\.\d+)?/);

  return m ? Number(m[0]) : 0;
};

const money = n =>
  Math.round(Number(n)||0)
    .toLocaleString('th-TH');


/* =========================================================
   1. PREVIEW CARD — USE PREVIEW MOTION / SIZE
   ========================================================= */

function installStyle(){

  if($('#ymkV18Style')) return;

  const style = document.createElement('style');

  style.id = 'ymkV18Style';

  style.textContent = `

    /* -------------------------
       Preview card base
    ------------------------- */

    #products .products{
      align-items:start!important;
    }

    #products .product,
    #products .ready-stock-card{
      position:relative!important;
      overflow:hidden!important;

      height:auto!important;
      min-height:0!important;

      border:1px solid var(--line)!important;
      border-radius:18px!important;

      padding:16px 10px 12px!important;

      text-align:center!important;

      background:
        linear-gradient(
          #fff,
          #fff8fb
        )!important;

      transform:
        translate3d(0,0,0)!important;

      will-change:
        transform,
        box-shadow!important;

      transition:
        transform .58s
          cubic-bezier(.22,.61,.36,1),
        box-shadow .58s
          cubic-bezier(.22,.61,.36,1)!important;
    }


    #products .product::before,
    #products .ready-stock-card::before{
      content:"";

      position:absolute;

      width:70px;
      height:70px;

      right:-34px;
      top:-35px;

      border-radius:50%;

      background:#fff0f5;

      pointer-events:none;
    }


    #products .product:hover,
    #products .ready-stock-card:hover{
      transform:
        translate3d(
          0,
          -4px,
          0
        )!important;

      box-shadow:
        0 12px 26px
        rgba(
          177,
          90,
          125,
          .10
        )!important;
    }


    /* -------------------------
       Product image
    ------------------------- */

    #products .ymk-production-image,
    #products .gem{
      height:72px!important;

      display:flex!important;

      align-items:center!important;
      justify-content:center!important;

      margin:0 auto 4px!important;

      overflow:hidden!important;
    }


    #products .ymk-production-image img,
    #products .gem img{
      display:block!important;

      width:66px!important;
      height:66px!important;

      max-width:66px!important;
      max-height:66px!important;

      object-fit:contain!important;
    }


    /* -------------------------
       Product name
    ------------------------- */

    #products .ymk-store-name{
      display:-webkit-box!important;

      -webkit-box-orient:vertical!important;
      -webkit-line-clamp:2!important;

      overflow:hidden!important;

      min-height:0!important;

      margin:
        6px 3px 4px!important;

      line-height:1.4!important;

      text-align:center!important;
    }


    /* ไม่ให้ description ดันการ์ดยาว */
    #products .ymk-store-desc{
      display:none!important;
    }


    /* -------------------------
       Price
    ------------------------- */

    #products .ymk-store-price,
    #products .price{
      margin-top:4px!important;

      font-size:20px!important;
      font-weight:900!important;

      color:#d86f99!important;

      text-align:center!important;
    }


    #products .ymk-store-bottom{
      width:100%!important;

      margin-top:7px!important;
      padding:0!important;

      display:flex!important;
      flex-direction:column!important;

      gap:7px!important;
    }


    /* -------------------------
       Buttons
    ------------------------- */

    #products .ready-stock-order-btn,
    #products .ymk-send-choice{
      width:100%!important;

      min-height:36px!important;
      height:36px!important;

      margin:0!important;
      padding:0 10px!important;

      box-sizing:border-box!important;

      border-radius:10px!important;

      font:inherit!important;
      font-size:12px!important;
      font-weight:900!important;

      cursor:pointer!important;

      transition:
        transform .18s ease,
        filter .18s ease!important;
    }


    #products .ready-stock-order-btn{
      border:0!important;

      background:
        var(--p)!important;

      color:#fff!important;
    }


    #products .ymk-send-choice{
      border:
        1px solid
        #efbfd1!important;

      background:
        #fff7fa!important;

      color:
        #c45f87!important;
    }


    #products .ready-stock-order-btn:hover,
    #products .ymk-send-choice:hover{
      transform:
        translateY(-1px)!important;

      filter:
        brightness(.98)!important;
    }


    #products .ready-stock-order-btn:active,
    #products .ymk-send-choice:active{
      transform:
        scale(.975)!important;
    }


    /* -------------------------
       Payment / status Preview
    ------------------------- */

    #ymkForceCard,
    #ymkFinalOrderStatusCard{
      display:none!important;
    }


    #ymOrderStatus{
      margin-top:10px!important;
    }


    #ymOrderStatus.ymV18Status{
      display:block!important;
    }


    #ymOrderStatus .ymUActions{
      display:flex!important;
      flex-direction:column!important;

      gap:10px!important;

      margin-top:14px!important;
    }


    #ymOrderStatus .ymUActions button{
      width:100%!important;

      margin:0!important;
    }


    @media(max-width:650px){

      #products .product,
      #products .ready-stock-card{
        padding:
          12px 9px 10px!important;
      }

      #products .ready-stock-order-btn,
      #products .ymk-send-choice{
        min-height:34px!important;
        height:34px!important;
      }
    }

  `;

  document.head.appendChild(style);
}


/* =========================================================
   2. ADD SEND BUTTON TO REAL FIRESTORE CARDS
   ========================================================= */

function addSendButton(card){

  if(!card) return;

  const normal =
    card.querySelector(
      '.ready-stock-order-btn'
    );

  const bottom =
    card.querySelector(
      '.ymk-store-bottom'
    );

  if(!normal || !bottom){
    return;
  }


  const enabled =
    normal.dataset
      .sendEnabled === '1' &&
    Number(
      normal.dataset
        .sendPrice || 0
    ) > 0;


  let send =
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


  bottom.appendChild(send);
}


function decorateCards(){

  $$('#products .ready-stock-card')
    .forEach(card=>{

      card.classList.add(
        'product'
      );

      addSendButton(card);
    });
}


/* =========================================================
   3. PRODUCT STATE
   ========================================================= */

function readProduct(button,mode){

  if(!button){
    return null;
  }


  const card =
    button.closest(
      '.ready-stock-card'
    );


  if(!card){
    return null;
  }


  const name =
    (
      button.dataset.readyName ||
      card
        .querySelector(
          '.ymk-store-name'
        )
        ?.textContent ||
      'สินค้า'
    ).trim();


  const normalPrice =
    Number(
      button.dataset
        .readyPrice || 0
    );


  const sendPrice =
    Number(
      button.dataset
        .sendPrice || 0
    );


  const price =
    mode === 'send'
      ? sendPrice
      : normalPrice;


  if(!(price > 0)){
    return null;
  }


  return {

    id:
      button.dataset
        .productId || '',

    category:
      button.dataset
        .readyCategory || '',

    name,

    unit:
      price,

    mode:
      mode === 'send'
        ? 'send'
        : 'instant'
  };
}


function qty(){

  return Math.max(
    1,
    Math.min(
      99,
      Math.floor(
        Number(
          $('#ymOrderQty')
            ?.value
        ) || 1
      )
    )
  );
}


/* =========================================================
   4. PREVIEW ORDER POPUP
   ========================================================= */

function syncSelected(){

  if(!activeOrder){
    return;
  }


  const q =
    qty();


  const total =
    activeOrder.unit *
    q;


  const item =
    activeOrder.name +
    (
      q > 1
        ? ' × ' + q
        : ''
    );


  const selected =
    $('#ymOrderSelected');


  if(selected){

    selected.innerHTML =

      '<b>' +
      esc(item) +
      '</b>' +

      '<br>' +

      'ราคา ' +
      money(total) +
      ' บาท' +

      (
        activeOrder.mode ===
        'send'

          ? '<span class="ymPackLine">ประเภท: แบบส่ง</span>'

          : ''
      );
  }


  const totalEl =
    $('#ymOrderQtyTotal');


  if(totalEl){

    totalEl.textContent =
      'รวม ' +
      money(total) +
      ' บาท';
  }


  window
    .YMK_ACTIVE_PRODUCT_ORDER = {

      productId:
        activeOrder.id,

      name:
        activeOrder.name,

      category:
        activeOrder.category,

      mode:
        activeOrder.mode,

      unit:
        activeOrder.unit,

      quantity:q,

      total
    };


  if(
    activeOrder.mode ===
    'send'
  ){

    window
      .YMK_SEND_SELECTION = {

        mode:'send',

        name:
          activeOrder.name,

        category:
          activeOrder.category,

        price:
          activeOrder.unit,

        quantity:q,

        total
      };


    window
      .YMK_SEND_ORDER_META = {

        mode:'send',

        base:
          activeOrder.name,

        unit:
          activeOrder.unit,

        q,

        total
      };

  }else{

    window
      .YMK_SEND_SELECTION =
        null;

    window
      .YMK_SEND_ORDER_META =
        null;
  }


  try{

    window.lastOrder = {

      item,

      baseItem:
        activeOrder.name,

      productId:
        activeOrder.id,

      category:
        activeOrder.category,

      quantity:q,

      price:
        money(total) +
        ' บาท',

      totalPrice:
        total,

      pack:
        activeOrder.mode ===
        'send'
          ? 'แบบส่ง'
          : '',

      packPlan:
        activeOrder.mode ===
        'send'
          ? 'แบบส่ง'
          : '',

      orderMode:
        activeOrder.mode
    };

  }catch(e){}
}


function resetStatus(){

  const st =
    $('#ymOrderStatus');


  if(st){

    st.className =
      'ymOrderStatus';

    st.innerHTML =
      '';
  }


  const slip =
    $('#ymOrderSlip');


  if(slip){
    slip.value = '';
  }


  const preview =
    $('#ymOrderSlipPreview');


  if(preview){
    preview.innerHTML = '';
  }
}


function openProductOrder(
  normal,
  mode
){

  const state =
    readProduct(
      normal,
      mode
    );


  if(!state){
    return;
  }


  activeOrder =
    state;


  document.body
    .classList
    .remove(
      'ymCalcCheckout'
    );


  window
    .YMK_LAST_CALC =
      null;


  resetStatus();


  if($('#ymOrderQty')){
    $('#ymOrderQty').value =
      '1';
  }


  syncSelected();


  $('#ymProductPaymentOverlay')
    ?.classList
    .remove(
      'show'
    );


  $('#ymProductOrderOverlay')
    ?.classList
    .add(
      'show'
    );
}


/* =========================================================
   5. CARD CLICK
   ========================================================= */

window.addEventListener(
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


      openProductOrder(
        normal,
        'send'
      );


      return false;
    }


    const normal =
      e.target.closest?.(
        '.ready-stock-order-btn'
      );


    if(!normal){
      return;
    }


    if(
      normal.closest(
        '#ymkNativeOrderProxyHost'
      )
    ){
      return;
    }


    e.preventDefault();

    e.stopPropagation();

    e.stopImmediatePropagation();


    openProductOrder(
      normal,
      'instant'
    );


    return false;

  },
  true
);


/* =========================================================
   6. QUANTITY
   ========================================================= */

document.addEventListener(
  'click',
  e=>{

    if(
      !activeOrder
    ){
      return;
    }


    if(
      e.target.closest?.(
        '#ymOrderQtyMinus,#ymOrderQtyPlus'
      )
    ){

      setTimeout(
        syncSelected,
        0
      );

      setTimeout(
        syncSelected,
        30
      );
    }

  },
  true
);


document.addEventListener(
  'input',
  e=>{

    if(
      e.target?.id ===
      'ymOrderQty'
    ){
      syncSelected();
    }

  },
  true
);


/* =========================================================
   7. ORDER POPUP → PAYMENT POPUP
   ========================================================= */

window.addEventListener(
  'click',
  e=>{

    const next =
      e.target.closest?.(
        '#ymOrderNext'
      );


    if(
      !next ||
      !activeOrder ||
      document.body
        .classList
        .contains(
          'ymCalcCheckout'
        )
    ){
      return;
    }


    e.preventDefault();

    e.stopPropagation();

    e.stopImmediatePropagation();


    const uid =
      $('#ymOrderUid')
        ?.value
        ?.trim() ||
      '';


    if(!uid){

      const st =
        $('#ymOrderStatus');


      if(st){

        st.className =
          'ymOrderStatus show';

        st.textContent =
          'กรุณากรอก UID / ID ผู้เล่น';
      }


      $('#ymOrderUid')
        ?.focus();


      return false;
    }


    syncSelected();


    const q =
      qty();


    const total =
      activeOrder.unit *
      q;


    const item =
      activeOrder.name +
      (
        q > 1
          ? ' × ' + q
          : ''
      );


    const server =
      $('#ymOrderServer')
        ?.value ||
      'Asia';


    const name =
      $('#ymOrderName')
        ?.value
        ?.trim() ||
      '';


    if($('#ymOrderAmount')){

      $('#ymOrderAmount')
        .textContent =
          money(total) +
          ' บาท';
    }


    if($('#ymOrderSummary')){

      $('#ymOrderSummary')
        .innerHTML =

          '<b>' +
          esc(item) +
          '</b>' +

          (
            activeOrder.mode ===
            'send'

              ? '<span class="ymPackLine">ประเภท: แบบส่ง</span>'

              : ''
          ) +

          '<br>UID: ' +
          esc(uid) +

          ' • Server: ' +
          esc(server) +

          (
            name
              ? '<br>ชื่อ: ' +
                esc(name)

              : ''
          );
    }


    syncCreditButton();


    $('#ymProductOrderOverlay')
      ?.classList
      .remove(
        'show'
      );


    $('#ymProductPaymentOverlay')
      ?.classList
      .add(
        'show'
      );


    return false;

  },
  true
);


/* =========================================================
   8. MEMBER CREDIT BUTTON
   ========================================================= */

function syncCreditButton(){

  let logged =
    false;


  try{

    logged =
      !!firebase
        .auth()
        .currentUser;

  }catch(e){}


  $$(
    '[data-ym-order-pay="credit"]'
  ).forEach(btn=>{

    btn.hidden =
      !logged;


    btn.style.setProperty(
      'display',

      logged
        ? 'block'
        : 'none',

      'important'
    );
  });
}


/* =========================================================
   9. BRIDGE PREVIEW FORM → PRODUCTION BACKEND
   ========================================================= */

function ensureLegacy(){

  let uid =
    $('#orderUid');


  if(!uid){

    uid =
      document.createElement(
        'input'
      );

    uid.id =
      'orderUid';

    uid.style.display =
      'none';

    document.body
      .appendChild(uid);
  }


  let name =
    $('#orderName');


  if(!name){

    name =
      document.createElement(
        'input'
      );

    name.id =
      'orderName';

    name.style.display =
      'none';

    document.body
      .appendChild(name);
  }


  let server =
    $('#orderServer');


  if(!server){

    server =
      document.createElement(
        'select'
      );

    server.id =
      'orderServer';

    server.style.display =
      'none';

    server.innerHTML = `
      <option value="Asia">
        Asia
      </option>

      <option value="NA-EU">
        NA-EU
      </option>

      <option value="อื่น ๆ">
        อื่น ๆ
      </option>
    `;


    document.body
      .appendChild(server);
  }


  let file =
    $('#slipFile');


  if(!file){

    file =
      document.createElement(
        'input'
      );

    file.type =
      'file';

    file.id =
      'slipFile';

    file.accept =
      'image/*';

    file.style.display =
      'none';


    document.body
      .appendChild(file);
  }


  let status =
    $('#adminSaveStatus');


  if(!status){

    status =
      document.createElement(
        'div'
      );

    status.id =
      'adminSaveStatus';

    status.style.display =
      'none';


    document.body
      .appendChild(status);
  }
}


function copySlip(){

  const source =
    $('#ymOrderSlip');

  const target =
    $('#slipFile');


  if(
    !source?.files?.length ||
    !target
  ){
    return false;
  }


  try{

    const dt =
      new DataTransfer();


    [...source.files]
      .forEach(
        f=>dt.items.add(f)
      );


    target.files =
      dt.files;


    return true;

  }catch(e){

    return false;
  }
}


function prepareBackendOrder(){

  ensureLegacy();


  $('#orderUid').value =
    $('#ymOrderUid')
      ?.value
      ?.trim() ||
    '';


  $('#orderName').value =
    $('#ymOrderName')
      ?.value
      ?.trim() ||
    '';


  $('#orderServer').value =
    $('#ymOrderServer')
      ?.value ||
    'Asia';


  copySlip();


  const method =
    document.querySelector(
      '[data-ym-order-pay].on'
    )
      ?.dataset
      ?.ymOrderPay ||
    'qr';


  window.getPaymentMethod =
    () => method;
}


/* =========================================================
   10. PREVIEW PENDING UI
   ========================================================= */

function pendingHTML(){

  return `

    <div class="ymSlipCheck">
      ✓
    </div>

    <div class="ymSlipTitle">
      ส่งสลิปเรียบร้อยแล้ว ♡
    </div>

    <div class="ymSlipSub">
      กำลังรอร้านตรวจสอบสลิป
    </div>

    <div class="ymSlipReceived">
      ร้านได้รับสลิปในระบบแล้ว
      ไม่ต้องส่งซ้ำนะคะ ♡
    </div>

    <div
      class="ymSlipReceived"
      style="margin-top:8px"
    >
      หลังตรวจสอบเรียบร้อย
      ระบบจะแสดงเลขออเดอร์สำหรับติดตามสถานะตามปกติ
    </div>

    <div class="ymSlipNote">

      <b>
        หมายเหตุ ♡
      </b>

      <br>

      หากรอตรวจสอบเกินประมาณ

      <b>
        5–10 นาที
      </b>

      สามารถทักเพจหรือ LINE
      เพื่อแจ้งแอดมินตรวจสอบได้นะคะ ♡

    </div>

    <div class="ymSlipContacts">

      <a
        href="https://m.me/yuimellkubtopup"
        target="_blank"
        rel="noopener"
      >
        ทักเพจ
      </a>

      <a
        href="https://line.me/R/ti/p/@205svvxv"
        target="_blank"
        rel="noopener"
      >
        ทัก LINE
      </a>

    </div>
  `;
}


function showPending(){

  const st =
    $('#ymOrderStatus');


  if(!st){
    return;
  }


  st.className =
    'ymOrderStatus show ok ymV18Status';


  st.innerHTML =
    pendingHTML();
}


/* =========================================================
   11. PREVIEW APPROVED UI
   ========================================================= */

function approvedHTML(
  id,
  isSend
){

  return `

    <div class="ymUCheck">
      ✓
    </div>

    <div class="ymUTitle">
      ยืนยันสลิปเรียบร้อยแล้ว ♡
    </div>

    <div class="ymUSub">
      สร้างออเดอร์เข้าสู่ระบบเรียบร้อยแล้ว
    </div>

    <div class="ymUIdLabel">
      เลขออเดอร์ของคุณ
    </div>

    <b class="ymUId">
      ${esc(id)}
    </b>


    ${
      isSend

        ? `

          <div
            style="
              margin-top:12px;

              padding:12px 13px;

              border:
                1px solid
                #efc6d7;

              border-radius:
                14px;

              background:
                #fff3f8;

              text-align:center;

              font-size:12px;

              line-height:1.7
            "
          >

            รบกวนลูกค้าทักเพจร้าน
            พร้อมแจ้งเลขออเดอร์

            <b>
              ${esc(id)}
            </b>

            เพื่อให้ทางร้านดำเนินการแบบส่งต่อค่ะ ♡


            <a
              href="https://m.me/yuimellkubtopup"
              target="_blank"
              rel="noopener"

              style="
                display:block;

                margin-top:9px;

                padding:10px;

                border-radius:12px;

                background:#df76a0;

                color:#fff;

                text-decoration:none;

                font-weight:900
              "
            >
              ทักเพจร้าน
            </a>

          </div>
        `

        : ''
    }


    <div class="ymUActions">

      <button
        type="button"
        class="ymOrderBack"
        data-v18-copy="${esc(id)}"
      >
        คัดลอกเลขออเดอร์
      </button>

      <button
        type="button"
        class="ymOrderNext"
        data-v18-new
      >
        ทำรายการออเดอร์ใหม่
      </button>

    </div>
  `;
}


function showApproved(
  id,
  isSend
){

  const st =
    $('#ymOrderStatus');


  if(!st){
    return;
  }


  st.className =
    'ymOrderStatus show ok ymV18Status';


  st.innerHTML =
    approvedHTML(
      id,
      isSend
    );
}


/* =========================================================
   12. FAILED UI
   ========================================================= */

function showProblem(
  message
){

  const st =
    $('#ymOrderStatus');


  if(!st){
    return;
  }


  st.className =
    'ymOrderStatus show ymV18Status';


  st.innerHTML = `

    <div class="ymSlipTitle">
      ออเดอร์มีปัญหา
    </div>

    <div
      class="ymSlipReceived"
      style="margin-top:8px"
    >
      ${esc(
        message ||
        'ไม่สามารถดำเนินการได้'
      )}
    </div>

    <div class="ymSlipNote">

      รบกวนติดต่อเข้ามาทางเพจ
      เพื่อให้ทางร้านตรวจสอบ
      และทำรายการใหม่ให้นะคะ ♡

    </div>

    <div class="ymSlipContacts">

      <a
        href="https://m.me/yuimellkubtopup"
        target="_blank"
        rel="noopener"
      >
        ติดต่อเพจร้าน
      </a>

    </div>
  `;
}


/* =========================================================
   13. SUBMIT REAL SLIP
   ========================================================= */

window.addEventListener(
  'pointerdown',
  e=>{

    const btn =
      e.target.closest?.(
        '#ymOrderSubmit'
      );


    if(!btn){
      return;
    }


    /*
      เครดิตให้ member bridge จัดการเอง
    */

    const method =
      document.querySelector(
        '[data-ym-order-pay].on'
      )
        ?.dataset
        ?.ymOrderPay ||
      'qr';


    if(method === 'credit'){
      return;
    }


    btn.id =
      'ymOrderSubmitV18';

  },
  true
);


window.addEventListener(
  'click',
  async e=>{

    const btn =
      e.target.closest?.(
        '#ymOrderSubmitV18'
      );


    if(!btn){
      return;
    }


    e.preventDefault();

    e.stopPropagation();

    e.stopImmediatePropagation();


    if(
      !$('#ymOrderSlip')
        ?.files?.length
    ){

      showProblem(
        'กรุณาแนบสลิปชำระเงินก่อนส่งตรวจสอบ'
      );

      btn.id =
        'ymOrderSubmit';

      return false;
    }


    prepareBackendOrder();


    if(
      typeof window
        .saveOrderToDemoAdmin !==
      'function'
    ){

      showProblem(
        'ระบบออเดอร์ยังโหลดไม่เสร็จ กรุณาลองใหม่อีกครั้ง'
      );

      btn.id =
        'ymOrderSubmit';

      return false;
    }


    btn.disabled =
      true;


    try{

      const result =
        await window
          .saveOrderToDemoAdmin();


      if(result === false){

        btn.disabled =
          false;

        btn.id =
          'ymOrderSubmit';

        return false;
      }


      /*
        manual mode:
        ยังไม่ออกเลขออเดอร์
      */

      showPending();

    }catch(err){

      console.error(
        'YMK V18 submit failed',
        err
      );


      showProblem(
        err?.message ||
        'ส่งสลิปไม่สำเร็จ กรุณาลองใหม่'
      );


      btn.disabled =
        false;
    }


    btn.id =
      'ymOrderSubmit';


    return false;

  },
  true
);


/* =========================================================
   14. WATCH REAL PRODUCTION STATUS
   ========================================================= */

function syncProductionStatus(){

  const source =
    $('#adminSaveStatus');


  if(!source){
    return;
  }


  const text =
    String(
      source.textContent ||
      ''
    ).trim();


  if(!text){
    return;
  }


  /*
    failed
  */

  if(
    /สลิปไม่ผ่าน|มีปัญหา|ไม่สำเร็จ|ผิดพลาด/
      .test(text)
  ){

    showProblem(text);

    return;
  }


  /*
    approved
  */

  const match =
    text.match(
      /YMK\d{6}-\d{6}/
    );


  if(
    match &&
    /ส่งออเดอร์เข้าระบบแล้ว|ยืนยันสลิป|เลขออเดอร์/
      .test(text)
  ){

    showApproved(
      match[0],

      (
        activeOrder?.mode ===
        'send' ||

        window
          .YMK_SEND_ORDER_META
          ?.mode ===
        'send'
      )
    );


    return;
  }


  /*
    pending
  */

  if(
    /รอร้านตรวจสอบ|กำลังรอร้านตรวจสอบ|ส่งสลิปแล้ว|กำลังส่งสลิป|ยังไม่มีการสร้างออเดอร์/
      .test(text)
  ){

    showPending();
  }
}


/* =========================================================
   15. COPY / NEW ORDER
   ========================================================= */

document.addEventListener(
  'click',
  e=>{

    const copy =
      e.target.closest?.(
        '[data-v18-copy]'
      );


    if(copy){

      const id =
        copy.dataset.v18Copy;


      navigator.clipboard
        ?.writeText(id)
        .then(()=>{

          const old =
            copy.textContent;


          copy.textContent =
            'คัดลอกแล้ว ✓';


          setTimeout(
            ()=>{

              if(copy.isConnected){

                copy.textContent =
                  old;
              }

            },
            900
          );

        })
        .catch(()=>{});


      return;
    }


    if(
      e.target.closest?.(
        '[data-v18-new]'
      )
    ){

      activeOrder =
        null;


      window.lastOrder =
        null;


      window
        .YMK_ACTIVE_PRODUCT_ORDER =
        null;


      window
        .YMK_SEND_SELECTION =
        null;


      window
        .YMK_SEND_ORDER_META =
        null;


      resetStatus();


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


      $('#products')
        ?.scrollIntoView({
          behavior:'smooth',
          block:'start'
        });
    }

  },
  true
);


/* =========================================================
   16. START
   ========================================================= */

function boot(){

  installStyle();

  ensureLegacy();

  decorateCards();

  syncCreditButton();


  document.addEventListener(
    'ymk-storefront-products-rendered',
    ()=>{

      setTimeout(
        decorateCards,
        0
      );
    }
  );


  new MutationObserver(
    ()=>{

      decorateCards();

      syncCreditButton();

      syncProductionStatus();
    }
  ).observe(
    document.body,
    {
      childList:true,
      subtree:true
    }
  );


  const status =
    $('#adminSaveStatus');


  if(status){

    new MutationObserver(
      syncProductionStatus
    ).observe(
      status,
      {
        childList:true,
        subtree:true,
        characterData:true
      }
    );
  }


  try{

    if(
      window.firebase &&
      firebase.auth
    ){

      firebase
        .auth()
        .onAuthStateChanged(
          ()=>{

            syncCreditButton();
          }
        );
    }

  }catch(e){}


  syncProductionStatus();
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
