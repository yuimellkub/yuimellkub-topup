(function(){
'use strict';

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

  return m?Number(m[0]):0;
};

const fmt=n=>
  Math.round(Number(n)||0)
    .toLocaleString('th-TH');

let active=null;
let lastLookupSound='';


/* =========================
   STYLE
========================= */

function addStyle(){

  if($('#ymkV17Style'))return;

  const s=document.createElement('style');

  s.id='ymkV17Style';

  s.textContent=`

  .realProductPane .products{
    align-items:start!important;
  }

  .ready-stock-card.ymk-production-card{
    height:auto!important;
    min-height:250px!important;
    align-self:start!important;

    transform:translateY(0)!important;

    transition:.2s ease!important;

    will-change:
      transform,
      box-shadow!important;
  }

  .ready-stock-card.ymk-production-card:hover{
    transform:translateY(-3px)!important;

    box-shadow:
      0 10px 22px
      rgba(177,90,125,.09)!important;
  }

  .ready-stock-card .ymk-store-bottom{
    margin-top:auto!important;
    padding-top:8px!important;
  }

  .ready-stock-card .ready-stock-order-btn,
  .ready-stock-card .ymk-send-choice{
    height:42px!important;
    min-height:42px!important;
    border-radius:10px!important;
  }

  #ymOrderStatus.ymkV17Status{
    display:block!important;
    margin-top:10px!important;
  }

  #ymOrderStatus.ymkV17Status .ymUActions{
    display:flex!important;
    flex-direction:column!important;
    gap:10px!important;
    margin-top:14px!important;
  }

  #ymOrderStatus.ymkV17Status .ymUActions button{
    width:100%!important;
    margin:0!important;
  }

  .ymkV17Problem{
    margin-top:10px;
    padding:12px;

    border:1px solid #efbfd0;
    border-radius:13px;

    background:#fff2f6;
    color:#9e506d;

    font-size:11px;
    line-height:1.65;
    text-align:center;
  }

  .ymkV17Problem a{
    display:block;

    margin-top:9px;
    padding:9px 12px;

    border-radius:11px;

    background:#df76a0;
    color:#fff;

    text-decoration:none;
    font-weight:900;
  }

  .ymkV17SaveAll{
    width:100%;
    min-height:42px;

    margin-top:9px;

    border:0;
    border-radius:11px;

    background:#df76a0;
    color:#fff;

    font:inherit;
    font-size:12px;
    font-weight:900;

    cursor:pointer;
  }

  `;

  document.head.appendChild(s);
}


/* =========================
   FIREBASE / MEMBER
========================= */

function firebaseReady(){

  return !!(
    window.firebase &&
    firebase.apps &&
    firebase.apps.length &&
    firebase.firestore &&
    firebase.auth
  );
}


function user(){

  try{
    return firebase.auth().currentUser;
  }catch(e){
    return null;
  }
}


async function memberProfile(){

  const u=user();

  if(!u || !firebaseReady()){
    return null;
  }

  try{

    const s=
      await firebase
        .firestore()
        .collection('members')
        .doc(u.uid)
        .get();

    return s.exists
      ? {
          id:u.uid,
          email:u.email||'',
          ...s.data()
        }
      : {
          id:u.uid,
          email:u.email||'',
          credit:0
        };

  }catch(e){

    return {
      id:u.uid,
      email:u.email||'',
      credit:0
    };
  }
}


async function syncMember(){

  const u=user();

  const logged=!!u;

  const guest=
    $('#guestMember');

  const member=
    $('#loggedMember');


  if(guest){

    guest.hidden=logged;

    guest.style.setProperty(
      'display',
      logged
        ? 'none'
        : 'block',
      'important'
    );
  }


  if(member){

    member.hidden=!logged;

    member.style.setProperty(
      'display',
      logged
        ? 'block'
        : 'none',
      'important'
    );
  }


  $$(
    '[data-ym-order-pay="credit"]'
  ).forEach(b=>{

    b.hidden=!logged;

    b.classList.toggle(
      'ymCreditAllowed',
      logged
    );

    b.classList.toggle(
      'ymCreditHidden',
      !logged
    );

    b.style.setProperty(
      'display',
      logged
        ? 'block'
        : 'none',
      'important'
    );
  });


  if(!logged){
    return;
  }


  const p=
    await memberProfile();


  if($('#memberName')){

    $('#memberName').textContent=
      p?.nickname ||
      u.displayName ||
      'สมาชิก Yuimellkub';
  }


  if($('#memberEmail')){

    $('#memberEmail').textContent=
      u.email || '';
  }


  $$('[data-wallet]')
    .forEach(x=>{

      x.textContent=
        '฿'+
        Number(
          p?.credit||0
        ).toLocaleString(
          'th-TH'
        );
    });
}


/* =========================
   PRODUCT STATE
========================= */

function productState(normal,mode){

  if(!normal){
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
    (
      normal.dataset.readyName ||
      card
        .querySelector(
          '.ymk-store-name'
        )
        ?.textContent ||
      'สินค้า'
    ).trim();


  const unit=
    mode==='send'
      ? num(
          normal.dataset.sendPrice
        )
      : num(
          normal.dataset.readyPrice
        );


  if(!(unit>0)){
    return null;
  }


  return {
    name,
    unit,

    mode:
      mode==='send'
        ? 'send'
        : 'instant',

    productId:
      normal.dataset.productId ||
      '',

    category:
      normal.dataset.readyCategory ||
      ''
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


function updateOrderUI(){

  if(!active){
    return;
  }


  const q=qty();

  const total=
    active.unit*q;


  const item=
    active.name+
    (
      q>1
        ? ' × '+q
        : ''
    );


  const type=
    active.mode==='send'
      ? '<span class="ymPackLine ymk-v17-send">ประเภท: แบบส่ง</span>'
      : '';


  if($('#ymOrderSelected')){

    $('#ymOrderSelected')
      .innerHTML=
        '<b>'+
        esc(item)+
        '</b><br>'+
        'ราคา '+
        fmt(total)+
        ' บาท'+
        type;
  }


  window.YMK_ACTIVE_PRODUCT_ORDER={
    name:active.name,
    unit:active.unit,
    total,
    quantity:q,
    mode:active.mode,
    productId:active.productId,
    category:active.category
  };


  window.YMK_SEND_SELECTION=
    active.mode==='send'
      ? {
          mode:'send',
          name:active.name,
          price:active.unit,
          total,
          quantity:q,
          category:active.category
        }
      : null;


  window.YMK_SEND_ORDER_META=
    active.mode==='send'
      ? {
          mode:'send',
          base:active.name,
          unit:active.unit,
          total,
          q
        }
      : null;


  try{

    window.lastOrder={

      item,

      baseItem:
        active.name,

      price:
        fmt(total)+
        ' บาท',

      totalPrice:
        total,

      quantity:q,

      pack:
        active.mode==='send'
          ? 'แบบส่ง'
          : '',

      packPlan:
        active.mode==='send'
          ? 'แบบส่ง'
          : '',

      orderMode:
        active.mode,

      productId:
        active.productId,

      category:
        active.category
    };

  }catch(e){}
}


/* =========================
   DIRECT PREVIEW FLOW
========================= */

function openOrder(normal,mode){

  active=
    productState(
      normal,
      mode
    );


  if(!active){
    return;
  }


  document.body
    .classList
    .remove(
      'ymCalcCheckout'
    );


  window.YMK_LAST_CALC=null;


  if($('#ymOrderQty')){
    $('#ymOrderQty').value='1';
  }


  if($('#ymOrderStatus')){

    $('#ymOrderStatus')
      .className=
        'ymOrderStatus';

    $('#ymOrderStatus')
      .innerHTML='';
  }


  if($('#ymOrderSlip')){
    $('#ymOrderSlip').value='';
  }


  if($('#ymOrderSlipPreview')){
    $('#ymOrderSlipPreview')
      .innerHTML='';
  }


  updateOrderUI();


  const o=
    $('#ymProductOrderOverlay');

  const p=
    $('#ymProductPaymentOverlay');


  if(p){

    p.classList.remove('show');

    p.setAttribute(
      'aria-hidden',
      'true'
    );
  }


  if(o){

    o.classList.add('show');

    o.setAttribute(
      'aria-hidden',
      'false'
    );
  }
}


window.addEventListener(
  'click',
  e=>{

    const send=
      e.target.closest?.(
        '.ymk-send-choice'
      );

    const normal=
      e.target.closest?.(
        '.ready-stock-order-btn'
      );


    if(send){

      const n=
        send
          .closest(
            '.ready-stock-card'
          )
          ?.querySelector(
            '.ready-stock-order-btn'
          );


      if(!n){
        return;
      }


      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();


      openOrder(
        n,
        'send'
      );

      return false;
    }


    if(
      normal &&
      !normal.closest(
        '#ymkNativeOrderProxyHost'
      )
    ){

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();


      openOrder(
        normal,
        'instant'
      );

      return false;
    }

  },
  true
);


/* =========================
   GO PAYMENT
========================= */

window.addEventListener(
  'click',
  e=>{

    const next=
      e.target.closest?.(
        '#ymOrderNext'
      );


    if(
      !next ||
      !active ||
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


    const uid=
      $('#ymOrderUid')
        ?.value
        .trim() ||
      '';


    if(!uid){

      const st=
        $('#ymOrderStatus');


      if(st){

        st.className=
          'ymOrderStatus show';

        st.textContent=
          'กรุณากรอก UID / ID ผู้เล่น';
      }


      $('#ymOrderUid')
        ?.focus();

      return false;
    }


    updateOrderUI();


    const q=qty();

    const total=
      active.unit*q;


    const item=
      active.name+
      (
        q>1
          ? ' × '+q
          : ''
      );


    const type=
      active.mode==='send'
        ? '<span class="ymPackLine ymk-v17-send">ประเภท: แบบส่ง</span>'
        : '';


    const server=
      $('#ymOrderServer')
        ?.value ||
      'Asia';


    const name=
      $('#ymOrderName')
        ?.value
        .trim() ||
      '';


    if($('#ymOrderAmount')){

      $('#ymOrderAmount')
        .textContent=
          fmt(total)+
          ' บาท';
    }


    if($('#ymOrderSummary')){

      $('#ymOrderSummary')
        .innerHTML=
          '<b>'+
          esc(item)+
          '</b>'+
          type+
          '<br>UID: '+
          esc(uid)+
          ' • Server: '+
          esc(server)+
          (
            name
              ? '<br>ชื่อ: '+
                esc(name)
              : ''
          );
    }


    syncMember();


    const o=
      $('#ymProductOrderOverlay');

    const p=
      $('#ymProductPaymentOverlay');


    if(o){

      o.classList.remove('show');

      o.setAttribute(
        'aria-hidden',
        'true'
      );
    }


    if(p){

      p.classList.add('show');

      p.setAttribute(
        'aria-hidden',
        'false'
      );
    }


    return false;

  },
  true
);


document.addEventListener(
  'click',
  e=>{

    if(
      e.target.closest?.(
        '#ymOrderQtyPlus,#ymOrderQtyMinus'
      )
    ){
      setTimeout(
        updateOrderUI,
        0
      );
    }

  },
  true
);


document.addEventListener(
  'input',
  e=>{

    if(
      e.target?.id===
      'ymOrderQty'
    ){
      updateOrderUI();
    }

  },
  true
);


/* =========================
   PREVIEW STATUS UI
========================= */

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
      ระบบจะแสดงเลขออเดอร์
      สำหรับติดตามสถานะตามปกติ
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


function successHTML(id,isSend){

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
        data-v17-copy="${esc(id)}"
      >
        คัดลอกเลขออเดอร์
      </button>

      <button
        type="button"
        class="ymOrderNext"
        data-v17-new
      >
        ทำรายการออเดอร์ใหม่
      </button>

    </div>
  `;
}


function problemHTML(msg){

  return `

    <div class="ymSlipTitle">
      ออเดอร์มีปัญหา
    </div>

    <div
      class="ymSlipReceived"
      style="margin-top:8px"
    >
      ${esc(
        msg ||
        'ไม่สามารถดำเนินการต่อได้'
      )}
    </div>

    <div class="ymkV17Problem">

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
  `;
}


function renderStatus(){

  const src=
    $('#adminSaveStatus');

  const st=
    $('#ymOrderStatus');


  if(!src || !st){
    return;
  }


  const t=
    (
      src.textContent ||
      ''
    ).trim();


  if(!t){
    return;
  }


  const id=
    (
      t.match(
        /YMK\d{6}-\d{6}/
      ) ||
      []
    )[0] ||
    '';


  st.classList.add(
    'ymkV17Status'
  );


  if(
    /สลิปไม่ผ่าน|มีปัญหา|ไม่สำเร็จ|ผิดพลาด/
      .test(t)
  ){

    st.className=
      'ymOrderStatus show ymkV17Status';

    st.innerHTML=
      problemHTML(t);

  }else if(
    id &&
    /ส่งออเดอร์เข้าระบบแล้ว|ยืนยันสลิป|เลขออเดอร์/
      .test(t)
  ){

    st.className=
      'ymOrderStatus show ok ymkV17Status';


    st.innerHTML=
      successHTML(
        id,

        window
          .YMK_SEND_ORDER_META
          ?.mode==='send' ||

        window
          .lastOrder
          ?.orderMode==='send'
      );

  }else if(
    /รอร้านตรวจสอบ|กำลังรอร้านตรวจสอบ|ส่งสลิปแล้ว|ยังไม่มีการสร้างออเดอร์|กำลังส่งสลิป/
      .test(t)
  ){

    st.className=
      'ymOrderStatus show ok ymkV17Status';

    st.innerHTML=
      pendingHTML();
  }


  document
    .querySelectorAll(
      '#ymkForceCard[data-ymk-manual-state],#ymkFinalOrderStatusCard[data-ymk-manual-state]'
    )
    .forEach(x=>{

      x.style.setProperty(
        'display',
        'none',
        'important'
      );
    });
}


/* =========================
   COPY / NEW ORDER
========================= */

document.addEventListener(
  'click',
  e=>{

    const c=
      e.target.closest?.(
        '[data-v17-copy]'
      );


    if(c){

      const id=
        c.dataset.v17Copy;


      navigator
        .clipboard
        ?.writeText(id)
        .then(()=>{

          const o=
            c.textContent;

          c.textContent=
            'คัดลอกแล้ว ✓';


          setTimeout(
            ()=>{
              c.textContent=o;
            },
            900
          );

        })
        .catch(()=>{});


      return;
    }


    if(
      e.target.closest?.(
        '[data-v17-new]'
      )
    ){

      active=null;

      window.lastOrder=null;

      window.YMK_SEND_ORDER_META=null;

      window.YMK_SEND_SELECTION=null;


      const st=
        $('#ymOrderStatus');


      if(st){

        st.className=
          'ymOrderStatus';

        st.innerHTML='';
      }


      if($('#ymOrderSlip')){
        $('#ymOrderSlip').value='';
      }


      if($('#ymOrderSlipPreview')){
        $('#ymOrderSlipPreview')
          .innerHTML='';
      }


      $('#ymProductPaymentOverlay')
        ?.classList
        .remove('show');


      $('#ymProductOrderOverlay')
        ?.classList
        .remove('show');


      $('#products')
        ?.scrollIntoView({
          behavior:'smooth',
          block:'start'
        });
    }

  },
  true
);


/* =========================
   POP SOUND
========================= */

function playPop(){

  try{

    const A=
      window.AudioContext ||
      window.webkitAudioContext;


    if(!A){
      return;
    }


    const a=
      new A();


    const o=
      a.createOscillator();


    const g=
      a.createGain();


    o.type='sine';


    o.frequency
      .setValueAtTime(
        620,
        a.currentTime
      );


    o.frequency
      .exponentialRampToValueAtTime(
        880,
        a.currentTime+.07
      );


    g.gain
      .setValueAtTime(
        .0001,
        a.currentTime
      );


    g.gain
      .exponentialRampToValueAtTime(
        .07,
        a.currentTime+.012
      );


    g.gain
      .exponentialRampToValueAtTime(
        .0001,
        a.currentTime+.1
      );


    o.connect(g);

    g.connect(
      a.destination
    );


    o.start();

    o.stop(
      a.currentTime+.11
    );


    setTimeout(
      ()=>
        a.close()
          .catch(()=>{}),
      180
    );

  }catch(e){}
}


/* =========================
   SAVE ALL SLIPS
========================= */

async function saveAll(
  imgs,
  id,
  b
){

  const old=
    b.textContent;


  b.disabled=true;


  for(
    let i=0;
    i<imgs.length;
    i++
  ){

    b.textContent=
      'กำลังบันทึก '+
      (i+1)+
      '/'+
      imgs.length+
      '…';


    const a=
      document.createElement(
        'a'
      );


    a.href=
      imgs[i];


    a.download=
      'Yuimellkub-'+
      id+
      '-slip-'+
      (i+1)+
      '.jpg';


    a.style.display=
      'none';


    document.body
      .appendChild(a);


    a.click();

    a.remove();


    await new Promise(
      r=>
        setTimeout(
          r,
          180
        )
    );
  }


  b.textContent=
    'บันทึกสลิปทั้งหมดแล้ว ✓';


  setTimeout(
    ()=>{

      b.textContent=old;

      b.disabled=false;

    },
    1200
  );
}


/* =========================
   ORDER CHECK
========================= */

function enhanceLookup(){

  const r=
    $('#orderPopupResult');


  if(
    !r ||
    !r.classList
      .contains('show')
  ){
    return;
  }


  const text=
    (
      r.innerText ||
      ''
    ).trim();


  if(
    !text ||
    text===
      'กำลังตรวจสอบออเดอร์…'
  ){
    return;
  }


  const sig=
    text.slice(
      0,
      160
    );


  if(
    sig!==
    lastLookupSound
  ){

    lastLookupSound=
      sig;

    playPop();
  }


  const status=
    r
      .querySelector(
        '.statusPill'
      )
      ?.textContent
      ?.trim() ||
    '';


  if(
    /มีปัญหา|ผิดพลาด|ยกเลิก|ไม่สำเร็จ/
      .test(status) &&
    !r.querySelector(
      '.ymkV17Problem'
    )
  ){

    const d=
      document.createElement(
        'div'
      );


    d.className=
      'ymkV17Problem';


    d.innerHTML=`
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
    `;


    r
      .querySelector(
        '.orderDemoCard'
      )
      ?.appendChild(d);
  }


  const proof=
    r.querySelector(
      '.ymkV16Proof'
    );


  if(
    proof &&
    !proof.querySelector(
      '.ymkV17SaveAll'
    )
  ){

    const imgs=
      [
        ...proof
          .querySelectorAll(
            'img'
          )
      ]
      .map(
        x=>x.src
      );


    if(imgs.length){

      const b=
        document.createElement(
          'button'
        );


      b.type=
        'button';


      b.className=
        'ymkV17SaveAll';


      b.textContent=
        'บันทึกสลิปทั้งหมด';


      proof.appendChild(b);


      const id=
        r
          .querySelector(
            '.orderDemoTop strong'
          )
          ?.textContent
          ?.trim() ||
        'order';


      b.onclick=
        ()=>
          saveAll(
            imgs,
            id,
            b
          );
    }
  }
}


/* =========================
   CREDIT SLIP COMPRESS
========================= */

function compress(file){

  return new Promise(
    (ok,no)=>{

      if(
        !file ||
        !String(
          file.type ||
          ''
        ).startsWith(
          'image/'
        )
      ){

        return no(
          Error(
            'กรุณาแนบสลิปเป็นรูปภาพ'
          )
        );
      }


      const rd=
        new FileReader();


      const im=
        new Image();


      rd.onerror=
        ()=>
          no(
            Error(
              'อ่านรูปสลิปไม่สำเร็จ'
            )
          );


      im.onerror=
        ()=>
          no(
            Error(
              'เปิดรูปสลิปไม่สำเร็จ'
            )
          );


      rd.onload=
        ()=>
          im.src=
            String(
              rd.result ||
              ''
            );


      im.onload=
        ()=>{

          try{

            const sc=
              Math.min(
                1,
                1200/
                Math.max(
                  im.naturalWidth,
                  im.naturalHeight
                )
              );


            const cv=
              document.createElement(
                'canvas'
              );


            cv.width=
              Math.max(
                1,
                Math.round(
                  im.naturalWidth*
                  sc
                )
              );


            cv.height=
              Math.max(
                1,
                Math.round(
                  im.naturalHeight*
                  sc
                )
              );


            const x=
              cv.getContext(
                '2d',
                {
                  alpha:false
                }
              );


            x.fillStyle=
              '#fff';


            x.fillRect(
              0,
              0,
              cv.width,
              cv.height
            );


            x.drawImage(
              im,
              0,
              0,
              cv.width,
              cv.height
            );


            let q=.72;


            let d=
              cv.toDataURL(
                'image/jpeg',
                q
              );


            while(
              d.length>
                300000 &&
              q>.34
            ){

              q-=.06;


              d=
                cv.toDataURL(
                  'image/jpeg',
                  q
                );
            }


            if(
              d.length>
              330000
            ){

              throw Error(
                'รูปสลิปใหญ่เกินไป กรุณาครอปรูปให้เล็กลง'
              );
            }


            ok(d);

          }catch(e){

            no(e);
          }
        };


      rd.readAsDataURL(
        file
      );
    }
  );
}


/* =========================
   CREDIT TOPUP
========================= */

async function installCreditSubmit(){

  const old=
    $('#creditSubmit');


  if(
    !old ||
    old.dataset.v17
  ){
    return;
  }


  old.id=
    'creditSubmitV17';


  old.dataset.v17=
    '1';


  old.addEventListener(
    'click',
    async e=>{

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();


      const u=
        user();


      const st=
        $('#ymCreditReviewStatus');


      const msg=
        (cls,t)=>{

          if(st){

            st.className=
              'ymCreditReviewStatus show '+
              cls;

            st.textContent=
              t;
          }
        };


      try{

        if(!u){

          throw Error(
            'กรุณาเข้าสู่ระบบก่อนค่ะ'
          );
        }


        const amount=
          Math.floor(
            Number(
              $('#creditAmount')
                ?.value
            ) || 0
          );


        const file=
          $('#creditSlip')
            ?.files?.[0];


        if(!(amount>0)){

          throw Error(
            'กรุณากรอกจำนวนเครดิตที่ต้องการเติมค่ะ'
          );
        }


        if(!file){

          throw Error(
            'กรุณาแนบสลิปชำระเงินก่อนส่งตรวจสอบค่ะ'
          );
        }


        old.disabled=
          true;


        msg(
          'pending',
          'กำลังส่งสลิปให้ร้านตรวจสอบ…'
        );


        const db=
          firebase.firestore();


        const pending=
          await db
            .collection(
              'credit_requests'
            )
            .where(
              'memberId',
              '==',
              u.uid
            )
            .get();


        if(
          pending.docs
            .some(
              d=>
                d.data()
                  ?.status===
                'pending'
            )
        ){

          throw Error(
            'มีรายการเติมเครดิตที่กำลังรอตรวจสอบอยู่แล้วค่ะ'
          );
        }


        const data=
          await compress(file);


        const p=
          await memberProfile();


        const ref=
          db
            .collection(
              'credit_requests'
            )
            .doc();


        await ref.set({

          memberId:
            u.uid,

          nickname:
            p?.nickname ||
            '',

          email:
            u.email ||
            '',

          amount,

          slipName:
            file.name ||
            'slip.jpg',

          slipData:
            data,

          status:
            'pending',

          createdAt:
            firebase
              .firestore
              .FieldValue
              .serverTimestamp()
        });


        msg(
          'pending',
          'ส่งสลิปเรียบร้อยแล้ว • กำลังรอร้านตรวจสอบ ฿'+
          amount.toLocaleString(
            'th-TH'
          )
        );

      }catch(err){

        console.error(
          'v17 credit topup',
          err
        );


        msg(
          'bad',
          err?.message ||
          'ไม่สามารถเติมเครดิตได้'
        );


        old.disabled=
          false;
      }

    },
    true
  );
}


/* =========================
   BOOT
========================= */

function boot(){

  addStyle();


  const start=()=>{

    if(!firebaseReady()){

      return setTimeout(
        start,
        150
      );
    }


    firebase
      .auth()
      .onAuthStateChanged(
        ()=>{

          syncMember();

          setTimeout(
            syncMember,
            250
          );


          installCreditSubmit();
        }
      );


    syncMember();

    installCreditSubmit();
  };


  start();


  const status=
    $('#adminSaveStatus');


  if(status){

    new MutationObserver(
      renderStatus
    ).observe(
      status,
      {
        childList:true,
        subtree:true,
        characterData:true
      }
    );
  }


  const result=
    $('#orderPopupResult');


  if(result){

    new MutationObserver(
      enhanceLookup
    ).observe(
      result,
      {
        childList:true,
        subtree:true,
        characterData:true
      }
    );
  }


  new MutationObserver(
    ()=>{

      installCreditSubmit();

      syncMember();

      renderStatus();

      enhanceLookup();

    }
  ).observe(
    document.body,
    {
      childList:true,
      subtree:true
    }
  );


  renderStatus();

  enhanceLookup();
}


if(
  document.readyState===
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
