(function(){
'use strict';

/*
  YUIMELLKUB PRODUCTION V22 FIXPACK

  แก้เฉพาะ:
  1) Tracking realtime
  2) Member drawer ว่าง / Preview member ชน Firebase
  3) Card height ยืด
  4) Ready-stock stale state / ราคา-สินค้าไม่ตรงตอนกดเร็ว

  ไม่แตะ:
  - index.html.html
  - Motion Preview
  - backend slip flow เดิม
  - Calculator formula
*/

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const esc = v =>
  String(v ?? '').replace(/[&<>"']/g, c => ({
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
  Math.round(Number(n) || 0)
    .toLocaleString('th-TH') + ' บาท';


/* =========================================================
   1. CARD HEIGHT
   Motion เดิมไม่แก้
   ========================================================= */

function installV22Style(){

  if($('#ymkV22Style')){
    return;
  }

  const style = document.createElement('style');
  style.id = 'ymkV22Style';

  style.textContent = `

    /*
      ห้ามแก้ transition / transform hover
      ใช้ Motion จาก Preview/V21 เดิม
    */

    #products .products{
      align-items:start!important;
      grid-auto-rows:max-content!important;
    }

    #products .ready-stock-card,
    #products .ymk-production-card{
      height:auto!important;
      min-height:0!important;
      max-height:none!important;
      align-self:start!important;

      /*
        ให้การ์ดกระชับขึ้นใกล้ Preview
      */
      padding:12px 10px 11px!important;
    }

    /*
      description ตัวนี้เป็นตัวทำให้การ์ดยาวเกิน Preview
    */
    #products .ymk-store-desc{
      display:none!important;
    }

    #products .ymk-production-image{
      height:56px!important;
      min-height:56px!important;
      margin:0 auto 2px!important;
    }

    #products .ymk-production-image img{
      width:54px!important;
      height:54px!important;
      max-width:54px!important;
      max-height:54px!important;
      object-fit:contain!important;
    }

    #products .ymk-store-name{
      margin:4px 0!important;
      line-height:1.3!important;
    }

    #products .ymk-store-bottom{
      margin-top:5px!important;
      gap:5px!important;
    }

    #products .ymk-store-price{
      line-height:1.15!important;
      margin:2px 0!important;
    }

    #products .ready-stock-order-btn,
    #products .ymk-send-choice{
      margin-top:6px!important;
      min-height:38px!important;
      padding:8px 7px!important;
    }

  `;

  document.head.appendChild(style);
}


/* =========================================================
   2. READY STOCK STATE
   แก้ stale state เวลากดการ์ดไว ๆ
   ========================================================= */

let latestReady = null;
let readySerial = 0;


function resetReadyState(){

  latestReady = null;

  window.lastOrder = null;
  window.YMK_LAST_CALC = null;
  window.YMK_CALC_CHECKOUT_STATE = null;
  window.YMK_SEND_SELECTION = null;
  window.YMK_SEND_ORDER_META = null;

  document.body.classList.remove(
    'ymCalcCheckout'
  );
}


function getReadyButton(target){

  const send =
    target.closest?.(
      '.ymk-send-choice'
    );

  if(send){

    return {
      mode:'send',
      button:
        send
          .closest('.ready-stock-card')
          ?.querySelector(
            '.ready-stock-order-btn'
          )
    };
  }

  const normal =
    target.closest?.(
      '.ready-stock-order-btn'
    );

  if(normal){

    return {
      mode:'instant',
      button:normal
    };
  }

  return null;
}


function snapshotReady(target){

  const found =
    getReadyButton(target);

  if(
    !found ||
    !found.button ||
    found.button.disabled
  ){
    return null;
  }

  const btn = found.button;

  const card =
    btn.closest(
      '.ready-stock-card'
    );

  if(!card){
    return null;
  }

  const name =
    String(
      btn.dataset.readyName ||
      card.querySelector(
        '.ymk-store-name'
      )?.textContent ||
      'สินค้า'
    ).trim();

  const unitPrice =
    found.mode === 'send'
      ? number(
          btn.dataset.sendPrice
        )
      : number(
          btn.dataset.readyPrice
        );

  if(!(unitPrice > 0)){
    return null;
  }

  let echo = 0;

  const m =
    name.match(
      /(\d[\d,]*)\s*(?:กระดุม|echoes?)/i
    );

  if(m){
    echo =
      Number(
        m[1].replace(/,/g,'')
      ) || 0;
  }

  return {
    token:++readySerial,
    mode:found.mode,
    item:name,
    pack:
      found.mode === 'send'
        ? 'แบบส่ง'
        : name,
    unitPrice,
    price:unitPrice,
    quantity:1,
    echo,
    productId:
      btn.dataset.productId || '',
    category:
      btn.dataset.readyCategory || ''
  };
}


function readyQty(){

  const raw =
    Number(
      $('#ymOrderQty')?.value
    ) || 1;

  return Math.max(
    1,
    Math.min(
      99,
      Math.floor(raw)
    )
  );
}


function readyPackText(x,qty){

  if(!x){
    return '';
  }

  if(
    x.mode === 'send'
  ){
    return 'แบบส่ง';
  }

  if(x.echo){

    return (
      x.echo.toLocaleString('th-TH') +
      ' × ' +
      qty
    );
  }

  return x.pack || x.item;
}


function syncReadyState(){

  const x = latestReady;

  if(!x){
    return;
  }

  const qty = readyQty();

  const total =
    x.unitPrice *
    qty;

  const pack =
    readyPackText(
      x,
      qty
    );

  x.quantity = qty;
  x.price = total;
  x.pack = pack;

  /*
    State กลางต้องมาจาก Ready ตัวล่าสุดเท่านั้น
  */
  window.YMK_LAST_CALC = {
    type:'ready',
    item:x.item,
    pack:x.pack,
    price:total,
    ready:true,
    productId:x.productId,
    category:x.category,
    orderMode:x.mode
  };

  window.YMK_CALC_CHECKOUT_STATE = {
    type:'ready',
    item:x.item,
    pack:x.pack,
    price:total,
    ready:true,
    productId:x.productId,
    category:x.category,
    orderMode:x.mode
  };

  window.lastOrder = {
    item:x.item,
    pack:x.pack,
    price:money(total),
    quantity:qty,
    orderMode:x.mode,
    productId:x.productId,
    category:x.category
  };

  if(
    x.mode === 'send'
  ){

    window.YMK_SEND_SELECTION = {
      mode:'send',
      name:x.item,
      price:x.unitPrice,
      total,
      quantity:qty,
      category:x.category,
      productId:x.productId
    };

    window.YMK_SEND_ORDER_META = {
      mode:'send',
      base:x.item,
      unit:x.unitPrice,
      total,
      q:qty,
      category:x.category,
      productId:x.productId
    };

  }else{

    window.YMK_SEND_SELECTION = null;
    window.YMK_SEND_ORDER_META = null;
  }


  /*
    หน้าแรกของ checkout
  */
  const selected =
    $('#ymOrderSelected');

  if(selected){

    selected.innerHTML =
      '<b>' +
      esc(x.item) +
      (
        qty > 1
          ? ' × ' + qty
          : ''
      ) +
      '</b><br>' +
      'ราคา ' +
      esc(
        money(total)
      ) +
      (
        pack
          ? '<span class="ymPackLine">แพ็กที่เติม: ' +
            esc(pack) +
            '</span>'
          : ''
      );
  }


  const qtyTotal =
    $('#ymOrderQtyTotal');

  if(qtyTotal){

    qtyTotal.textContent =
      qty > 1
        ? 'รวม ' +
          money(total)
        : '';
  }


  /*
    หน้าชำระเงิน
  */
  const amount =
    $('#ymOrderAmount');

  if(amount){

    amount.textContent =
      money(total);
  }


  const summary =
    $('#ymOrderSummary');

  if(summary){

    const uid =
      String(
        $('#ymOrderUid')
          ?.value || ''
      ).trim();

    const server =
      String(
        $('#ymOrderServer')
          ?.value || 'Asia'
      ).trim();

    const name =
      String(
        $('#ymOrderName')
          ?.value || ''
      ).trim();

    summary.innerHTML =
      '<b>' +
      esc(x.item) +
      (
        qty > 1
          ? ' × ' + qty
          : ''
      ) +
      '</b>' +
      (
        pack
          ? '<span class="ymPackLine">แพ็กที่เติม: ' +
            esc(pack) +
            '</span>'
          : ''
      ) +
      '<br>UID: ' +
      esc(uid || '-') +
      ' • Server: ' +
      esc(server) +
      (
        name
          ? '<br>ชื่อ: ' +
            esc(name)
          : ''
      );
  }
}


/*
  Window capture ทำงานก่อน document capture ของ V21
*/
window.addEventListener(
  'pointerdown',
  e => {

    const x =
      snapshotReady(
        e.target
      );

    if(!x){
      return;
    }

    /*
      ล้างของเก่าก่อนทุกครั้ง
    */
    resetReadyState();

    latestReady = x;

    window.YMK_LAST_CALC = {
      type:'ready',
      item:x.item,
      pack:x.pack,
      price:x.unitPrice,
      ready:true,
      productId:x.productId,
      category:x.category,
      orderMode:x.mode
    };

  },
  true
);


window.addEventListener(
  'click',
  e => {

    const x =
      snapshotReady(
        e.target
      );

    if(x){

      /*
        click ล่าสุดชนะเสมอ
      */
      latestReady = x;

      const serial =
        x.token;

      const apply = () => {

        if(
          !latestReady ||
          latestReady.token !== serial
        ){
          return;
        }

        const q =
          $('#ymOrderQty');

        if(q){
          q.value = '1';
        }

        syncReadyState();
      };

      /*
        overwrite state หลัง Preview handler เดิม
      */
      setTimeout(
        apply,
        0
      );

      setTimeout(
        apply,
        30
      );

      setTimeout(
        apply,
        100
      );

      return;
    }


    /*
      เวลาเปลี่ยนจำนวน Ready Stock
    */
    if(
      latestReady &&
      e.target.closest?.(
        '#ymOrderQtyMinus,#ymOrderQtyPlus'
      )
    ){

      setTimeout(
        syncReadyState,
        0
      );

      setTimeout(
        syncReadyState,
        30
      );
    }


    /*
      ก่อนเข้า Payment
    */
    if(
      latestReady &&
      e.target.closest?.(
        '#ymOrderNext'
      )
    ){

      syncReadyState();

      setTimeout(
        syncReadyState,
        0
      );

      setTimeout(
        syncReadyState,
        30
      );

      setTimeout(
        syncReadyState,
        100
      );
    }


    /*
      เปลี่ยนช่องทางจ่ายแล้วราคา/สินค้า
      ต้องไม่ย้อนกลับไปค่าเก่า
    */
    if(
      latestReady &&
      e.target.closest?.(
        '[data-ym-order-pay]'
      )
    ){

      syncReadyState();

      setTimeout(
        syncReadyState,
        0
      );

      setTimeout(
        syncReadyState,
        50
      );
    }


    /*
      ก่อน Submit ต้อง sync payload ล่าสุด
    */
    if(
      latestReady &&
      e.target.closest?.(
        '#ymOrderSubmit,#ymOrderSubmitProdV21'
      )
    ){

      syncReadyState();
    }

  },
  true
);


document.addEventListener(
  'input',
  e => {

    if(
      !latestReady ||
      e.target?.id !==
      'ymOrderQty'
    ){
      return;
    }

    syncReadyState();

  },
  true
);


/*
  เมื่อกด Calculator จริง
  ให้ Ready Stock หลุดออกจาก state
*/
window.addEventListener(
  'click',
  e => {

    const calc =
      e.target.closest?.(
        '#ymCalcOrder,#ymCalcPopupOrder,.ymCalcOrderBtn,[data-calc-order]'
      );

    if(!calc){
      return;
    }

    /*
      calc trigger ที่ Ready Stock เป็นคนกด
      จะเกิดภายใน event เดียวกัน
      จึงไม่ล้างถ้ายังมี latestReady ที่เพิ่งสร้าง
    */
    if(
      e.isTrusted &&
      !e.target.closest?.(
        '.ready-stock-order-btn,.ymk-send-choice'
      )
    ){
      latestReady = null;
    }

  },
  true
);


/* =========================================================
   3. MEMBER FIREBASE = SOURCE OF TRUTH
   ========================================================= */

let memberUnsubs = [];
let memberGuardBusy = false;


function stopMemberWatches(){

  memberUnsubs
    .splice(0)
    .forEach(fn => {

      try{
        fn();
      }catch(_){}
    });
}


function setMemberVisibility(user){

  if(memberGuardBusy){
    return;
  }

  memberGuardBusy = true;

  const guest =
    $('#guestMember');

  const logged =
    $('#loggedMember');

  if(user){

    if(guest){

      guest.hidden = true;
      guest.style.setProperty(
        'display',
        'none',
        'important'
      );
    }

    if(logged){

      logged.hidden = false;
      logged.style.removeProperty(
        'display'
      );
    }

  }else{

    if(guest){

      guest.hidden = false;
      guest.style.removeProperty(
        'display'
      );
    }

    if(logged){

      logged.hidden = true;
      logged.style.setProperty(
        'display',
        'none',
        'important'
      );
    }
  }

  document.documentElement
    .classList
    .toggle(
      'ymGuestSession',
      !user
    );

  setTimeout(
    () => {
      memberGuardBusy = false;
    },
    0
  );
}


function timestamp(v){

  if(!v){
    return 0;
  }

  if(
    typeof v.toMillis ===
    'function'
  ){
    return v.toMillis();
  }

  return Number(v) || 0;
}


function memberMoney(n){

  return (
    '฿' +
    Number(n || 0)
      .toLocaleString('th-TH')
  );
}


function renderMemberProfile(
  user,
  profile
){

  setMemberVisibility(
    user
  );

  if(!user){
    return;
  }

  const nickname =
    profile?.nickname ||
    user.displayName ||
    'สมาชิก Yuimellkub';

  if($('#memberName')){

    $('#memberName')
      .textContent =
      nickname;
  }

  if($('#memberEmail')){

    $('#memberEmail')
      .textContent =
      user.email || '';
  }

  $$('[data-wallet]')
    .forEach(el => {

      el.textContent =
        memberMoney(
          profile?.credit || 0
        );
    });

  const note =
    $('.ymAuthNote');

  if(note){

    note.textContent =
      'บัญชีสมาชิกเชื่อมกับระบบร้านแล้ว ♡';
  }
}


function renderMemberHistory(rows){

  const box =
    $('#walletHistory');

  if(!box){
    return;
  }

  const sorted =
    [...rows].sort(
      (a,b) =>
        timestamp(
          b.createdAt
        ) -
        timestamp(
          a.createdAt
        )
    );

  box.innerHTML =
    sorted.length
      ? sorted.map(x => `

          <div>

            <span>
              ${esc(
                x.label ||
                x.type ||
                'รายการเครดิต'
              )}
            </span>

            <b>
              ${
                Number(
                  x.amount || 0
                ) > 0
                  ? '+'
                  : ''
              }${memberMoney(
                x.amount || 0
              )}
            </b>

          </div>

        `).join('')
      : `
          <div
            style="
              display:block;
              text-align:center;
              color:#a77b8b
            "
          >
            ยังไม่มีประวัติเครดิต
          </div>
        `;
}


function renderMemberOrders(rows){

  const box =
    $('#memberOrders');

  if(!box){
    return;
  }

  const sorted =
    [...rows].sort(
      (a,b) =>
        timestamp(
          b.createdAt
        ) -
        timestamp(
          a.createdAt
        )
    );

  box.innerHTML =
    sorted.length
      ? sorted.map(o => `

          <div class="card">

            <b>
              ${esc(o.id || '-')}
            </b>

            <div class="ymMini">

              <div class="ymOrderDetailItem">
                ${esc(o.item || '-')}
                ·
                ${
                  typeof o.price ===
                  'number'
                    ? memberMoney(
                        o.price
                      )
                    : esc(
                        o.price || '-'
                      )
                }
              </div>

              <div>
                แพ็กที่เติม:
                ${esc(o.pack || '-')}
              </div>

              <div>
                UID:
                ${esc(o.uid || '-')}
                · Server:
                ${esc(o.server || '-')}
              </div>

            </div>

            <div class="ymStatus">
              สถานะ:
              ${esc(
                o.shopStatus ||
                o.paymentStatus ||
                'รอดำเนินการ'
              )}
            </div>

          </div>

        `).join('')
      : `
          <div
            class="card"
            style="
              text-align:center;
              color:#a77b8b
            "
          >
            ยังไม่มีออเดอร์ในบัญชีนี้
          </div>
        `;
}


function startMemberProduction(){

  const wait = () => {

    if(
      !window.firebase ||
      !firebase.auth ||
      !firebase.firestore
    ){

      setTimeout(
        wait,
        150
      );

      return;
    }

    const auth =
      firebase.auth();

    const db =
      firebase.firestore();


    auth.onAuthStateChanged(
      user => {

        stopMemberWatches();

        setMemberVisibility(
          user
        );

        if(!user){

          renderMemberOrders([]);
          renderMemberHistory([]);

          return;
        }


        /*
          member profile realtime
        */
        memberUnsubs.push(

          db
            .collection('members')
            .doc(user.uid)
            .onSnapshot(
              snap => {

                const profile =
                  snap.exists
                    ? {
                        id:user.uid,
                        email:
                          user.email || '',
                        ...snap.data()
                      }
                    : {
                        id:user.uid,
                        email:
                          user.email || '',
                        nickname:
                          user.displayName || '',
                        credit:0
                      };

                renderMemberProfile(
                  user,
                  profile
                );
              },
              err => {

                console.warn(
                  'V22 member profile:',
                  err
                );

                renderMemberProfile(
                  user,
                  {
                    credit:0
                  }
                );
              }
            )
        );


        /*
          member orders realtime
        */
        memberUnsubs.push(

          db
            .collection('orders')
            .where(
              'memberId',
              '==',
              user.uid
            )
            .onSnapshot(
              snap => {

                renderMemberOrders(
                  snap.docs.map(
                    d => ({
                      id:d.id,
                      ...d.data()
                    })
                  )
                );
              },
              err => {

                console.warn(
                  'V22 member orders:',
                  err
                );
              }
            )
        );


        /*
          credit history realtime
        */
        memberUnsubs.push(

          db
            .collection(
              'credit_history'
            )
            .where(
              'memberId',
              '==',
              user.uid
            )
            .onSnapshot(
              snap => {

                renderMemberHistory(
                  snap.docs.map(
                    d => ({
                      id:d.id,
                      ...d.data()
                    })
                  )
                );
              },
              err => {

                console.warn(
                  'V22 credit history:',
                  err
                );
              }
            )
        );

      }
    );


    /*
      Preview script บางตัวชอบสลับ hidden เอง
      Guard เฉพาะ drawer สมาชิก
    */
    const root =
      $('#memberOverlay');

    if(root){

      let queued = false;

      new MutationObserver(
        mutations => {

          if(memberGuardBusy){
            return;
          }

          if(
            !mutations.some(
              m =>
                m.type ===
                  'attributes' &&
                (
                  m.target?.id ===
                  'guestMember' ||
                  m.target?.id ===
                  'loggedMember'
                )
            )
          ){
            return;
          }

          if(queued){
            return;
          }

          queued = true;

          requestAnimationFrame(
            () => {

              queued = false;

              setMemberVisibility(
                auth.currentUser
              );
            }
          );
        }
      ).observe(
        root,
        {
          subtree:true,
          attributes:true,
          attributeFilter:[
            'hidden',
            'style'
          ]
        }
      );
    }
  };

  wait();
}


/* =========================================================
   4. TRACKING REALTIME
   ========================================================= */

let trackingStop = null;
let trackingOrderId = '';
let trackingOrderData = null;
let trackingStatusData = null;
let trackingLastSignature = '';


function stopTracking(){

  if(trackingStop){

    try{
      trackingStop();
    }catch(_){}
  }

  trackingStop = null;
  trackingOrderId = '';
  trackingOrderData = null;
  trackingStatusData = null;
  trackingLastSignature = '';
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
        x =>
          typeof x ===
            'string' &&
          x.startsWith(
            'data:image/'
          )
      );
  }

  if(
    typeof data
      ?.fulfillmentSlipData ===
      'string' &&
    data.fulfillmentSlipData
      .startsWith(
        'data:image/'
      )
  ){

    return [
      data.fulfillmentSlipData
    ];
  }

  return [];
}


function openTrackingProof(src){

  const old =
    $('#ymkV22ProofViewer');

  old?.remove();

  const viewer =
    document.createElement(
      'div'
    );

  viewer.id =
    'ymkV22ProofViewer';

  viewer.className =
    'ymk-proof-viewer';

  viewer.innerHTML =
    '<img src="' +
    src +
    '" alt="สลิปการเติมเกม">';

  viewer.addEventListener(
    'click',
    () => viewer.remove()
  );

  document.body.appendChild(
    viewer
  );
}


function dataURLToBlob(src){

  const parts =
    src.split(',');

  const meta =
    parts[0] || '';

  const raw =
    parts[1] || '';

  const mime =
    (
      meta.match(
        /data:([^;]+)/
      ) || []
    )[1] ||
    'image/jpeg';

  const bin =
    atob(raw);

  const bytes =
    new Uint8Array(
      bin.length
    );

  for(
    let i=0;
    i<bin.length;
    i++
  ){

    bytes[i] =
      bin.charCodeAt(i);
  }

  return new Blob(
    [bytes],
    {
      type:mime
    }
  );
}


async function saveTrackingProofs(
  images,
  id,
  button
){

  if(!images.length){
    return;
  }

  const old =
    button.textContent;

  button.disabled = true;

  try{

    for(
      let i=0;
      i<images.length;
      i++
    ){

      button.textContent =
        'กำลังบันทึก ' +
        (i+1) +
        '/' +
        images.length +
        '…';

      const blob =
        dataURLToBlob(
          images[i]
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const a =
        document.createElement(
          'a'
        );

      a.href = url;

      a.download =
        'Yuimellkub-' +
        String(id)
          .replace(
            /[^A-Za-z0-9_-]/g,
            ''
          ) +
        '-slip-' +
        (i+1) +
        '.jpg';

      document.body.appendChild(
        a
      );

      a.click();
      a.remove();

      setTimeout(
        () =>
          URL.revokeObjectURL(
            url
          ),
        3000
      );

      await new Promise(
        r =>
          setTimeout(
            r,
            180
          )
      );
    }

    button.textContent =
      'บันทึกสลิปแล้ว ✓';

  }catch(err){

    console.error(
      err
    );

    button.textContent =
      'บันทึกไม่สำเร็จ';
  }

  setTimeout(
    () => {

      if(button.isConnected){

        button.textContent =
          old;

        button.disabled =
          false;
      }
    },
    1200
  );
}


function trackingStatus(order){

  return String(
    order?.shopStatus ||
    order?.status ||
    order?.paymentStatus ||
    'รอดำเนินการ'
  ).trim();
}


function renderTrackingRealtime(){

  if(
    !trackingOrderId ||
    !trackingOrderData
  ){
    return;
  }

  const result =
    $('#orderPopupResult');

  if(!result){
    return;
  }

  const merged = {
    ...trackingOrderData,
    ...(trackingStatusData || {}),
    id:trackingOrderId
  };

  const status =
    trackingStatus(
      merged
    );

  const proofs =
    proofImages(
      trackingStatusData || {}
    );

  /*
    กัน render ซ้ำโดยไม่จำเป็น
  */
  const signature =
    JSON.stringify({
      id:trackingOrderId,
      status,
      item:merged.item,
      pack:merged.pack,
      uid:merged.uid,
      server:merged.server,
      proofCount:proofs.length,
      proofHead:
        proofs.map(
          x => x.slice(0,60)
        )
    });

  if(
    signature ===
    trackingLastSignature
  ){
    return;
  }

  trackingLastSignature =
    signature;

  const problem =
    /มีปัญหา|ผิดพลาด|ยกเลิก|ไม่สำเร็จ/
      .test(status);

  result.classList.add(
    'show'
  );

  result.innerHTML = `

    <div class="orderDemoCard">

      <div class="orderDemoTop">

        <strong>
          ${esc(trackingOrderId)}
        </strong>

        <span class="statusPill">
          ${esc(status)}
        </span>

      </div>

      <div class="orderRows">

        <div>
          <small>รายการ</small>
          <b>
            ${esc(
              merged.item || '-'
            )}
          </b>
        </div>

        <div>
          <small>แพ็ก / ประเภท</small>
          <b>
            ${esc(
              merged.pack || '-'
            )}
          </b>
        </div>

        <div>
          <small>UID</small>
          <b>
            ${esc(
              merged.uid || '-'
            )}
          </b>
        </div>

        <div>
          <small>Server</small>
          <b>
            ${esc(
              merged.server || '-'
            )}
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
        proofs.length
          ? `
              <div class="ymk-track-proof">

                <b>
                  สลิปการเติมเกม
                  (${proofs.length} รูป)
                </b>

                <div class="ymk-track-proof-grid">

                  ${
                    proofs.map(
                      (src,i) => `

                        <img
                          src="${src}"
                          data-v22-proof="${i}"
                          alt="สลิปการเติมเกม ${i+1}"
                        >

                      `
                    ).join('')
                  }

                </div>

                <button
                  type="button"
                  class="ymk-track-save"
                  data-v22-save
                >
                  บันทึกสลิป${proofs.length>1?'ทั้งหมด':''}
                </button>

              </div>
            `
          : (
              status === 'สำเร็จ'
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
      '[data-v22-proof]'
    )
    .forEach(
      img => {

        img.onclick =
          () =>
            openTrackingProof(
              img.src
            );
      }
    );


  const save =
    result.querySelector(
      '[data-v22-save]'
    );

  if(save){

    save.onclick =
      () =>
        saveTrackingProofs(
          proofs,
          trackingOrderId,
          save
        );
  }
}


function startRealtimeTracking(id){

  if(
    !id ||
    !/^YMK\d{6}-\d{6}$/
      .test(id)
  ){
    return;
  }

  if(
    id === trackingOrderId &&
    trackingStop
  ){
    return;
  }

  stopTracking();

  if(
    !window.firebase ||
    !firebase.firestore
  ){
    return;
  }

  const db =
    firebase.firestore();

  trackingOrderId =
    id;

  let stopOrder = null;
  let stopStatus = null;


  stopOrder =
    db
      .collection('orders')
      .doc(id)
      .onSnapshot(
        snap => {

          if(!snap.exists){
            return;
          }

          trackingOrderData = {
            id:snap.id,
            ...snap.data()
          };

          renderTrackingRealtime();
        },
        err => {

          console.warn(
            'V22 realtime order:',
            err
          );
        }
      );


  stopStatus =
    db
      .collection(
        'order_status'
      )
      .doc(id)
      .onSnapshot(
        snap => {

          trackingStatusData =
            snap.exists
              ? snap.data()
              : {};

          renderTrackingRealtime();
        },
        err => {

          console.warn(
            'V22 realtime status:',
            err
          );
        }
      );


  trackingStop = () => {

    try{
      stopOrder?.();
    }catch(_){}

    try{
      stopStatus?.();
    }catch(_){}
  };
}


/*
  หลังผู้ใช้กดตรวจออเดอร์:
  - ถ้าเลขเต็ม เริ่ม realtime ทันที
  - ถ้าเป็นเลขสั้น รอ V21 หาเลขเต็มก่อน
*/
window.addEventListener(
  'click',
  e => {

    const button =
      e.target.closest?.(
        '#orderPopupSubmit,#orderPopupSubmitProdV21'
      );

    if(!button){
      return;
    }

    const input =
      String(
        $('#orderPopupInput')
          ?.value || ''
      )
      .trim()
      .replace(
        /^#/,
        ''
      );

    stopTracking();

    if(
      /^YMK\d{6}-\d{6}$/
        .test(input)
    ){

      setTimeout(
        () =>
          startRealtimeTracking(
            input
          ),
        50
      );

      return;
    }


    /*
      กรณีค้นด้วยเลขย่อ
      รอผลจาก V21 แล้วอ่าน id จริง
    */
    let tries = 0;

    const timer =
      setInterval(
        () => {

          tries++;

          const text =
            $('#orderPopupResult')
              ?.querySelector(
                '.orderDemoTop strong'
              )
              ?.textContent
              ?.trim() ||
            '';

          if(
            /^YMK\d{6}-\d{6}$/
              .test(text)
          ){

            clearInterval(
              timer
            );

            startRealtimeTracking(
              text
            );
          }

          if(
            tries >= 30
          ){

            clearInterval(
              timer
            );
          }

        },
        100
      );

  },
  true
);


/*
  ปิด modal แล้วหยุด realtime listener
*/
document.addEventListener(
  'click',
  e => {

    if(
      e.target.closest?.(
        '.orderModalClose'
      )
    ){

      stopTracking();
    }

  },
  true
);


/* =========================================================
   START
   ========================================================= */

function boot(){

  installV22Style();

  startMemberProduction();
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
