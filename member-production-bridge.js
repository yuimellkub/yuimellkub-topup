(function(){
'use strict';

let auth = null;
let db = null;
let profile = null;

let history = [];
let requests = [];
let orders = [];
let unsubs = [];


const q = s =>
  document.querySelector(s);

const qa = s =>
  Array.from(
    document.querySelectorAll(s)
  );

const money = n =>
  '฿' +
  Number(n || 0)
    .toLocaleString('th-TH');


function firebaseError(err){

  const code =
    String(
      err?.code || ''
    );

  if(
    code.includes(
      'operation-not-allowed'
    )
  ){
    return (
      'ระบบสมัครสมาชิกด้วยอีเมลยังไม่ได้เปิดใน Firebase ' +
      'กรุณาเปิด Email/Password ใน Firebase Authentication'
    );
  }

  if(
    code.includes(
      'invalid-email'
    )
  ){
    return 'รูปแบบอีเมลไม่ถูกต้องค่ะ';
  }

  if(
    code.includes(
      'email-already-in-use'
    )
  ){
    return 'อีเมลนี้สมัครสมาชิกแล้วค่ะ';
  }

  if(
    code.includes(
      'weak-password'
    )
  ){
    return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษรค่ะ';
  }

  if(
    code.includes(
      'invalid-credential'
    ) ||
    code.includes(
      'wrong-password'
    ) ||
    code.includes(
      'user-not-found'
    )
  ){
    return 'อีเมลหรือรหัสผ่านไม่ถูกต้องค่ะ';
  }

  if(
    code.includes(
      'too-many-requests'
    )
  ){
    return 'ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่ค่ะ';
  }

  if(
    code.includes(
      'network-request-failed'
    )
  ){
    return 'เชื่อมต่อ Firebase ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่ค่ะ';
  }

  if(
    code.includes(
      'unauthorized-domain'
    )
  ){
    return (
      'โดเมนเว็บไซต์ยังไม่ได้รับอนุญาตใน Firebase Authentication'
    );
  }

  return (
    err?.message ||
    'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
  );
}


function stop(){
  unsubs.forEach(fn=>{
    try{
      fn();
    }catch(e){}
  });

  unsubs = [];
}


function timestampValue(v){
  if(!v) return 0;

  if(
    typeof v.toMillis ===
    'function'
  ){
    return v.toMillis();
  }

  return Number(v) || 0;
}

function pendingManualOrder(){

  if(
    !auth?.currentUser
  ){
    return null;
  }

  try{

    const reviewId =
      String(
        localStorage.getItem(
          'ymk_active_manual_review'
        ) || ''
      ).trim();

    const memberId =
      String(
        localStorage.getItem(
          'ymk_active_manual_review_member'
        ) || ''
      ).trim();

    if(
      !reviewId ||
      memberId !== auth.currentUser.uid
    ){
      return null;
    }

    let draft = {};

    try{
      draft =
        JSON.parse(
          localStorage.getItem(
            'ymk_active_manual_review_draft'
          ) || '{}'
        ) || {};
    }catch(_){}

    return {
      id:'',
      reviewId,
      pending:true,
      item:draft.item || '-',
      pack:draft.pack || '-',
      price:draft.price || '-',
      uid:draft.uid || '-',
      server:draft.server || 'Asia',
      shopStatus:'กำลังรอตรวจสอบสลิป'
    };

  }catch(_){

    return null;
  }
}
function render(){

  const guest =
    q('#guestMember');

  const logged =
    q('#loggedMember');

  const signedIn =
    !!auth?.currentUser;

  if(guest){
    guest.hidden =
      signedIn;

    guest.style.setProperty(
      'display',
      signedIn
        ? 'none'
        : '',
      'important'
    );
  }

  if(logged){
    logged.hidden =
      !signedIn;

    logged.style.setProperty(
      'display',
      signedIn
        ? ''
        : 'none',
      'important'
    );
  }

  document.documentElement
    .classList
    .toggle(
      'ymGuestSession',
      !signedIn
    );

  /*
    ปุ่มเครดิตโชว์เฉพาะตอนล็อกอิน
  */
  qa(
    '[data-ym-order-pay="credit"]'
  ).forEach(btn=>{
    btn.hidden =
      !signedIn;

    btn.style.setProperty(
      'display',
      signedIn
        ? ''
        : 'none',
      'important'
    );

    btn.setAttribute(
      'aria-hidden',
      signedIn
        ? 'false'
        : 'true'
    );
  });

  /*
    เอาข้อความ Preview ออก
  */
  const note =
    q('.ymAuthNote');

  if(note){
    note.textContent =
      'บัญชีสมาชิกเชื่อมกับระบบร้านแล้ว ♡';
  }

  if(!signedIn){
    return;
  }

  const liveProfile =
    profile || {
      nickname:
        auth.currentUser?.displayName || '',
      email:
        auth.currentUser?.email || '',
      credit:0
    };

  if(q('#memberName')){
    q('#memberName').textContent =
      liveProfile.nickname ||
      'สมาชิก Yuimellkub';
  }

  if(q('#memberEmail')){
    q('#memberEmail').textContent =
      liveProfile.email || '';
  }

  qa('[data-wallet]')
    .forEach(el=>{
      el.textContent =
        money(
          liveProfile.credit
        );
    });

  /*
    ประวัติเครดิต
  */
  const h =
    q('#walletHistory');

  if(h){
    const rows =
      [...history]
        .sort(
          (a,b)=>
            timestampValue(
              b.createdAt
            ) -
            timestampValue(
              a.createdAt
            )
        );

    h.innerHTML =
      rows.length
        ? rows.map(x=>`
            <div>
              <span>
                ${
                  x.label ||
                  x.type ||
                  'รายการเครดิต'
                }
              </span>

              <b>
                ${
                  Number(
                    x.amount || 0
                  ) > 0
                    ? '+'
                    : ''
                }${money(x.amount || 0)}
              </b>
            </div>
          `).join('')
        : `
            <div style="
              display:block;
              text-align:center;
              color:#a77b8b
            ">
              ยังไม่มีประวัติเครดิต
            </div>
          `;
  }

  /*
    ออเดอร์สมาชิกจริง
  */
  const ob =
    q('#memberOrders');

  if(ob){

  const pendingOrder =
  pendingManualOrder();

const realOrders =
  [
    ...(pendingOrder
      ? [pendingOrder]
      : []
    ),
    ...orders
  ]
    .sort(
      (a,b)=>
        timestampValue(
          b.createdAt
        ) -
        timestampValue(
          a.createdAt
        )
    );

    ob.innerHTML =
      realOrders.length
        ? realOrders.map(o=>`
            <div class="card">

            <b>
  ${
    o.pending
      ? 'กำลังรอตรวจสอบสลิป'
      : (o.id || '-')
  }
</b>

              <div class="ymMini">

                <div class="ymOrderDetailItem">
                  ${o.item || '-'}
                  ·
                  ${
                    typeof o.price ===
                    'number'
                      ? money(o.price)
                      : (
                          o.price ||
                          '-'
                        )
                  }
                </div>

                <div>
                  แพ็กที่เติม:
                  ${o.pack || '-'}
                </div>

                <div>
                  UID:
                  ${o.uid || '-'}
                  ·
                  Server:
                  ${o.server || '-'}
                </div>

              </div>

        <div class="ymStatus">
  สถานะ:
  ${
    o.pending
      ? 'กำลังรอตรวจสอบสลิป'
      : (
          o.shopStatus ||
          o.paymentStatus ||
          'รอดำเนินการ'
        )
  }
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

  /*
    เครดิตที่กำลังรอตรวจ
  */
  const st =
    q(
      '#ymCreditReviewStatus'
    );

  const pending =
    requests.find(
      x =>
        x.status ===
        'pending'
    );

  const submit =
    q('#creditSubmit');

  if(submit){
    submit.disabled =
      !!pending;
  }

  if(st){

    if(pending){
      st.className =
        'ymCreditReviewStatus show pending';

      st.textContent =
        'ส่งสลิปเรียบร้อยแล้ว • กำลังรอร้านตรวจสอบ ' +
        money(
          pending.amount
        );

    }else{
      st.className =
        'ymCreditReviewStatus';

      st.textContent = '';
    }
  }
}


function watch(user){

  stop();

  if(!user){
    profile = null;
    history = [];
    requests = [];
    orders = [];

    render();
    return;
  }
  /*
    บัญชี Auth เก่าบางบัญชียังไม่มี members/{uid}
    สร้างเอกสารจริงครั้งแรกที่เข้าสู่ระบบ
    โดยไม่แตะเครดิตของบัญชีที่มีอยู่แล้ว
  */
  const memberRef =
    db
      .collection('members')
      .doc(user.uid);

  memberRef
    .get()
    .then(snap=>{

      if(snap.exists){
        return;
      }

      return memberRef.set({
        nickname:
          user.displayName ||
          '',

        email:
          user.email ||
          '',

        credit:0,

        status:'active',

        createdAt:
          firebase
            .firestore
            .FieldValue
            .serverTimestamp(),

        updatedAt:
          firebase
            .firestore
            .FieldValue
            .serverTimestamp()
      });

    })
    .catch(err=>{

      console.error(
        'member document ensure failed',
        err
      );
    });
  /*
    โปรไฟล์
  */
  unsubs.push(
    db
      .collection('members')
      .doc(user.uid)
      .onSnapshot(
        snap => {

          profile =
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

          render();
        },
        err => {
          console.error(
            'member profile watch failed',
            err
          );
        }
      )
  );

  /*
    เครดิต
  */
  unsubs.push(
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
          history =
            snap.docs.map(d=>({
              id:d.id,
              ...d.data()
            }));

          render();
        },
        ()=>{}
      )
  );

  /*
    คำขอเติมเครดิต
  */
  unsubs.push(
    db
      .collection(
        'credit_requests'
      )
      .where(
        'memberId',
        '==',
        user.uid
      )
      .onSnapshot(
        snap => {
          requests =
            snap.docs.map(d=>({
              id:d.id,
              ...d.data()
            }));

          render();
        },
        ()=>{}
      )
  );

  /*
    ออเดอร์ของสมาชิก
  */
  unsubs.push(
    db
      .collection('orders')
      .where(
        'memberId',
        '==',
        user.uid
      )
      .onSnapshot(
        snap => {
          orders =
            snap.docs.map(d=>({
              id:d.id,
              ...d.data()
            }));

          render();
        },
        err => {
          console.warn(
            'member orders watch failed',
            err
          );
        }
      )
  );
}


function compress(file){

  return new Promise(
    (resolve,reject)=>{

      const reader =
        new FileReader();

      reader.onerror =
        () =>
          reject(
            Error(
              'อ่านรูปสลิปไม่สำเร็จ'
            )
          );

      reader.onload =
        () => {

          const img =
            new Image();

          img.onerror =
            () =>
              reject(
                Error(
                  'เปิดรูปสลิปไม่สำเร็จ'
                )
              );

          img.onload =
            () => {

              const max =
                1400;

              const scale =
                Math.min(
                  1,
                  max /
                  Math.max(
                    img.width,
                    img.height
                  )
                );

              const cv =
                document.createElement(
                  'canvas'
                );

              cv.width =
                Math.max(
                  1,
                  Math.round(
                    img.width *
                    scale
                  )
                );

              cv.height =
                Math.max(
                  1,
                  Math.round(
                    img.height *
                    scale
                  )
                );

              cv
                .getContext('2d')
                .drawImage(
                  img,
                  0,
                  0,
                  cv.width,
                  cv.height
                );

              let quality =
                .82;

              let data =
                cv.toDataURL(
                  'image/jpeg',
                  quality
                );

              while(
                data.length >
                  500000 &&
                quality >
                  .38
              ){
                quality -= .08;

                data =
                  cv.toDataURL(
                    'image/jpeg',
                    quality
                  );
              }

              if(
                data.length >
                520000
              ){
                return reject(
                  Error(
                    'รูปสลิปใหญ่เกินไป กรุณาใช้รูปที่เล็กลง'
                  )
                );
              }

              resolve(data);
            };

          img.src =
            String(
              reader.result || ''
            );
        };

      reader.readAsDataURL(
        file
      );
    }
  );
}


function activePayment(){

  return document
    .querySelector(
      '[data-ym-order-pay].on'
    )
    ?.dataset
    ?.ymOrderPay ||
    '';
}


async function register(){

  const nickname =
    q('#regName')
      ?.value
      ?.trim() ||
    '';

  const email =
    q('#regEmail')
      ?.value
      ?.trim()
      ?.toLowerCase() ||
    '';

  const pass =
    q('#regPass')
      ?.value ||
    '';

  const pass2 =
    q('#regPass2')
      ?.value ||
    '';

  if(!nickname){
    throw Error(
      'กรุณากรอกชื่อเล่นค่ะ'
    );
  }

  if(!email){
    throw Error(
      'กรุณากรอกอีเมลค่ะ'
    );
  }

  if(pass.length < 6){
    throw Error(
      'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษรค่ะ'
    );
  }

  if(pass !== pass2){
    throw Error(
      'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกันค่ะ'
    );
  }

  const result =
    await auth
      .createUserWithEmailAndPassword(
        email,
        pass
      );

  await result.user
    .updateProfile({
      displayName:nickname
    });

  await db
    .collection('members')
    .doc(
      result.user.uid
    )
    .set(
      {
        nickname,
        email,
        credit:0,
        status:'active',
        createdAt:
          firebase
            .firestore
            .FieldValue
            .serverTimestamp()
      },
      {
        merge:true
      }
    );

  if(
    typeof window
      .ymMemberToast ===
    'function'
  ){
    window.ymMemberToast(
      'สมัครสมาชิกสำเร็จ ♡',
      'ยินดีต้อนรับ'
    );
  }
}

function ensurePreviewToastMotion(){

  if(
    document.getElementById(
      'ymProductionPreviewToastMotion'
    )
  ){
    return;
  }

  const s=
    document.createElement(
      'style'
    );

  s.id=
    'ymProductionPreviewToastMotion';

  s.textContent=`

    #ymMemberToast{
      transform:
        translate(-50%,-50%)
        scale(.985)!important;

      filter:
        blur(3px);

      opacity:
        0!important;

      transition:
        opacity .48s ease,
        transform .58s cubic-bezier(.16,1,.3,1),
        filter .42s ease!important;
    }

    #ymMemberToast.show{
      opacity:
        1!important;

      transform:
        translate(-50%,-50%)
        scale(1)!important;

      filter:
        blur(0);
    }

    #ymMemberToast.ym-leaving{
      opacity:
        0!important;

      visibility:
        visible!important;

      transform:
        translate(-50%,-51%)
        scale(.99)!important;

      filter:
        blur(2px);

      transition:
        opacity .38s ease,
        transform .42s ease,
        filter .32s ease!important;
    }

  `;

  document.head
    .appendChild(s);
}
  const toast=
    document.getElementById(
      'ymMemberToast'
    );

  const title=
    document.getElementById(
      'ymToastTitle'
    );

  const msg=
    document.getElementById(
      'ymToastText'
    );

  if(
    !toast ||
    !title ||
    !msg
  ){
    return;
  }

  let timer=null;
  let cleanup=null;

  window.ymMemberToast=
    function(t,m){

      clearTimeout(timer);
      clearTimeout(cleanup);

      toast.classList.remove(
        'show',
        'ym-leaving'
      );

      title.textContent=t;
      msg.textContent=m;

      requestAnimationFrame(
        ()=>
          requestAnimationFrame(
            ()=>{
              toast.classList.add(
                'show'
              );
            }
          )
      );

      timer=
        setTimeout(
          ()=>{

            toast.classList.remove(
              'show'
            );

            toast.classList.add(
              'ym-leaving'
            );

            cleanup=
              setTimeout(
                ()=>{
                  toast.classList.remove(
                    'ym-leaving'
                  );
                },
                450
              );

          },
          3000
        );
    };
}
async function login(){

  const email =
    q('#loginEmail')
      ?.value
      ?.trim()
      ?.toLowerCase() ||
    '';

  const pass =
    q('#loginPass')
      ?.value ||
    '';

  if(!email || !pass){
    throw Error(
      'กรุณากรอกอีเมลและรหัสผ่านค่ะ'
    );
  }

  const result =
    await auth
      .signInWithEmailAndPassword(
        email,
        pass
      );

  const nickname =
    result.user?.displayName ||
    profile?.nickname ||
    'สมาชิก Yuimellkub';

  ensurePreviewToastController();

  window.ymMemberToast?.(
    'เข้าสู่ระบบสำเร็จ ♡',
    'ยินดีต้อนรับกลับมา '+nickname
  );
}


async function forgot(){

  const email =
    q('#loginEmail')
      ?.value
      ?.trim()
      ?.toLowerCase() ||
    '';

  if(!email){
    throw Error(
      'กรุณากรอกอีเมลในช่องเข้าสู่ระบบก่อนค่ะ'
    );
  }

  await auth
    .sendPasswordResetEmail(
      email
    );

  alert(
    'ส่งอีเมลสำหรับตั้งรหัสผ่านใหม่แล้วค่ะ ♡ กรุณาตรวจสอบกล่องข้อความหรือ Spam'
  );
}


function creditWriteError(
  err
){

  const code=
    String(
      err?.code||
      ''
    );

  if(
    code.includes(
      'permission-denied'
    )
    ||
    /Missing or insufficient permissions/i
      .test(
        String(
          err?.message||
          ''
        )
      )
  ){
    return Error(
      'ระบบเติมเครดิตถูก Firestore ปฏิเสธสิทธิ์ กรุณาตรวจสอบว่า Rules ของ credit_requests ถูก Publish แล้ว'
    );
  }

  return err;
}


async function submitCredit(btn){

  const user=
    auth.currentUser;

  if(!user){
    throw Error(
      'กรุณาเข้าสู่ระบบก่อนค่ะ'
    );
  }

  /*
    บังคับ refresh Firebase Auth token ก่อนเขียนคำขอเติมเครดิต
    ป้องกัน session หน้าเว็บใหม่แต่ Firestore ยังถือ token เก่า
  */
  await user
    .getIdToken(true);

  const amount =
    Math.floor(
      Number(
        q('#creditAmount')
          ?.value ||
        0
      )
    );

  const file =
    q('#creditSlip')
      ?.files?.[0];

  if(!(amount > 0)){
    throw Error(
      'กรุณากรอกจำนวนเครดิตที่ต้องการเติมค่ะ'
    );
  }

  if(!file){
    throw Error(
      'กรุณาแนบสลิปชำระเงินก่อนส่งตรวจสอบค่ะ'
    );
  }

  if(
    requests.some(
      x =>
        x.status ===
        'pending'
    )
  ){
    throw Error(
      'มีรายการเติมเครดิตที่กำลังรอตรวจสอบอยู่แล้วค่ะ'
    );
  }

  btn.disabled = true;

  const data =
    await compress(file);

  const ref =
    db
      .collection(
        'credit_requests'
      )
      .doc();

  try{

    await ref.set({
      memberId:
        user.uid,

      nickname:
        profile?.nickname ||
        '',

      email:
        user.email ||
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

  }catch(err){

    throw creditWriteError(
      err
    );
  }
}


async function payWithCredit(btn){

  if(
    activePayment() !==
    'credit'
  ){
    return false;
  }

  if(
    !auth.currentUser ||
    !profile
  ){
    throw Error(
      'กรุณาเข้าสู่ระบบก่อนชำระด้วยเครดิต'
    );
  }

  const amount =
    Math.floor(
      Number(
        String(
          q('#ymOrderAmount')
            ?.textContent ||
          ''
        )
          .replace(
            /[^0-9.]/g,
            ''
          )
      ) ||
      0
    );

  if(!(amount > 0)){
    throw Error(
      'ยอดชำระไม่ถูกต้องค่ะ'
    );
  }

  if(
    Number(
      profile?.credit || 0
    ) < amount
  ){
    throw Error(
      'เครดิตไม่เพียงพอ กรุณาเติมเครดิตก่อน'
    );
  }

  const now =
    new Date();

  const pad =
    n =>
      String(n)
        .padStart(2,'0');

  const id =
    'YMK' +
    String(
      now.getFullYear()
    ).slice(-2) +
    pad(
      now.getMonth() + 1
    ) +
    pad(
      now.getDate()
    ) +
    '-' +
    pad(
      now.getHours()
    ) +
    pad(
      now.getMinutes()
    ) +
    pad(
      now.getSeconds()
    );

  const active =
    window
      .YMK_ACTIVE_PRODUCT_ORDER ||
    {};

  const qty =
    Math.max(
      1,
      Number(
        active.quantity ||
        q('#ymOrderQty')
          ?.value ||
        1
      )
    );

  const item =
    active.name
      ? (
          active.name +
          (
            qty > 1
              ? ' × ' + qty
              : ''
          )
        )
      : (
          q(
            '#ymOrderSelected b'
          )
            ?.textContent
            ?.trim() ||
          'สินค้า'
        );

  let pack = '';

  if(
    active.mode ===
    'send'
  ){
    pack =
      'แบบส่ง';

  }else{
    const text =
      q('#ymOrderSummary')
        ?.innerText ||
      q('#ymOrderSelected')
        ?.innerText ||
      '';

    const m =
      text.match(
        /แพ็ก(?:ที่เติม)?:\s*([^\n]+)/
      );

    pack =
      m
        ? m[1].trim()
        : '';
  }

  const uid =
    q('#ymOrderUid')
      ?.value
      ?.trim() ||
    '';

  const server =
    q('#ymOrderServer')
      ?.value ||
    'Asia';

  const name =
    q('#ymOrderName')
      ?.value
      ?.trim() ||
    '';

  btn.disabled = true;

  await db.runTransaction(
    async tx => {

      const memberRef =
        db
          .collection(
            'members'
          )
          .doc(
            auth
              .currentUser
              .uid
          );

      const memberSnap =
        await tx.get(
          memberRef
        );

      if(
        !memberSnap.exists
      ){
        throw Error(
          'ไม่พบบัญชีสมาชิก'
        );
      }

      const old =
        Number(
          memberSnap
            .data()
            .credit ||
          0
        );

      if(old < amount){
        throw Error(
          'เครดิตไม่เพียงพอ กรุณาเติมเครดิตก่อน'
        );
      }

      const remain =
        old - amount;

      const orderRef =
        db
          .collection('orders')
          .doc(id);

      const existing =
        await tx.get(
          orderRef
        );

      if(existing.exists){
        throw Error(
          'เลขออเดอร์ซ้ำ กรุณากดสั่งซื้ออีกครั้ง'
        );
      }

      const statusRef =
        db
          .collection(
            'order_status'
          )
          .doc(id);

      const historyRef =
        db
          .collection(
            'credit_history'
          )
          .doc(id);

      const serverTime =
        firebase
          .firestore
          .FieldValue
          .serverTimestamp();

      tx.update(
        memberRef,
        {
          credit:remain,
          lastCreditOrderId:id,
          updatedAt:serverTime
        }
      );

      tx.set(
        orderRef,
        {
          id,
          item,
          pack,
          price:
            amount +
            ' บาท',

          creditAmount:
            amount,

          quantity:
            qty,

          orderMode:
            active.mode ===
            'send'
              ? 'send'
              : 'instant',

          paymentMethod:
            'เครดิต',

          memberId:
            auth
              .currentUser
              .uid,

          uid,
          server,
          name,

          paymentStatus:
            'ชำระแล้ว',

          shopStatus:
            'รอเติม',

          orderReady:true,

          createdAt:
            serverTime
        }
      );

      tx.set(
        statusRef,
        {
          status:
            'รอเติม',

          paymentStatus:
            'ชำระแล้ว',

          orderReady:
            true,

          memberId:
            auth
              .currentUser
              .uid,

          updatedAt:
            serverTime
        }
      );

      tx.set(
        historyRef,
        {
          memberId:
            auth
              .currentUser
              .uid,

          type:
            'purchase',

          label:
            'ชำระ ' +
            item,

          amount:
            -amount,

          balanceAfter:
            remain,

          orderId:
            id,

          createdAt:
            serverTime
        }
      );
    }
  );

  const st =
    q('#ymOrderStatus');

  if(st){

    const isSend =
      active.mode ===
      'send';

    st.className =
      'ymOrderStatus show ok ymUnifiedDone';

    st.innerHTML = `
      <div class="ymUCheck">✓</div>

      <b>
        ชำระด้วยเครดิตเรียบร้อยแล้ว ♡
      </b>

      <div style="margin-top:8px">
        เลขออเดอร์
        <b>${id}</b>
      </div>

      <div style="margin-top:6px">
        สถานะ: รอเติม
      </div>

      ${
        isSend
          ? `
            <div style="
              margin-top:12px;
              padding:12px;
              border:1px solid #efc6d7;
              border-radius:14px;
              background:#fff3f8
            ">
              รบกวนลูกค้าทักเพจร้าน
              พร้อมแจ้งเลขออเดอร์
              <b>${id}</b>
              เพื่อดำเนินการแบบส่งต่อค่ะ ♡
            </div>
          `
          : ''
      }
    `;
  }

  return true;
}


function boot(){
   ensurePreviewToastMotion();
ensurePreviewToastController();

 

  if(
    !window.firebase ||
    !firebase.auth ||
    !firebase.firestore ||
    !window
      .YUIMELLKUB_FIREBASE_CONFIG
  ){
    setTimeout(
      boot,
      200
    );
    return;
  }

  try{
    if(!firebase.apps.length){
      firebase.initializeApp(
        window
          .YUIMELLKUB_FIREBASE_CONFIG
      );
    }

  }catch(e){
    console.warn(e);
  }

  auth =
    firebase.auth();

  db =
    firebase.firestore();

  window.YMK_MEMBER_PRODUCTION =
    true;

  try{
    auth.useDeviceLanguage();

    auth.setPersistence(
      firebase
        .auth
        .Auth
        .Persistence
        .LOCAL
    ).catch(()=>{});

  }catch(e){}

  /*
    Preview อ่าน member ผ่าน object นี้
    ให้ชี้มายังบัญชีจริง
  */
  if(window.YMPreviewStore){

    window.YMPreviewStore.me =
      () => profile;

    window.YMPreviewStore.history =
      () => history;

    window.YMPreviewStore.requests =
      () => requests;
  }


  /*
    AUTH / CREDIT
  */
  window.addEventListener(
    'click',
    async e => {

      const b =
        e.target
          ?.closest?.(
            '#registerBtn,#loginBtn,#logoutBtn,#forgotBtn,#creditSubmit'
          );

      if(!b){
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      try{

        if(
          b.id ===
          'registerBtn'
        ){
          b.disabled = true;

          await register();

          b.disabled = false;
        }

        if(
          b.id ===
          'loginBtn'
        ){
          b.disabled = true;

          await login();

          b.disabled = false;
        }

        if(
          b.id ===
          'logoutBtn'
        ){
          await auth.signOut();
        }

        if(
          b.id ===
          'forgotBtn'
        ){
          await forgot();
        }

        if(
          b.id ===
          'creditSubmit'
        ){
          await submitCredit(b);
        }

      }catch(err){

        console.error(
          'member action failed',
          err
        );

        alert(
          firebaseError(err)
        );

        b.disabled = false;
      }

    },
    true
  );


  /*
    CREDIT CHECKOUT
  */
  window.addEventListener(
    'click',
    async e => {

      const b =
        e.target
          ?.closest?.(
            '#ymOrderSubmit'
          );

      if(!b){
        return;
      }

      if(
        activePayment() !==
        'credit'
      ){
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const st =
        q('#ymOrderStatus');

      try{

        await payWithCredit(
          b
        );

      }catch(err){

        console.error(
          'credit checkout failed',
          err
        );

        if(st){
          st.className =
            'ymOrderStatus show';

          st.textContent =
            firebaseError(err);
        }

        b.disabled = false;
      }

    },
    true
  );


  auth.onAuthStateChanged(
    user=>{

      watch(
        user
      );

      /*
        Firebase Auth เป็น source of truth ของ production
      */
      if(window.YMPreviewStore){

        window.YMPreviewStore.me =
          () =>
            auth.currentUser
              ? (
                  profile ||
                  {
                    id:
                      auth.currentUser.uid,
                    email:
                      auth.currentUser.email || '',
                    nickname:
                      auth.currentUser.displayName || '',
                    credit:0
                  }
                )
              : null;

        window.YMPreviewStore.history =
          () => history;

        window.YMPreviewStore.requests =
          () => requests;
      }

      render();

      requestAnimationFrame(
        render
      );

      setTimeout(
        render,
        120
      );

      setTimeout(
        render,
        350
      );
    }
  );
}


boot();

})();
