(function(){
'use strict';

let db=null;
let auth=null;

let requestUnsub=null;
let memberUnsub=null;

let requests=[];
let members=[];

const $=s=>document.querySelector(s);

function esc(v=''){
  return String(v).replace(
    /[&<>"']/g,
    m=>({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[m])
  );
}

function ready(){

  try{

    if(
      !window.firebase ||
      !firebase.firestore ||
      !firebase.auth
    ){
      return false;
    }

    if(!firebase.apps.length){

      if(!window.YUIMELLKUB_FIREBASE_CONFIG){
        return false;
      }

      firebase.initializeApp(
        window.YUIMELLKUB_FIREBASE_CONFIG
      );
    }

    db=firebase.firestore();
    auth=firebase.auth();

    return true;

  }catch(e){

    console.error(
      'admin member firebase init failed',
      e
    );

    return false;
  }
}

function style(){

  if(
    document.getElementById(
      'ymkMcStyle'
    )
  ){
    return;
  }

  const s=document.createElement('style');

  s.id='ymkMcStyle';

  s.textContent=`

    #ymkMemberCreditProd{
      margin:14px 0;
    }

    .ymkMcPanel{
      border:1px solid #f2ccdc;
      background:#fff;
      border-radius:18px;
      padding:14px;
      margin-top:12px;
    }

    .ymkMcPanel h2{
      margin:0 0 12px;
      color:#8a5368;
      font-size:18px;
    }

    .ymkMcList{
      display:grid;
      gap:10px;
    }

    .ymkMcItem{
      border:1px solid #f2ccdc;
      border-radius:14px;
      padding:12px;
      background:#fffafd;
    }

    .ymkMcTop{
      display:flex;
      justify-content:space-between;
      gap:10px;
      align-items:flex-start;
    }

    .ymkMcMeta{
      font-size:12px;
      color:#a16b80;
      line-height:1.6;
    }

    .ymkMcAmt{
      font-weight:900;
      color:#d96f9a;
      white-space:nowrap;
    }

    .ymkMcActions{
      display:flex;
      gap:7px;
      flex-wrap:wrap;
      margin-top:9px;
    }

    .ymkMcEmpty{
      padding:28px;
      text-align:center;
      color:#aa7c8e;
      border:1px dashed #efc8d7;
      border-radius:14px;
    }

    .ymkMcThumb{
      max-width:110px;
      max-height:110px;
      border-radius:10px;
      border:1px solid #efc8d7;
      margin-top:8px;
      cursor:pointer;
    }

  `;

  document.head.appendChild(s);
}

function ensure(){

  style();

  let host=$('#ymkMemberCreditProd');

  if(host){
    return host;
  }

  host=document.createElement('section');
  host.id='ymkMemberCreditProd';

  host.innerHTML=`

    <div class="ymkMcPanel">

      <h2>♡ อนุมัติเครดิต</h2>

      <div
        id="ymkCreditRequests"
        class="ymkMcList"
      >
        <div class="ymkMcEmpty">
          กำลังโหลด...
        </div>
      </div>

    </div>

    <div class="ymkMcPanel">

      <h2>♡ จัดการบัญชีสมาชิก</h2>

      <div
        id="ymkMembers"
        class="ymkMcList"
      >
        <div class="ymkMcEmpty">
          กำลังโหลด...
        </div>
      </div>

    </div>
  `;

  const wrap=
    document.querySelector('.wrap') ||
    document.body;

  const footer=
    wrap.querySelector('.footer');

  if(footer){
    wrap.insertBefore(host,footer);
  }else{
    wrap.appendChild(host);
  }

  document.dispatchEvent(
    new CustomEvent(
      'ymk-member-credit-ready'
    )
  );

  return host;
}

function renderRequests(){

  const root=$('#ymkCreditRequests');

  if(!root){
    return;
  }

  root.innerHTML=
    requests.length

    ? requests.map(r=>`

      <div class="ymkMcItem">

        <div class="ymkMcTop">

          <div>

            <b>
              ${esc(
                r.nickname ||
                r.email ||
                r.memberId ||
                'สมาชิก'
              )}
            </b>

            <div class="ymkMcMeta">
              ${esc(r.email||'')}
              <br>
              ${esc(r.id)}
              ·
              ${esc(r.status||'pending')}
            </div>

          </div>

          <div class="ymkMcAmt">
            ${Number(r.amount||0).toLocaleString('th-TH')} บาท
          </div>

        </div>

        ${
          r.slipData || r.slipUrl

          ? `
            <img
              class="ymkMcThumb"
              src="${esc(r.slipData||r.slipUrl)}"
              data-credit-slip
            >
          `

          : ''
        }

        ${
          r.status === 'pending'

          ? `
            <div class="ymkMcActions">

              <button
                class="btn primary"
                data-ap="${esc(r.id)}"
              >
                อนุมัติ
              </button>

              <button
                class="btn danger"
                data-rj="${esc(r.id)}"
              >
                ไม่อนุมัติ
              </button>

            </div>
          `

          : ''
        }

      </div>

    `).join('')

    : `
      <div class="ymkMcEmpty">
        ยังไม่มีคำขอเติมเครดิต
      </div>
    `;

  root
    .querySelectorAll('[data-ap]')
    .forEach(
      b=>
        b.onclick=
          ()=>approve(b.dataset.ap)
    );

  root
    .querySelectorAll('[data-rj]')
    .forEach(
      b=>
        b.onclick=
          ()=>rejectRequest(b.dataset.rj)
    );

  root
    .querySelectorAll('[data-credit-slip]')
    .forEach(
      img=>
        img.onclick=
          ()=>window.open(
            img.src,
            '_blank'
          )
    );
}

function renderMembers(){

  const root=$('#ymkMembers');

  if(!root){
    return;
  }

  root.innerHTML=
    members.length

    ? members.map(m=>`

      <div class="ymkMcItem">

        <div class="ymkMcTop">

          <div>

            <b>
              ${esc(
                m.nickname ||
                m.email ||
                m.id
              )}
            </b>

            <div class="ymkMcMeta">
              ${esc(m.email||'')}
              <br>
              ${esc(m.id)}
            </div>

          </div>

          <div class="ymkMcAmt">
            เครดิต
            ${Number(m.credit||0).toLocaleString('th-TH')}
            บาท
          </div>

        </div>

      </div>

    `).join('')

    : `
      <div class="ymkMcEmpty">
        ยังไม่มีบัญชีสมาชิก
      </div>
    `;
}

function stop(){

  try{
    requestUnsub?.();
  }catch(_){}

  try{
    memberUnsub?.();
  }catch(_){}

  requestUnsub=null;
  memberUnsub=null;
}

function watch(){

  stop();

  if(!auth?.currentUser){

    requests=[];
    members=[];

    renderRequests();
    renderMembers();

    return;
  }

  requestUnsub=
    db
      .collection('credit_requests')
      .onSnapshot(
        snap=>{

          requests=
            snap.docs
              .map(d=>({
                id:d.id,
                ...d.data()
              }))
              .sort(
                (a,b)=>
                  (b.createdAt?.toMillis?.()||0)
                  -
                  (a.createdAt?.toMillis?.()||0)
              );

          renderRequests();
        },
        err=>
          console.error(
            'credit request watch failed',
            err
          )
      );

  memberUnsub=
    db
      .collection('members')
      .onSnapshot(
        snap=>{

          members=
            snap.docs.map(
              d=>({
                id:d.id,
                ...d.data()
              })
            );

          renderMembers();
        },
        err=>
          console.error(
            'member watch failed',
            err
          )
      );
}

async function approve(id){

  if(!auth?.currentUser){
    return alert(
      'กรุณาเข้าสู่ระบบร้านก่อนค่ะ'
    );
  }

  const ref=
    db
      .collection('credit_requests')
      .doc(id);

  try{

    await db.runTransaction(
      async tx=>{

        const s=
          await tx.get(ref);

        if(!s.exists){
          throw Error(
            'ไม่พบคำขอ'
          );
        }

        const r=s.data();

        if(r.status !== 'pending'){
          throw Error(
            'รายการนี้ถูกตรวจแล้ว'
          );
        }

        if(!r.memberId){
          throw Error(
            'คำขอไม่มี memberId'
          );
        }

        const mr=
          db
            .collection('members')
            .doc(String(r.memberId));

        const m=
          await tx.get(mr);

        if(!m.exists){
          throw Error(
            'ไม่พบบัญชีสมาชิก'
          );
        }

        const amount=
          Number(r.amount||0);

        const balance=
          Number(m.data().credit||0)
          +
          amount;

        tx.update(
          mr,
          {
            credit:balance,
            updatedAt:
              firebase.firestore
                .FieldValue
                .serverTimestamp()
          }
        );

        tx.update(
          ref,
          {
            status:'approved',

            approvedAt:
              firebase.firestore
                .FieldValue
                .serverTimestamp(),

            approvedBy:
              auth.currentUser.uid
          }
        );

        const h=
          db
            .collection('credit_history')
            .doc();

        tx.set(
          h,
          {
            memberId:r.memberId,

            type:'topup',

            label:'เติมเครดิต',

            amount,

            balanceAfter:balance,

            requestId:id,

            createdAt:
              firebase.firestore
                .FieldValue
                .serverTimestamp()
          }
        );
      }
    );

  }catch(e){

    console.error(e);

    alert(
      'อนุมัติไม่สำเร็จ: '+
      e.message
    );
  }
}

async function rejectRequest(id){

  if(!auth?.currentUser){
    return alert(
      'กรุณาเข้าสู่ระบบร้านก่อนค่ะ'
    );
  }

  try{

    await db
      .collection('credit_requests')
      .doc(id)
      .update({
        status:'rejected',

        rejectedAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp(),

        rejectedBy:
          auth.currentUser.uid
      });

  }catch(e){

    alert(
      'ไม่อนุมัติไม่สำเร็จ: '+
      e.message
    );
  }
}

function boot(){

  ensure();

  if(!ready()){

    setTimeout(
      boot,
      500
    );

    return;
  }

  auth.onAuthStateChanged(
    ()=>{
      watch();
    }
  );
}

if(
  document.readyState === 'loading'
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
