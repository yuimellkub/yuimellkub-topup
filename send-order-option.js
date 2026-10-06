(function(){
  'use strict';

  function enabled(btn){

    return (
      btn &&
      !btn.disabled &&
      btn.dataset.sendEnabled === '1' &&
      Number(btn.dataset.sendPrice || 0) > 0
    );
  }

  function layout(card){

    const bottom =
      card.querySelector(
        '.ymk-store-bottom'
      );

    const normal =
      card.querySelector(
        '.ready-stock-order-btn'
      );

    const send =
      card.querySelector(
        '.ymk-send-choice'
      );

    const price =
      card.querySelector(
        '.ymk-store-price'
      );

    if(
      !bottom ||
      !normal
    ){
      return;
    }

    /*
      ราคา
      สั่งซื้อ
      แบบส่ง
      เรียงแนวตั้ง
    */
    bottom.style.setProperty(
      'display',
      'flex',
      'important'
    );

    bottom.style.setProperty(
      'flex-direction',
      'column',
      'important'
    );

    bottom.style.setProperty(
      'align-items',
      'stretch',
      'important'
    );

    bottom.style.setProperty(
      'gap',
      '7px',
      'important'
    );

    if(price){

      price.style.setProperty(
        'width',
        '100%',
        'important'
      );

      price.style.setProperty(
        'text-align',
        'center',
        'important'
      );
    }

    normal.style.setProperty(
      'width',
      '100%',
      'important'
    );

    normal.style.setProperty(
      'margin',
      '0',
      'important'
    );

    if(send){

      send.style.setProperty(
        'width',
        '100%',
        'important'
      );

      send.style.setProperty(
        'margin',
        '0',
        'important'
      );
    }
  }

  function add(card){

    if(!card){
      return;
    }

    const normal =
      card.querySelector(
        '.ready-stock-order-btn'
      );

    const bottom =
      card.querySelector(
        '.ymk-store-bottom'
      );

    if(
      !normal ||
      !bottom
    ){
      return;
    }

    /*
      ถ้า Admin ไม่เปิดแบบส่ง
      ไม่สร้างปุ่ม
    */
    if(!enabled(normal)){

      card
        .querySelector(
          '.ymk-send-choice'
        )
        ?.remove();

      layout(card);

      return;
    }

    let send =
      card.querySelector(
        '.ymk-send-choice'
      );

    if(!send){

      send =
        document.createElement(
          'button'
        );

      send.type = 'button';

      send.className =
        'ymk-send-choice';

      send.textContent =
        'แบบส่ง';

      send.style.cssText = `
        height:42px;
        padding:0 14px;
        border:1px solid #e7a6bf;
        border-radius:999px;
        background:#fff7fa;
        color:#c85f88;
        font:inherit;
        font-size:12px;
        font-weight:850;
        cursor:pointer;
        box-sizing:border-box;
      `;

      bottom.appendChild(send);

      send.addEventListener(
        'click',
        e => {

          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          /*
            ไม่มี UI แบบส่งแยก
            เรียก Popup Preview เดิม
          */
          if(
            typeof window
              .YMK_OPEN_NATIVE_PRODUCT_ORDER ===
            'function'
          ){

            window
              .YMK_OPEN_NATIVE_PRODUCT_ORDER(
                normal,
                'send'
              );
          }

        },
        true
      );
    }

    layout(card);
  }

  function scan(){

    document
      .querySelectorAll(
        '.ready-stock-card'
      )
      .forEach(add);
  }

  function sendActive(){

    return (
      window
        .YMK_SEND_ORDER_META
        ?.mode === 'send'
    );
  }

  function quantity(){

    const input =
      document.getElementById(
        'ymOrderQty'
      );

    return Math.max(
      1,
      Math.min(
        99,
        Math.floor(
          Number(input?.value) || 1
        )
      )
    );
  }

  function syncMeta(){

    const meta =
      window.YMK_SEND_ORDER_META;

    if(
      !meta ||
      meta.mode !== 'send'
    ){
      return null;
    }

    meta.q = quantity();

    meta.total =
      Number(meta.unit || 0) *
      meta.q;

    if(window.YMK_SEND_SELECTION){

      window.YMK_SEND_SELECTION.quantity =
        meta.q;

      window.YMK_SEND_SELECTION.total =
        meta.total;
    }

    if(window.YMK_PENDING_ORDER_META){

      window.YMK_PENDING_ORDER_META.q =
        meta.q;

      window.YMK_PENDING_ORDER_META.base =
        meta.base;

      window.YMK_PENDING_ORDER_META.orderMode =
        'send';

      window.YMK_PENDING_ORDER_META.p = {
        send:true,
        unit:meta.unit,
        total:meta.total
      };
    }

    return meta;
  }

  function sendTypeLine(box){

    if(!box) return;

    let line =
      box.querySelector(
        '.ymk-send-type-line'
      );

    if(!line){

      line =
        document.createElement(
          'span'
        );

      line.className =
        'ymPackLine ymk-send-type-line';

      line.textContent =
        'ประเภท: แบบส่ง';

      box.appendChild(line);
    }
  }

  function patchFlow(){

    const meta =
      syncMeta();

    if(!meta){
      return;
    }

    /*
      Popup ส่งออเดอร์เดิม
    */
    sendTypeLine(
      document.getElementById(
        'ymOrderSelected'
      )
    );

    /*
      Popup ชำระเงินเดิม
    */
    sendTypeLine(
      document.getElementById(
        'ymOrderSummary'
      )
    );

    try{

      if(
        typeof lastOrder !==
          'undefined' &&
        lastOrder
      ){

        lastOrder.item =
          meta.q > 1
            ? meta.base +
              ' × ' +
              meta.q
            : meta.base;

        lastOrder.quantity =
          meta.q;

        lastOrder.price =
          meta.total;

        lastOrder.pack =
          'แบบส่ง';

        lastOrder.packPlan =
          'แบบส่ง';

        lastOrder.orderMode =
          'send';
      }

    }catch(e){}
  }

  /*
    จำนวนใน Popup Preview เปลี่ยน
    → ราคาแบบส่งเปลี่ยนตาม
  */
  document.addEventListener(
    'click',
    e => {

      if(
        e.target.closest(
          '#ymOrderQtyPlus,#ymOrderQtyMinus,#ymOrderNext'
        )
      ){
        setTimeout(patchFlow,0);
        setTimeout(patchFlow,30);
      }

    },
    true
  );

  document.addEventListener(
    'input',
    e => {

      if(
        e.target?.id ===
        'ymOrderQty'
      ){
        setTimeout(
          patchFlow,
          0
        );
      }

    },
    true
  );

  document.addEventListener(
    'ymk-send-flow-opened',
    () => {

      setTimeout(patchFlow,0);
      setTimeout(patchFlow,30);
      setTimeout(patchFlow,100);

    }
  );

  document.addEventListener(
    'ymk-storefront-products-rendered',
    () => setTimeout(scan,0)
  );

  const observer =
    new MutationObserver(() => {

      scan();

      if(sendActive()){
        patchFlow();
      }

    });

  function boot(){

    scan();

    observer.observe(
      document.body,
      {
        childList:true,
        subtree:true
      }
    );
  }

  if(
    document.readyState ===
    'loading'
  ){
    document.addEventListener(
      'DOMContentLoaded',
      boot
    );
  }else{
    boot();
  }

})();
