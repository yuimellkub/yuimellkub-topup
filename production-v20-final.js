(function(){
'use strict';

/*
  YUIMELLKUB PRODUCTION V20 FINAL
  - Ready-stock uses the same Preview calculator checkout UI
  - Slip submit is production-backed before Pending is shown
  - Member UI follows Firebase Auth
  - Order tracking reads real Firestore
  - Fulfillment slips can be viewed/saved
  - Card sizing/motion uses Preview's original .product behavior
*/

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;',
  '<':'&lt;',
  '>':'&gt;',
  '"':'&quot;',
  "'":'&#39;'
}[c]));

const num=v=>{
  const m=String(v??'')
    .replace(/,/g,'')
    .match(/\d+(?:\.\d+)?/);

  return m
    ? Number(m[0])
    : 0;
};

const fmt=n=>
  Math.round(Number(n)||0)
    .toLocaleString('th-TH');


let readyMeta=null;
let lastStatusText='';


/* =========================================================
   1. CARD / MOTION
   ========================================================= */

function installStyle(){

  if(
    $('#ymkProductionV20Style')
  ){
    return;
  }


  const s=
    document.createElement(
      'style'
    );


  s.id=
    'ymkProductionV20Style';


  s.textContent=`

    /*
      ใช้ฟีล Motion แบบ Preview
      และหยุดการ์ดไม่ให้ stretch ตามความสูงของแถว
    */

    #products .products{
      align-items:start!important;
    }


    #products .ready-stock-card{
      height:auto!important;
      min-height:0!important;

      align-self:start!important;

      animation:none!important;

      transform:
        translateY(0);

      transition:
        .2s ease!important;
    }


    #products .ready-stock-card:hover{
      transform:
        translateY(-3px)!important;

      box-shadow:
        0 10px 22px
        rgba(
          177,
          90,
          125,
          .09
        )!important;
    }


    #products
    .ready-stock-card
    .ymk-store-bottom{

      display:flex;

      flex-direction:column;

      gap:7px;
    }


    #products
    .ready-stock-card
    .ymk-send-choice{

      width:100%;

      box-sizing:border-box;

      margin:0;

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
      display:none!important;
    }


    .ymk-track-proof{

      margin-top:12px;

      padding:11px;

      border:
        1px solid
        #f0ccda;

      border-radius:
        13px;

      background:
        #fff8fb;
    }


    .ymk-track-proof-grid{

      display:grid;

      grid-template-columns:
        repeat(
          3,
          minmax(0,1fr)
        );

      gap:7px;

      margin-top:8px;
    }


    .ymk-track-proof-grid img{

      display:block;

      width:100%;

      aspect-ratio:
        1/1;

      object-fit:
        cover;

      border-radius:
        9px;

      cursor:pointer;

      background:#fff;
    }


    .ymk-track-save{

      width:100%;

      min-height:42px;

      margin-top:9px;

      border:0;

      border-radius:
        11px;

      background:
        #df76a0;

      color:#fff;

      font:inherit;

      font-size:12px;

      font-weight:900;

      cursor:pointer;
    }


    .ymk-track-problem{

      margin-top:10px;

      padding:11px;

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

      text-align:center;
    }


    .ymk-track-problem a{

      display:block;

      margin-top:8px;

      padding:
        9px 11px;

      border-radius:
        10px;

      background:
        #df76a0;

      color:#fff;

      text-decoration:none;

      font-weight:900;
    }


    .ymk-proof-viewer{

      position:fixed;

      inset:0;

      z-index:
        9999999;

      display:flex;

      align-items:center;

      justify-content:center;

      padding:20px;

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

      background:#fff;
    }

  `;


  document.head
    .appendChild(s);
}


/* =========================================================
   2. MEMBER AUTH UI
   ========================================================= */

function syncMemberUI(user){

  const logged=
    !!user;


  const guest=
    $('#guestMember');


  const member=
    $('#loggedMember');


  if(guest){

    guest.hidden=
      logged;


    guest.style.setProperty(
      'display',
      logged
        ? 'none'
        : 'block',
      'important'
    );
  }


  if(member){

    member.hidden=
      !logged;


    member.style.setProperty(
      'display',
      logged
        ? 'block'
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
  ).forEach(btn=>{

    btn.hidden=
      !logged;


    btn.style.setProperty(
      'display',
      logged
        ? 'block'
        : 'none',
      'important'
    );
  });


  if(logged){

    if(
      $('#memberEmail')
    ){

      $('#memberEmail')
        .textContent=
        user.email||'';
    }
  }
}


function startMemberSync(){

  const start=()=>{

    if(
      !window.firebase ||
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
   3. READY STOCK -> CALCULATOR FLOW
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

    mode === 'send'

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
      mode === 'send'
        ? 'แบบส่ง'
        : name,

    price:
      unit,

    orderMode:
      mode === 'send'
        ? 'send'
        : 'instant',

    productId:
      normal.dataset
        .productId || '',

    category:
      normal.dataset
        .readyCategory || ''
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


  readyMeta=
    x;


  window.YMK_LAST_CALC={

    type:
      'echoes',

    item:
      x.item,

    pack:
      x.pack,

    price:
      fmt(
        x.price
      ) +
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


  const trigger=
    calcOrderButton();


  if(!trigger){

    console.error(
      'YMK V20: calculator checkout trigger not found'
    );

    return false;
  }


  trigger.click();


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


/* =========================================================
   4. PRODUCTION SLIP SUBMIT
   ========================================================= */

function ensureLegacyFields(){

  const make=(
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


      el.style.display=
        'none';


      document.body
        .appendChild(
          el
        );
    }


    return el;
  };


  make(
    'input',
    'orderUid'
  );


  make(
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


    server.style.display=
      'none';


    server.innerHTML=`
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
      .appendChild(
        server
      );
  }


  const file=
    make(
      'input',
      'slipFile'
    );


  file.type=
    'file';


  file.accept=
    'image/*';


  const status=
    make(
      'div',
      'adminSaveStatus'
    );


  status.style.display=
    'none';
}


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


  if(
    readyMeta

    &&

    window.lastOrder
  ){

    window.lastOrder.item=
      readyMeta.item;


    window.lastOrder.pack=
      readyMeta.pack;


    window.lastOrder.price=
      fmt(
        readyMeta.price
      ) +
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

      '<button type="button" class="ymOrderBack" data-v20-copy="'+
        esc(id)+
      '">คัดลอกเลขออเดอร์</button>'+

      '<button type="button" class="ymOrderNext" data-v20-new>ทำรายการออเดอร์ใหม่</button>'+

    '</div>';
}


/*
  เปลี่ยน id ก่อน Preview handler เก่าจะจับ
  แต่ถ้าจ่ายด้วยเครดิต ปล่อยให้ member bridge จัดการ
*/

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
      'ymOrderSubmitProdV20';

  },
  true
);


window.addEventListener(
  'click',
  async e=>{

    const btn=
      e.target.closest?.(
        '#ymOrderSubmitProdV20'
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

      /*
        สำคัญ:
        ต้องให้ backend ตอบว่ารับแล้วก่อน
        ถึงค่อยขึ้น Pending
      */

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
        'YMK V20 production submit failed',
        err
      );


      showSubmitError(
        'ส่งสลิปไม่สำเร็จ: ' +
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
   5. ADMIN STATUS -> PREVIEW SUCCESS UI
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
    /สลิปไม่ผ่าน|มีปัญหา|ไม่สำเร็จ|ผิดพลาด/
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
   6. COPY / NEW ORDER
   ========================================================= */

document.addEventListener(
  'click',
  e=>{

    const copy=
      e.target.closest?.(
        '[data-v20-copy]'
      );


    if(copy){

      const id=
        copy.dataset.v20Copy;


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
        '[data-v20-new]'
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
   7. REAL ORDER TRACKING
   ========================================================= */

function db(){

  try{

    if(
      !window.firebase ||
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
      raw ||
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
    !orderSnap ||
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
      .doc(id)
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


function playPop(){

  try{

    const AC=
      window.AudioContext ||
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
  order
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
      '<div class="orderEmptyIcon">♡</div>ไม่พบเลขออเดอร์นี้ในระบบ';


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
                        data-v20-proof="${i}"
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
              data-v20-save
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
      '[data-v20-proof]'
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
      '[data-v20-save]'
    );


  if(save){

    save.onclick=
      ()=>saveProofs(
        order.proof,
        order.id,
        save
      );
  }


  playPop();
}


/*
  กัน Preview lookup เก่า
*/

window.addEventListener(
  'pointerdown',
  e=>{

    const btn=
      e.target.closest?.(
        '#orderPopupSubmit'
      );


    if(btn){

      btn.id=
        'orderPopupSubmitProdV20';
    }

  },
  true
);


window.addEventListener(
  'click',
  async e=>{

    const btn=
      e.target.closest?.(
        '#orderPopupSubmitProdV20'
      );


    if(!btn){
      return;
    }


    e.preventDefault();

    e.stopPropagation();

    e.stopImmediatePropagation();


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
          input?.value ||
          ''
        );


      renderTracked(
        order
      );

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
          err?.message ||
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
   8. START
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
