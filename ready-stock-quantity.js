(function(){
  'use strict';

  let proxyCard = null;
  let proxyButton = null;

  const clean = v =>
    String(v || '')
      .replace(/\s*[×xX]\s*\d+\s*$/,'')
      .trim();

  const num = v => {
    const n = Number(
      String(v ?? '')
        .replace(/,/g,'')
        .replace(/[^0-9.]/g,'')
    );

    return Number.isFinite(n) ? n : 0;
  };

  /*
    Preview v65 ผูก Flow จริงไว้กับปุ่มสินค้าเดิม
    เราเก็บปุ่มหนึ่งตัวไว้เป็นสะพาน
    แล้วใช้ Flow เดิมของ Preview 100%
  */
  function captureNativeButton(){

    if(proxyButton) return true;

    const original =
      document.querySelector(
        '#products .product button'
      );

    if(!original){
      return false;
    }

    const card =
      original.closest('.product');

    if(!card){
      return false;
    }

    const host =
      document.createElement('div');

    host.id =
      'ymkNativeOrderProxyHost';

    host.style.cssText = `
      display:none!important;
      position:absolute!important;
      width:0!important;
      height:0!important;
      overflow:hidden!important;
      pointer-events:none!important;
    `;

    /*
      ย้าย Node จริง ไม่ clone
      เพื่อเก็บ event listener ของ Preview เดิมไว้
    */
    host.appendChild(card);

    document.body.appendChild(host);

    proxyCard = card;
    proxyButton = original;

    proxyCard.classList.add(
      'ready-stock-card'
    );

    return true;
  }

  function resetNormalMode(){

    window.YMK_SEND_SELECTION = null;
    window.YMK_SEND_ORDER_META = null;

    window.YMK_PENDING_ORDER_META = null;
  }

  function prepareProxy(source, mode){

    if(
      !proxyButton &&
      !captureNativeButton()
    ){
      return false;
    }

    const isSend =
      mode === 'send';

    const base =
      clean(
        source.dataset.readyName ||
        source
          .closest('.ready-stock-card')
          ?.querySelector('.ymk-store-name')
          ?.textContent ||
        'สินค้า'
      );

    const unit =
      isSend
        ? num(source.dataset.sendPrice)
        : num(source.dataset.readyPrice);

    if(unit <= 0){
      return false;
    }

    const category =
      source.dataset.readyCategory ||
      source
        .closest('.ready-stock-card')
        ?.dataset.readyCategory ||
      '';

    const title =
      proxyCard.querySelector('b');

    const price =
      proxyCard.querySelector('.price');

    if(title){
      title.textContent = base;
    }

    if(price){
      price.textContent =
        '฿' +
        unit.toLocaleString('th-TH');
    }

    proxyButton.dataset.readyName =
      base;

    proxyButton.dataset.readyPrice =
      String(unit);

    proxyButton.dataset.readyCategory =
      category;

    proxyButton.dataset.productId =
      source.dataset.productId || '';

    proxyButton.dataset.sendPrice =
      source.dataset.sendPrice || '';

    proxyButton.dataset.sendEnabled =
      source.dataset.sendEnabled || '0';

    proxyCard.dataset.readyCategory =
      category;

    proxyCard.dataset.productId =
      source.dataset.productId || '';

    if(isSend){

      proxyButton.dataset.ymkSendConfirming =
        '1';

      window.YMK_SEND_SELECTION = {
        mode:'send',
        name:base,
        category,
        price:unit,
        quantity:1,
        total:unit
      };

      window.YMK_SEND_ORDER_META = {
        mode:'send',
        q:1,
        base,
        unit,
        total:unit
      };

      window.YMK_PENDING_ORDER_META = {
        q:1,
        base,
        p:{
          send:true,
          unit,
          total:unit
        },
        orderMode:'send'
      };

      window.YMK_FORCED_PACK_META =
        null;

    }else{

      delete proxyButton.dataset
        .ymkSendConfirming;

      resetNormalMode();

      window.YMK_PENDING_ORDER_META = {
        q:1,
        base,
        p:{
          unit,
          total:unit
        },
        orderMode:'instant'
      };
    }

    return true;
  }

  function openNative(source, mode){

    if(
      !source ||
      source.disabled
    ){
      return;
    }

    if(
      !prepareProxy(
        source,
        mode || 'instant'
      )
    ){
      console.warn(
        'Preview native order flow not ready'
      );

      return;
    }

    /*
      ปุ่มนี้คือปุ่มเดิมจาก Preview
      จึงเปิด:
      "ส่งออเดอร์ให้ร้าน ♡"
      + จำนวนสินค้า − / +
      + UID / Server
      + ไปชำระเงิน
      แบบเดิมทั้งหมด
    */
    proxyButton.click();

    if(mode === 'send'){
      document.dispatchEvent(
        new CustomEvent(
          'ymk-send-flow-opened'
        )
      );
    }
  }

  window.YMK_OPEN_NATIVE_PRODUCT_ORDER =
    function(source, mode){
      openNative(
        source,
        mode || 'instant'
      );
    };

  /*
    ปุ่ม "สั่งซื้อ" สินค้าจริง
    → เข้า Flow Preview เดิมโดยตรง
  */
  document.addEventListener(
    'click',
    e => {

      const btn =
        e.target.closest(
          '.ready-stock-order-btn'
        );

      if(!btn){
        return;
      }

      /*
        ปุ่ม Proxy ต้องปล่อยให้
        Preview เดิมรับ Event เอง
      */
      if(
        btn.closest(
          '#ymkNativeOrderProxyHost'
        )
      ){
        return;
      }

      if(
        btn.disabled ||
        btn.dataset.ymkConfirming === '1'
      ){
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      openNative(
        btn,
        'instant'
      );

    },
    true
  );

  function boot(){

    /*
      ต้องเก็บปุ่ม Preview เดิม
      ก่อน renderer สินค้าจริงแทนที่ DOM
    */
    if(!captureNativeButton()){
      setTimeout(boot,50);
      return;
    }
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
