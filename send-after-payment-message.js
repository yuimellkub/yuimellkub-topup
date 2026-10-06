(function(){
  'use strict';

  const ACTIVE =
    'ymk_active_manual_review';

  const PREFIX =
    'ymk_send_review_';

  let sendChosen = false;
  let activeReview = '';

  function get(k){
    try{
      return (
        localStorage.getItem(k) ||
        ''
      );
    }catch(e){
      return '';
    }
  }

  function set(k,v){
    try{
      if(v){
        localStorage.setItem(k,v);
      }else{
        localStorage.removeItem(k);
      }
    }catch(e){}
  }

  function removeNotice(){

    document
      .getElementById(
        'ymkSendAfterPaymentNotice'
      )
      ?.remove();
  }

  function isSend(){

    try{

      const order =
        typeof lastOrder !==
          'undefined'
          ? lastOrder
          : null;

      return (
        sendChosen ||
        order?.orderMode === 'send' ||
        order?.pack === 'แบบส่ง' ||
        window
          .YMK_SEND_ORDER_META
          ?.mode === 'send' ||
        window
          .YMK_SEND_SELECTION
          ?.mode === 'send' ||
        window
          .YMK_PENDING_ORDER_META
          ?.orderMode === 'send'
      );

    }catch(e){

      return sendChosen;
    }
  }

  function captureReview(){

    const id =
      get(ACTIVE);

    if(
      !/^SLIP\d{6}-\d{6}-[A-Z0-9]{3}$/
        .test(id)
    ){
      return;
    }

    if(!activeReview){
      activeReview = id;
    }

    if(isSend()){
      set(
        PREFIX + id,
        '1'
      );
    }
  }

  function approved(){

    const card =
      document.getElementById(
        'ymkForceCard'
      );

    if(
      !card ||
      card.dataset.ymkManualState !==
        'approved'
    ){
      return null;
    }

    const match =
      (card.innerText || '')
        .match(
          /YMK\d{6}-\d{6}/
        );

    if(!match){
      return null;
    }

    return {
      card,
      orderId:match[0]
    };
  }

  function approvedIsSend(){

    captureReview();

    return !!(
      activeReview &&
      get(
        PREFIX +
        activeReview
      ) === '1'
    );
  }

  function notice(orderId){

    const box =
      document.createElement(
        'div'
      );

    box.id =
      'ymkSendAfterPaymentNotice';

    box.style.cssText = `
      margin:12px 0 0;
      padding:13px 14px;
      border:1px solid #efc6d7;
      border-radius:14px;
      background:#fff3f8;
      color:#8f4f68;
      font-size:13px;
      font-weight:700;
      line-height:1.7;
      text-align:center;
    `;

    box.innerHTML = `
      <b style="
        display:block;
        font-size:15px;
        margin-bottom:5px;
      ">
        สำหรับออเดอร์แบบส่ง ♡
      </b>

      รบกวนลูกค้าทักเพจร้าน
      พร้อมแจ้งเลขออเดอร์

      <b style="
        display:block;
        margin:4px 0;
        color:#c85f88;
      ">
        ${orderId}
      </b>

      เพื่อให้ทางร้านดำเนินการแบบส่งต่อให้ค่ะ ♡

      <a
        href="https://m.me/yuimellkubtopup"
        target="_blank"
        rel="noopener"
        style="
          display:block;
          margin-top:10px;
          padding:10px;
          border-radius:999px;
          background:#e27ca5;
          color:#fff;
          text-decoration:none;
          font-weight:900;
        "
      >
        ทักเพจร้าน
      </a>
    `;

    return box;
  }

  function patch(){

    captureReview();

    const a =
      approved();

    if(!a){
      return;
    }

    if(
      !approvedIsSend()
    ){
      removeNotice();
      return;
    }

    if(
      a.card.querySelector(
        '#ymkSendAfterPaymentNotice'
      )
    ){
      return;
    }

    const n =
      notice(a.orderId);

    const copy =
      [...a.card.querySelectorAll(
        'button,a'
      )].find(el =>
        /คัดลอกเลขออเดอร์/
          .test(
            el.textContent || ''
          )
      );

    if(copy){
      copy.insertAdjacentElement(
        'beforebegin',
        n
      );
    }else{
      a.card.appendChild(n);
    }
  }

  document.addEventListener(
    'click',
    e => {

      const el =
        e.target.closest(
          'button,a'
        );

      if(!el){
        return;
      }

      if(
        el.classList.contains(
          'ymk-send-choice'
        )
      ){
        sendChosen = true;
        return;
      }

      /*
        สั่งซื้อปกติ = ล้างโหมดแบบส่ง
        แต่ Proxy แบบส่งห้ามล้าง
      */
      if(
        el.classList.contains(
          'ready-stock-order-btn'
        ) &&
        el.dataset
          .ymkSendConfirming !== '1'
      ){
        sendChosen = false;
        activeReview = '';
        removeNotice();
      }

    },
    true
  );

  let busy = false;

  function schedule(){

    if(busy){
      return;
    }

    busy = true;

    setTimeout(() => {
      busy = false;
      patch();
    },0);
  }

  new MutationObserver(
    schedule
  ).observe(
    document.body,
    {
      childList:true,
      subtree:true,
      characterData:true
    }
  );

  setInterval(() => {
    captureReview();
    patch();
  },300);

})();
