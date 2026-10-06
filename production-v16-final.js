(function(){
'use strict';

/* =========================================================
   Yuimellkub Production V16
   - Preview UI / Production backend
   - Ready stock + Calculator
   - Realtime product state
   - Member UI
   - Real order tracking + fulfillment slips
   ========================================================= */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

let db = null;
let auth = null;

let readyState = null;
let calcState = null;
let activeCheckout = null;

let currentUser = null;
let currentMember = null;

let statusObserver = null;

const clean = v =>
  String(v == null ? '' : v)
    .replace(/\s*[×xX]\s*\d+\s*$/, '')
    .trim();

const num = v => {
  if(typeof v === 'number') return Number.isFinite(v) ? v : 0;

  const m = String(v || '')
    .replace(/,/g,'')
    .match(/\d+(?:\.\d+)?/);

  return m ? Number(m[0]) : 0;
};

const fmt = n =>
  Math.round(Number(n) || 0)
    .toLocaleString('th-TH');

const esc = v =>
  String(v == null ? '' : v)
    .replace(/[&<>"']/g,c=>({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[c]));


/* =========================================================
   1. UI — CARD SMOOTH + BUTTONS
   ========================================================= */

function installStyle(){

  if($('#ymkV16Style')) return;

  const style = document.createElement('style');

  style.id = 'ymkV16Style';

  style.textContent = `

    /* Preview-style smooth product movement */
    .ready-stock-card.ymk-production-card{
      display:flex!important;
      flex-direction:column!important;
      height:100%!important;

      transform:translate3d(0,0,0)!important;
      will-change:transform,box-shadow!important;

      transition:
        transform .28s cubic-bezier(.22,.61,.36,1),
        box-shadow .28s ease!important;
    }

    .ready-stock-card.ymk-production-card:hover{
      transform:translate3d(0,-3px,0)!important;

      box-shadow:
        0 10px 22px
        rgba(177,90,125,.09)!important;
    }

    .ready-stock-card .ymk-store-name{
      display:-webkit-box!important;
      -webkit-box-orient:vertical!important;
      -webkit-line-clamp:2!important;
      overflow:hidden!important;

      min-height:2.9em!important;
      line-height:1.45!important;
    }

    .ready-stock-card .ymk-store-bottom{
      margin-top:auto!important;
      padding-top:10px!important;

      display:flex!important;
      flex-direction:column!important;
      gap:7px!important;

      width:100%!important;
    }

    .ready-stock-card .ymk-store-price{
      width:100%!important;
      text-align:center!important;
    }

    .ready-stock-card .ready-stock-order-btn,
    .ready-stock-card .ymk-send-choice{
      width:100%!important;
      height:42px!important;
      min-height:42px!important;

      margin:0!important;
      padding:0 14px!important;

      display:flex!important;
      align-items:center!important;
      justify-content:center!important;

      box-sizing:border-box!important;

      border-radius:10px!important;

      font:inherit!important;
      font-size:12px!important;
      font-weight:900!important;

      transition:
        transform .18s ease,
        filter .18s ease,
        box-shadow .18s ease!important;
    }

    .ready-stock-card .ymk-send-choice{
      border:1px solid #e8aac0!important;
      background:#fff7fa!important;
      color:#c8648a!important;
    }

    .ready-stock-card .ready-stock-order-btn:hover,
    .ready-stock-card .ymk-send-choice:hover{
      transform:translateY(-1px)!important;
      filter:brightness(.985);
    }

    .ready-stock-card .ready-stock-order-btn:active,
    .ready-stock-card .ymk-send-choice:active{
      transform:translateY(0) scale(.985)!important;
    }


    /* Order-check fulfillment slip */
    .ymkV16Proof{
      margin-top:12px;
      padding:11px;

      border:1px solid #f0cfdb;
      border-radius:14px;

      background:#fff8fb;
    }

    .ymkV16ProofTitle{
      text-align:center;
      font-weight:900;
      font-size:12px;

      margin-bottom:8px;
    }

    .ymkV16ProofGrid{
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:7px;
    }

    .ymkV16ProofGrid img{
      display:block;

      width:100%;
      aspect-ratio:1/1;

      object-fit:cover;

      border-radius:8px;
      border:1px solid #f0d4de;

      cursor:pointer;
    }

    .ymkV16Viewer{
      position:fixed;
      inset:0;

      z-index:2147483647;

      display:flex;
      align-items:center;
      justify-content:center;

      padding:20px;

      background:rgba(50,30,39,.75);
    }

    .ymkV16Viewer img{
      max-width:94vw;
      max-height:90vh;

      object-fit:contain;

      border-radius:12px;
      background:#fff;
    }

  `;

  document.head.appendChild(style);
}


/* =========================================================
   2. FIREBASE
   ========================================================= */

function firebaseBoot(){

  if(
    !window.firebase ||
    !firebase.firestore ||
    !window.YUIMELLKUB_FIREBASE_CONFIG
  ){
    setTimeout(firebaseBoot,150);
    return;
  }

  try{

    if(!firebase.apps.length){
      firebase.initializeApp(
        window.YUIMELLKUB_FIREBASE_CONFIG
      );
    }

    db = firebase.firestore();

    if(firebase.auth){
      auth = firebase.auth();

      auth.onAuthStateChanged(user=>{

        currentUser = user || null;

        if(!user){

          currentMember = null;

          syncMemberUI();

          return;
        }

        db.collection('members')
          .doc(user.uid)
          .onSnapshot(
            snap=>{

              currentMember = snap.exists
                ? {
                    id:user.uid,
                    email:user.email || '',
                    ...snap.data()
                  }
                : {
                    id:user.uid,
                    email:user.email || '',
                    nickname:user.displayName || '',
                    credit:0
                  };

              syncMemberUI();

            },
            ()=>syncMemberUI()
          );

      });

    }

  }catch(err){

    console.error(
      'YMK V16 Firebase init failed',
      err
    );
  }
}


/* =========================================================
   3. MEMBER UI FIX
   ========================================================= */

function syncMemberUI(){

  const guest = $('#guestMember');
  const logged = $('#loggedMember');

  const isLogged = !!currentUser;

  document.documentElement
    .classList
    .toggle(
      'ymGuestSession',
      !isLogged
    );

  if(guest){

    guest.hidden = isLogged;

    guest.style.setProperty(
      'display',
      isLogged ? 'none' : 'block',
      'important'
    );
  }

  if(logged){

    logged.hidden = !isLogged;

    logged.style.setProperty(
      'display',
      isLogged ? 'block' : 'none',
      'important'
    );
  }

  const memberBtn =
    $('#memberOpen span');

  if(memberBtn){

    memberBtn.textContent =
      isLogged
        ? (
            currentMember?.nickname ||
            'สมาชิก'
          )
        : 'สมาชิก';
  }

  if(isLogged){

    if($('#memberName')){
      $('#memberName').textContent =
        currentMember?.nickname ||
        currentUser.displayName ||
        'สมาชิก Yuimellkub';
    }

    if($('#memberEmail')){
      $('#memberEmail').textContent =
        currentUser.email || '';
    }

    $$('[data-wallet]')
      .forEach(el=>{
        el.textContent =
          '฿' +
          Number(
            currentMember?.credit || 0
          ).toLocaleString('th-TH');
      });

    if($('#memberTitle')){
      $('#memberTitle').textContent =
        '♡ บัญชีสมาชิก';
    }

  }else{

    if($('#memberTitle')){
      $('#memberTitle').textContent =
        '♡ สมาชิก';
    }
  }

  $$('[data-ym-order-pay="credit"]')
    .forEach(btn=>{

      btn.hidden = !isLogged;

      btn.style.setProperty(
        'display',
        isLogged ? '' : 'none',
        'important'
      );
    });
}


/* =========================================================
   4. READY PRODUCT — REALTIME STATE
   ========================================================= */

function readyFromButton(btn,mode){

  if(!btn) return null;

  const card =
    btn.closest('.ready-stock-card');

  if(!card) return null;

  const send =
    mode === 'send';

  const name =
    clean(
      btn.dataset.readyName ||
      card
        .querySelector('.ymk-store-name')
        ?.textContent ||
      'สินค้า'
    );

  const unit =
    send
      ? num(btn.dataset.sendPrice)
      : num(btn.dataset.readyPrice);

  if(!(unit > 0)) return null;

  return {
    type:'ready',

    productId:
      btn.dataset.productId ||
      card.dataset.productId ||
      '',

    category:
      btn.dataset.readyCategory ||
      card.dataset.readyCategory ||
      '',

    name,
    unit,

    mode:
      send
        ? 'send'
        : 'instant'
  };
}


function orderQty(){

  return Math.max(
    1,
    Math.min(
      99,
      Math.floor(
        Number(
          $('#ymOrderQty')?.value
        ) || 1
      )
    )
  );
}


function readyExactEchoPack(state,q){

  if(!state) return '';

  const m =
    String(state.name || '')
      .replace(/,/g,'')
      .match(
        /(\d+)\s*กระดุม/i
      );

  if(!m) return '';

  return (
    Number(m[1])
      .toLocaleString('th-TH') +
    ' × ' +
    q
  );
}


function currentReadyPack(){

  if(!readyState) return '';

  if(readyState.mode === 'send'){
    return 'แบบส่ง';
  }

  const exact =
    readyExactEchoPack(
      readyState,
      orderQty()
    );

  if(exact){
    return exact;
  }

  try{

    const o =
      window.lastOrder;

    const item =
      clean(
        o?.baseItem ||
        o?.item ||
        ''
      );

    if(
      item ===
      readyState.name &&
      o?.pack &&
      o.pack !== 'แบบส่ง'
    ){
      return String(
        o.pack
      ).trim();
    }

  }catch(e){}

  return '';
}


function removeDuplicateSendType(root){

  root =
    root || document;

  const lines =
    [...root.querySelectorAll(
      '.ymkOrderTypeLine,.ymk-send-type-line,.ymPackLine'
    )]
      .filter(el =>
        (
          el.textContent ||
          ''
        ).trim() ===
        'ประเภท: แบบส่ง'
      );

  lines
    .slice(1)
    .forEach(el=>el.remove());
}


function syncReadyUI(){

  if(
    !readyState ||
    document.body
      .classList
      .contains('ymCalcCheckout')
  ){
    return;
  }

  const q =
    orderQty();

  const total =
    readyState.unit * q;

  const pack =
    currentReadyPack();

  const selected =
    $('#ymOrderSelected');

  const packHtml =
    pack &&
    pack !== 'แบบส่ง'
      ? (
          '<span class="ymPackLine">' +
          'แพ็กที่เติม: ' +
          esc(pack) +
          '</span>'
        )
      : '';

  const sendHtml =
    readyState.mode === 'send'
      ? (
          '<span class="ymPackLine ymkOrderTypeLine">' +
          'ประเภท: แบบส่ง' +
          '</span>'
        )
      : '';

  const item =
    readyState.name +
    (
      q > 1
        ? ' × ' + q
        : ''
    );

  if(selected){

    const wanted =
      '<b>' +
      esc(item) +
      '</b><br>' +
      'ราคา ' +
      fmt(total) +
      ' บาท' +
      packHtml +
      sendHtml;

    if(
      selected.innerHTML !==
      wanted
    ){
      selected.innerHTML =
        wanted;
    }
  }

  const amount =
    $('#ymOrderAmount');

  if(
    amount &&
    $('#ymProductPaymentOverlay')
      ?.classList
      .contains('show')
  ){
    amount.textContent =
      fmt(total) +
      ' บาท';
  }

  const summary =
    $('#ymOrderSummary');

  if(
    summary &&
    $('#ymProductPaymentOverlay')
      ?.classList
      .contains('show')
  ){

    const uid =
      $('#ymOrderUid')
        ?.value
        ?.trim() ||
      '-';

    const server =
      $('#ymOrderServer')
        ?.value ||
      'Asia';

    const name =
      $('#ymOrderName')
        ?.value
        ?.trim() ||
      '';

    summary.innerHTML =
      '<b>' +
      esc(item) +
      '</b>' +
      packHtml +
      sendHtml +
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

  window.YMK_ACTIVE_PRODUCT_ORDER = {
    productId:
      readyState.productId,

    name:
      readyState.name,

    category:
      readyState.category,

    mode:
      readyState.mode,

    unit:
      readyState.unit,

    quantity:q,

    total
  };

  try{

    window.lastOrder = {
      ...(window.lastOrder || {}),

      item,
      baseItem:
        readyState.name,

      productId:
        readyState.productId,

      category:
        readyState.category,

      quantity:q,

      price:
        fmt(total) +
        ' บาท',

      totalPrice:
        total,

      pack:
        pack,

      packPlan:
        pack,

      orderMode:
        readyState.mode
    };

  }catch(e){}

  if(
    readyState.mode ===
    'send'
  ){

    window.YMK_SEND_SELECTION = {
      mode:'send',
      name:readyState.name,
      category:
        readyState.category,
      price:
        readyState.unit,
      quantity:q,
      total
    };

    window.YMK_SEND_ORDER_META = {
      mode:'send',
      q,
      base:
        readyState.name,
      unit:
        readyState.unit,
      total
    };

  }else{

    window.YMK_SEND_SELECTION =
      null;

    window.YMK_SEND_ORDER_META =
      null;
  }

  removeDuplicateSendType(
    selected
  );

  removeDuplicateSendType(
    summary
  );
}


function scheduleReadySync(){

  [
    0,
    20,
    60,
    120,
    220,
    400,
    650
  ].forEach(ms=>{
    setTimeout(
      syncReadyUI,
      ms
    );
  });
}


/* =========================================================
   5. CALCULATOR STATE
   ========================================================= */

function snapshotCalc(){

  const x =
    window.YMK_LAST_CALC ||
    {};

  const summary =
    $('#ymOrderSummary');

  const selected =
    $('#ymOrderSelected');

  const item =
    String(
      x.item ||
      selected
        ?.querySelector('b')
        ?.textContent ||
      summary
        ?.querySelector('b')
        ?.textContent ||
      'รายการคำนวณ'
    )
      .replace(
        /\s*[×xX]\s*\d+\s*$/,
        ''
      )
      .trim();

  let pack =
    String(
      x.pack || ''
    ).trim();

  if(!pack){

    const text =
      (
        summary?.innerText ||
        selected?.innerText ||
        ''
      );

    const m =
      text.match(
        /แพ็กที่เติม:\s*([^\n]+)/i
      );

    if(m){
      pack =
        m[1].trim();
    }
  }

  const price =
    num(
      $('#ymOrderAmount')
        ?.textContent
    ) ||
    num(x.price);

  return {
    type:'calc',

    calcType:
      x.type || '',

    item,
    pack,
    price,

    normal:
      x.normal,

    special:
      x.special,

    specialBalls:
      x.specialBalls,

    need:
      x.need,

    totalEchoes:
      x.totalEchoes
  };
}


/* =========================================================
   6. COMMON CHECKOUT SNAPSHOT
   ========================================================= */

function getCheckout(){

  if(
    document.body
      .classList
      .contains(
        'ymCalcCheckout'
      )
  ){

    const c =
      calcState ||
      snapshotCalc();

    const price =
      num(
        $('#ymOrderAmount')
          ?.textContent
      ) ||
      c.price;

    return {
      ...c,

      price,

      quantity:1,

      uid:
        $('#ymOrderUid')
          ?.value
          ?.trim() ||
        '',

      server:
        $('#ymOrderServer')
          ?.value ||
        'Asia',

      name:
        $('#ymOrderName')
          ?.value
          ?.trim() ||
        '',

      orderMode:
        'calculator'
    };
  }

  if(!readyState){
    return null;
  }

  syncReadyUI();

  const q =
    orderQty();

  const total =
    readyState.unit * q;

  return {
    type:'ready',

    item:
      readyState.name +
      (
        q > 1
          ? ' × ' + q
          : ''
      ),

    baseItem:
      readyState.name,

    pack:
      currentReadyPack(),

    price:
      total,

    quantity:q,

    uid:
      $('#ymOrderUid')
        ?.value
        ?.trim() ||
      '',

    server:
      $('#ymOrderServer')
        ?.value ||
      'Asia',

    name:
      $('#ymOrderName')
        ?.value
        ?.trim() ||
      '',

    orderMode:
      readyState.mode,

    productId:
      readyState.productId,

    category:
      readyState.category
  };
}


/* =========================================================
   7. LEGACY PRODUCTION BRIDGE
   ========================================================= */

function ensureHidden(id,type){

  let el =
    $('#' + id);

  if(el) return el;

  el =
    document.createElement(
      'input'
    );

  el.id = id;
  el.type =
    type || 'text';

  el.style.cssText =
    'display:none!important';

  document.body.appendChild(
    el
  );

  return el;
}


function ensureLegacy(){

  ensureHidden(
    'orderUid'
  );

  ensureHidden(
    'orderName'
  );

  let server =
    $('#orderServer');

  if(!server){

    server =
      document.createElement(
        'select'
      );

    server.id =
      'orderServer';

    server.innerHTML =
      '<option value="Asia">Asia</option>' +
      '<option value="NA-EU">NA-EU</option>' +
      '<option value="อื่น ๆ">อื่น ๆ</option>';

    server.style.cssText =
      'display:none!important';

    document.body.appendChild(
      server
    );
  }

  let slip =
    $('#slipFile');

  if(!slip){

    slip =
      document.createElement(
        'input'
      );

    slip.type =
      'file';

    slip.accept =
      'image/*';

    slip.id =
      'slipFile';

    slip.style.cssText =
      'display:none!important';

    document.body.appendChild(
      slip
    );
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

    status.style.cssText =
      'display:none!important';

    document.body.appendChild(
      status
    );
  }
}


function copyFiles(from,to){

  if(
    !from?.files?.length ||
    !to
  ){
    return;
  }

  try{

    to.files =
      from.files;

    return;

  }catch(e){}

  try{

    const dt =
      new DataTransfer();

    [...from.files]
      .forEach(file=>
        dt.items.add(file)
      );

    to.files =
      dt.files;

  }catch(e){}
}


function prepareProductionOrder(order){

  ensureLegacy();

  $('#orderUid').value =
    order.uid;

  $('#orderServer').value =
    order.server;

  $('#orderName').value =
    order.name;

  copyFiles(
    $('#ymOrderSlip'),
    $('#slipFile')
  );

  window.lastOrder = {
    ...(window.lastOrder || {}),

    item:
      order.item,

    baseItem:
      order.baseItem ||
      order.item,

    pack:
      order.pack || '',

    packPlan:
      order.pack || '',

    price:
      fmt(order.price) +
      ' บาท',

    quantity:
      order.quantity || 1,

    orderMode:
      order.orderMode ||
      'instant',

    productId:
      order.productId || '',

    category:
      order.category || ''
  };

  window.getPaymentMethod =
    function(){

      const method =
        document
          .querySelector(
            '[data-ym-order-pay].on'
          )
          ?.dataset
          ?.ymOrderPay ||
        'qr';

      return method;
    };
}


/* =========================================================
   8. PREVIEW-CANONICAL PENDING / SUCCESS
   ========================================================= */

function pendingHTML(){

  return `
    <div
      class="ymSlipCheck"
      data-ym-v16-pending="1"
    >✓</div>

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
      <b>หมายเหตุ ♡</b><br>

      หากรอตรวจสอบเกินประมาณ
      <b>5–10 นาที</b>
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

  if(!st) return;

  st.className =
    'ymOrderStatus show ok ymSlipReviewDone ymV16Pending';

  st.innerHTML =
    pendingHTML();
}


function successHTML(id,order){

  const send =
    order?.orderMode ===
    'send';

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

    <div class="ymUDetails">

      ${
        order?.pack
          ? (
              'แพ็กที่เติม: ' +
              esc(order.pack) +
              '<br>'
            )
          : ''
      }

      ยอดชำระ:
      ${fmt(order?.price)} บาท

    </div>

    ${
      send
        ? `
          <div style="
            margin-top:12px;
            padding:12px 13px;
            border:1px solid #efc6d7;
            border-radius:14px;
            background:#fff3f8;
            text-align:center;
            font-size:12px;
            line-height:1.7
          ">
            รบกวนลูกค้าทักเพจร้าน
            พร้อมแจ้งเลขออเดอร์
            <b>${esc(id)}</b>
            เพื่อให้ทางร้านดำเนินการ
            แบบส่งต่อค่ะ ♡

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

    <div
      class="ymUActions"
      style="
        display:flex;
        flex-direction:column;
        gap:10px;
        margin-top:14px
      "
    >

      <button
        type="button"
        class="ymOrderBack"
        data-v16-copy="${esc(id)}"
      >
        คัดลอกเลขออเดอร์
      </button>

      <button
        type="button"
        class="ymOrderNext"
        data-v16-new-order
      >
        ทำรายการออเดอร์ใหม่
      </button>

    </div>
  `;
}


function showSuccess(id,order){

  const st =
    $('#ymOrderStatus');

  if(!st) return;

  st.className =
    'ymOrderStatus show ok ymUnifiedDone';

  st.innerHTML =
    successHTML(
      id,
      order
    );

  const submit =
    $('#ymOrderSubmitV16') ||
    $('#ymOrderSubmit');

  if(submit){
    submit.disabled = true;
  }
}


function showError(message){

  const st =
    $('#ymOrderStatus');

  if(!st) return;

  st.className =
    'ymOrderStatus show';

  st.textContent =
    message ||
    'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}


/* =========================================================
   9. ORDER ID
   ========================================================= */

function createOrderId(){

  const d =
    new Date();

  const pad =
    n =>
      String(n)
        .padStart(2,'0');

  return (
    'YMK' +
    String(
      d.getFullYear()
    ).slice(-2) +
    pad(
      d.getMonth() + 1
    ) +
    pad(
      d.getDate()
    ) +
    '-' +
    pad(
      d.getHours()
    ) +
    pad(
      d.getMinutes()
    ) +
    pad(
      d.getSeconds()
    )
  );
}


/* =========================================================
   10. CREDIT — REAL FIRESTORE
   ========================================================= */

async function payCredit(order){

  if(
    !db ||
    !auth?.currentUser
  ){
    throw Error(
      'กรุณาเข้าสู่ระบบก่อนชำระด้วยเครดิต'
    );
  }

  const uid =
    auth.currentUser.uid;

  let orderId =
    createOrderId();

  const now =
    firebase
      .firestore
      .FieldValue
      .serverTimestamp();

  await db.runTransaction(
    async tx=>{

      const memberRef =
        db.collection('members')
          .doc(uid);

      const memberSnap =
        await tx.get(
          memberRef
        );

      if(!memberSnap.exists){
        throw Error(
          'ไม่พบบัญชีสมาชิก'
        );
      }

      const balance =
        Number(
          memberSnap.data()
            .credit ||
          0
        );

      if(
        balance <
        Number(order.price)
      ){
        throw Error(
          'เครดิตไม่เพียงพอ กรุณาเติมเครดิตก่อน'
        );
      }

      let orderRef =
        db.collection('orders')
          .doc(orderId);

      let exists =
        await tx.get(
          orderRef
        );

      if(exists.exists){

        orderId =
          createOrderId() +
          '-' +
          Math.random()
            .toString(36)
            .slice(2,4)
            .toUpperCase();

        orderRef =
          db.collection('orders')
            .doc(orderId);
      }

      const remain =
        balance -
        Number(order.price);

      tx.update(
        memberRef,
        {
          credit:remain,
          updatedAt:now,
          lastCreditOrderId:
            orderId
        }
      );

      tx.set(
        orderRef,
        {
          id:orderId,

          item:
            order.item,

          pack:
            order.pack || '',

          price:
            fmt(order.price) +
            ' บาท',

          quantity:
            order.quantity ||
            1,

          orderMode:
            order.orderMode ||
            'instant',

          calculator:
            order.type ===
            'calc',

          paymentMethod:
            'เครดิต',

          memberId:
            uid,

          uid:
            order.uid,

          server:
            order.server,

          name:
            order.name,

          paymentStatus:
            'ชำระแล้ว',

          shopStatus:
            'รอเติม',

          orderReady:true,

          createdAt:now
        }
      );

      tx.set(
        db.collection(
          'order_status'
        ).doc(orderId),

        {
          status:
            'รอเติม',

          paymentStatus:
            'ชำระแล้ว',

          orderReady:true,

          memberId:
            uid,

          updatedAt:
            now
        }
      );

      tx.set(
        db.collection(
          'credit_history'
        ).doc(orderId),

        {
          memberId:
            uid,

          type:
            'purchase',

          label:
            'ชำระ ' +
            order.item,

          amount:
            -Number(
              order.price
            ),

          balanceAfter:
            remain,

          orderId,

          createdAt:
            now
        }
      );

    }
  );

  return orderId;
}


/* =========================================================
   11. NORMAL SLIP → REAL PRODUCTION / ADMIN
   ========================================================= */

async function submitSlip(order){

  if(
    !$('#ymOrderSlip')
      ?.files?.[0]
  ){
    throw Error(
      'กรุณาแนบสลิปชำระเงินก่อนส่งออเดอร์'
    );
  }

  prepareProductionOrder(
    order
  );

  if(
    typeof window
      .saveOrderToDemoAdmin !==
    'function'
  ){
    throw Error(
      'ระบบออเดอร์ยังโหลดไม่เสร็จ กรุณาลองใหม่อีกครั้ง'
    );
  }

  const result =
    await window
      .saveOrderToDemoAdmin();

  if(result === false){
    throw Error(
      'ยังส่งสลิปเข้าสู่ระบบร้านไม่สำเร็จ'
    );
  }

  /*
    Auto mode อาจได้เลขออเดอร์ทันที
    Manual mode ต้องไม่มีเลขก่อน Admin approve
  */
  const id =
    String(
      window.currentOrderId ||
      ''
    ).trim();

  if(
    /^YMK\d{6}-\d{6}/
      .test(id)
  ){
    showSuccess(
      id,
      order
    );
  }else{
    showPending();
  }

  return true;
}


/* =========================================================
   12. REPLACE PREVIEW SUBMIT BUTTON AT CLICK-TIME
   ========================================================= */

function promoteSubmitButton(){

  const btn =
    $('#ymOrderSubmit');

  if(!btn) return;

  btn.id =
    'ymOrderSubmitV16';

  btn.dataset.ymV16 =
    '1';
}


function restoreSubmitButton(){

  const btn =
    $('#ymOrderSubmitV16');

  if(!btn) return;

  btn.id =
    'ymOrderSubmit';
}


/*
  pointerdown happens before Preview's old click listeners.
  Rename the button so old Preview/demo checkout handlers
  no longer recognise #ymOrderSubmit.
*/
window.addEventListener(
  'pointerdown',
  e=>{

    if(
      e.target.closest?.(
        '#ymOrderSubmit'
      )
    ){
      promoteSubmitButton();
    }

  },
  true
);


/* =========================================================
   13. MAIN SUBMIT
   ========================================================= */

window.addEventListener(
  'click',
  async e=>{

    const submit =
      e.target.closest?.(
        '#ymOrderSubmitV16'
      );

    if(!submit) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const order =
      getCheckout();

    if(!order){
      showError(
        'ไม่พบข้อมูลรายการ กรุณากลับไปเลือกรายการอีกครั้ง'
      );
      return false;
    }

    if(!order.uid){
      showError(
        'กรุณากรอก UID / ID ผู้เล่น'
      );

      $('#ymOrderUid')
        ?.focus();

      return false;
    }

    activeCheckout =
      order;

    const method =
      document
        .querySelector(
          '[data-ym-order-pay].on'
        )
        ?.dataset
        ?.ymOrderPay ||
      'qr';

    submit.disabled =
      true;

    try{

      if(method === 'credit'){

        const id =
          await payCredit(
            order
          );

        showSuccess(
          id,
          order
        );

      }else{

        showError(
          'กำลังส่งสลิปเข้าสู่ระบบร้าน…'
        );

        await submitSlip(
          order
        );
      }

    }catch(err){

      console.error(
        'YMK V16 submit failed',
        err
      );

      showError(
        err?.message ||
        'ส่งออเดอร์ไม่สำเร็จ กรุณาลองใหม่'
      );

      submit.disabled =
        false;
    }

    return false;

  },
  true
);


/* =========================================================
   14. PRODUCTION STATUS → PREVIEW UI
   ========================================================= */

function syncProductionStatus(){

  if(!activeCheckout){
    return;
  }

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

  if(
    /รอร้านตรวจสอบ|กำลังรอร้านตรวจสอบ|ส่งสลิปแล้ว|ยังไม่มีการสร้างออเดอร์/.test(
      text
    )
  ){
    showPending();
  }

  const match =
    text.match(
      /YMK\d{6}-\d{6}(?:-[A-Z0-9]+)?/
    );

  if(
    match &&
    /ส่งออเดอร์เข้าระบบแล้ว|ยืนยันสลิป|เลขออเดอร์/.test(
      text
    )
  ){
    showSuccess(
      match[0],
      activeCheckout
    );
  }

  if(
    /สลิปไม่ผ่าน|ไม่สำเร็จ|ผิดพลาด/.test(
      text
    )
  ){
    showError(
      text
    );

    const btn =
      $('#ymOrderSubmitV16');

    if(btn){
      btn.disabled =
        false;
    }
  }
}


function watchStatus(){

  ensureLegacy();

  const status =
    $('#adminSaveStatus');

  if(!status){
    return;
  }

  statusObserver
    ?.disconnect();

  statusObserver =
    new MutationObserver(
      syncProductionStatus
    );

  statusObserver.observe(
    status,
    {
      childList:true,
      subtree:true,
      characterData:true
    }
  );

  setInterval(
    syncProductionStatus,
    400
  );
}


/* =========================================================
   15. NEW ORDER / COPY
   ========================================================= */

document.addEventListener(
  'click',
  e=>{

    const copy =
      e.target.closest?.(
        '[data-v16-copy]'
      );

    if(copy){

      const id =
        copy.getAttribute(
          'data-v16-copy'
        );

      const done =
        ()=>{
          const old =
            copy.textContent;

          copy.textContent =
            'คัดลอกแล้ว ✓';

          setTimeout(()=>{
            if(copy.isConnected){
              copy.textContent =
                old;
            }
          },1000);
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
        '[data-v16-new-order]'
      )
    ){

      readyState =
        null;

      calcState =
        null;

      activeCheckout =
        null;

      window.lastOrder =
        null;

      window.YMK_ACTIVE_PRODUCT_ORDER =
        null;

      window.YMK_SEND_SELECTION =
        null;

      window.YMK_SEND_ORDER_META =
        null;

      window.YMK_LAST_CALC =
        null;

      document.body
        .classList
        .remove(
          'ymCalcCheckout'
        );

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
        slip.value =
          '';
      }

      const preview =
        $('#ymOrderSlipPreview');

      if(preview){
        preview.innerHTML =
          '';
      }

      if($('#ymOrderUid')){
        $('#ymOrderUid').value =
          '';
      }

      if($('#ymOrderName')){
        $('#ymOrderName').value =
          '';
      }

      if($('#ymOrderQty')){
        $('#ymOrderQty').value =
          '1';
      }

      $('#ymProductPaymentOverlay')
        ?.classList
        .remove('show');

      $('#ymProductOrderOverlay')
        ?.classList
        .remove('show');

      restoreSubmitButton();

      const submit =
        $('#ymOrderSubmit');

      if(submit){
        submit.disabled =
          false;
      }

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
   16. READY PRODUCT EVENTS
   ========================================================= */

window.addEventListener(
  'pointerdown',
  e=>{

    const send =
      e.target.closest?.(
        '.ymk-send-choice'
      );

    if(send){

      document.body
        .classList
        .remove(
          'ymCalcCheckout'
        );

      calcState =
        null;

      const card =
        send.closest(
          '.ready-stock-card'
        );

      const normal =
        card?.querySelector(
          '.ready-stock-order-btn'
        );

      readyState =
        readyFromButton(
          normal,
          'send'
        );

      window.lastOrder =
        null;

      scheduleReadySync();

      return;
    }


    const normal =
      e.target.closest?.(
        '.ready-stock-order-btn'
      );

    if(
      normal &&
      !normal.closest(
        '#ymkNativeOrderProxyHost'
      )
    ){

      document.body
        .classList
        .remove(
          'ymCalcCheckout'
        );

      calcState =
        null;

      readyState =
        readyFromButton(
          normal,
          'instant'
        );

      window.lastOrder =
        null;

      scheduleReadySync();
    }

  },
  true
);


document.addEventListener(
  'click',
  e=>{

    if(
      e.target.closest?.(
        '#ymOrderQtyPlus,#ymOrderQtyMinus,#ymOrderNext,[data-ym-order-pay]'
      )
    ){
      setTimeout(
        syncReadyUI,
        0
      );

      setTimeout(
        syncReadyUI,
        40
      );

      setTimeout(
        syncReadyUI,
        120
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
      syncReadyUI();
    }

  },
  true
);


/* =========================================================
   17. CALCULATOR EVENTS
   ========================================================= */

window.addEventListener(
  'pointerdown',
  e=>{

    if(
      e.target.closest?.(
        '#ymCalcOrder,#ymCalcPopupOrder,.ymCalcOrderBtn,[data-calc-order]'
      )
    ){

      readyState =
        null;

      calcState =
        snapshotCalc();

      activeCheckout =
        null;
    }

  },
  true
);


/* =========================================================
   18. SEND TYPE — ALWAYS ONE LINE
   ========================================================= */

function dedupeSendEverywhere(){

  removeDuplicateSendType(
    $('#ymOrderSelected')
  );

  removeDuplicateSendType(
    $('#ymOrderSummary')
  );
}


new MutationObserver(
  ()=>{
    dedupeSendEverywhere();
  }
).observe(
  document.documentElement,
  {
    childList:true,
    subtree:true
  }
);


/* =========================================================
   19. ORDER CHECK — REAL ORDER + FULFILLMENT SLIP
   ========================================================= */

async function getOrder(id){

  if(!db){
    throw Error(
      'ยังเชื่อมฐานข้อมูลไม่สำเร็จ'
    );
  }

  const raw =
    String(id || '')
      .trim()
      .replace(/^#/,'')
      .toUpperCase();

  if(!raw){
    throw Error(
      'กรุณากรอกเลขออเดอร์'
    );
  }

  let orderId =
    raw;

  let orderSnap =
    null;

  if(
    /^YMK\d{6}-\d{6}(?:-[A-Z0-9]+)?$/
      .test(raw)
  ){

    orderSnap =
      await db
        .collection('orders')
        .doc(raw)
        .get();

  }else{

    let snap;

    try{

      snap =
        await db
          .collection('orders')
          .orderBy(
            'createdAt',
            'desc'
          )
          .limit(200)
          .get();

    }catch(e){

      snap =
        await db
          .collection('orders')
          .limit(200)
          .get();
    }

    const found =
      snap.docs.find(d =>
        String(d.id)
          .toUpperCase()
          .endsWith(raw)
      );

    if(!found){
      return null;
    }

    orderId =
      found.id;

    orderSnap =
      found;
  }

  const statusSnap =
    await db
      .collection(
        'order_status'
      )
      .doc(orderId)
      .get();

  if(
    !orderSnap?.exists &&
    !statusSnap.exists
  ){
    return null;
  }

  const order =
    orderSnap?.exists
      ? orderSnap.data()
      : {};

  const status =
    statusSnap.exists
      ? statusSnap.data()
      : {};

  const proof =
    Array.isArray(
      status
        .fulfillmentSlipDataList
    )
      ? status
          .fulfillmentSlipDataList
          .filter(x =>
            typeof x ===
              'string' &&
            x.startsWith(
              'data:image/'
            )
          )
      : (
          status
            .fulfillmentSlipData
            ? [
                status
                  .fulfillmentSlipData
              ]
            : []
        );

  return {
    id:orderId,
    ...order,
    ...status,
    proof
  };
}


function openProof(src){

  const viewer =
    document.createElement(
      'div'
    );

  viewer.className =
    'ymkV16Viewer';

  viewer.innerHTML =
    '<img src="' +
    src +
    '" alt="สลิปการเติมเกม">';

  viewer.onclick =
    ()=>viewer.remove();

  document.body.appendChild(
    viewer
  );
}


function renderOrderLookup(order){

  const result =
    $('#orderPopupResult');

  if(!result) return;

  const status =
    order.shopStatus ||
    order.status ||
    order.paymentStatus ||
    'รอดำเนินการ';

  const showProof =
    String(status).trim() ===
      'สำเร็จ' &&
    order.proof?.length;

  result.classList.add(
    'show'
  );

  result.innerHTML = `
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
          <small>รายการ</small>
          <b>
            ${esc(order.item || '-')}
          </b>
        </div>

        <div>
          <small>แพ็ก / ประเภท</small>
          <b>
            ${esc(order.pack || '-')}
          </b>
        </div>

        <div>
          <small>UID</small>
          <b>
            ${esc(order.uid || '-')}
          </b>
        </div>

        <div>
          <small>Server</small>
          <b>
            ${esc(order.server || '-')}
          </b>
        </div>

      </div>

      ${
        showProof
          ? `
            <div class="ymkV16Proof">

              <div class="ymkV16ProofTitle">
                สลิปการเติมเกม
                (${order.proof.length} รูป)
              </div>

              <div class="ymkV16ProofGrid">

                ${order.proof
                  .map(
                    (src,i)=>`
                      <img
                        src="${src}"
                        data-v16-proof="${i}"
                        alt="สลิปการเติมเกม ${i+1}"
                      >
                    `
                  )
                  .join('')}

              </div>

            </div>
          `
          : (
              String(status).trim() ===
                'สำเร็จ'
                ? `
                    <div style="
                      margin-top:10px;
                      font-size:10px;
                      text-align:center;
                      color:#aa7589
                    ">
                      ออเดอร์สำเร็จแล้ว
                      แต่ร้านยังไม่ได้แนบสลิปการเติมเกม
                    </div>
                  `
                : ''
            )
      }

    </div>
  `;

  $$(
    '[data-v16-proof]'
  ).forEach(img=>{

    img.onclick =
      ()=>openProof(
        img.src
      );
  });
}


/*
  Rename before old Preview lookup click handler fires.
*/
window.addEventListener(
  'pointerdown',
  e=>{

    const btn =
      e.target.closest?.(
        '#orderPopupSubmit'
      );

    if(btn){
      btn.id =
        'orderPopupSubmitV16';
    }

  },
  true
);


window.addEventListener(
  'click',
  async e=>{

    const btn =
      e.target.closest?.(
        '#orderPopupSubmitV16'
      );

    if(!btn) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const input =
      $('#orderPopupInput');

    const result =
      $('#orderPopupResult');

    if(!result) return;

    result.classList.add(
      'show'
    );

    result.textContent =
      'กำลังตรวจสอบออเดอร์…';

    try{

      const order =
        await getOrder(
          input?.value
        );

      if(!order){

        result.innerHTML =
          '<div class="orderEmptyIcon">♡</div>' +
          'ไม่พบเลขออเดอร์นี้ในระบบ';

        return;
      }

      renderOrderLookup(
        order
      );

    }catch(err){

      console.error(
        'YMK V16 order lookup',
        err
      );

      result.textContent =
        'ตรวจสอบออเดอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
    }

  },
  true
);


/* =========================================================
   20. MEMBER UI RE-SYNC AFTER OLD PREVIEW HANDLERS
   ========================================================= */

document.addEventListener(
  'click',
  e=>{

    if(
      e.target.closest?.(
        '#loginBtn,#registerBtn,#logoutBtn,#memberOpen'
      )
    ){

      setTimeout(
        syncMemberUI,
        50
      );

      setTimeout(
        syncMemberUI,
        250
      );

      setTimeout(
        syncMemberUI,
        600
      );
    }

  },
  true
);


/* =========================================================
   21. START
   ========================================================= */

function boot(){

  installStyle();

  firebaseBoot();

  ensureLegacy();

  watchStatus();

  syncMemberUI();

  setTimeout(
    syncMemberUI,
    300
  );

  setTimeout(
    syncMemberUI,
    800
  );
}


if(
  document.readyState ===
  'loading'
){
  document.addEventListener(
    'DOMContentLoaded',
    boot,
    {once:true}
  );
}else{
  boot();
}

})();
