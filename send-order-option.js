(function(){

  function enabled(btn){
    return (
      btn &&
      btn.dataset.sendEnabled === '1' &&
      Number(btn.dataset.sendPrice || 0) > 0
    );
  }

  function add(card){

    if(
      !card ||
      card.querySelector('.ymk-send-choice')
    ){
      return;
    }

    const normal =
      card.querySelector('.ready-stock-order-btn');

    const bottom =
      card.querySelector('.ymk-store-bottom');

    if(
      !normal ||
      !bottom ||
      normal.disabled ||
      !enabled(normal)
    ){
      return;
    }

    const send =
      document.createElement('button');

    send.type = 'button';
    send.className = 'ymk-send-choice';
    send.textContent = '📦 แบบส่ง';

    send.style.cssText = `
      height:44px;
      border:1px solid #e7a6bf;
      border-radius:999px;
      background:#fff7fa;
      color:#c85f88;
      font:inherit;
      font-size:12px;
      font-weight:850;
      white-space:nowrap;
      cursor:pointer;
      box-sizing:border-box;
    `;

    bottom.appendChild(send);

    send.addEventListener('click', e => {

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      if(
        typeof window.YMK_OPEN_READY_ORDER ===
        'function'
      ){
        window.YMK_OPEN_READY_ORDER(
          card,
          'send'
        );
      }

    }, true);

    layout(card);
  }

  function layout(card){

    const bottom =
      card.querySelector('.ymk-store-bottom');

    const price =
      bottom?.querySelector(
        '.ready-stock-price,.ymk-store-price'
      );

    const normal =
      card.querySelector('.ready-stock-order-btn');

    const send =
      card.querySelector('.ymk-send-choice');

    if(
      !bottom ||
      !normal ||
      !send
    ){
      return;
    }

    bottom.style.setProperty(
      'display',
      'grid',
      'important'
    );

    bottom.style.setProperty(
      'gap',
      '8px',
      'important'
    );

    bottom.style.setProperty(
      'align-items',
      'center',
      'important'
    );

    if(
      window.matchMedia(
        '(max-width:699px)'
      ).matches
    ){

      bottom.style.setProperty(
        'grid-template-columns',
        '1fr 1fr',
        'important'
      );

      if(price){
        price.style.setProperty(
          'grid-column',
          '1 / -1',
          'important'
        );
      }

      normal.style.setProperty(
        'width',
        '100%',
        'important'
      );

      send.style.setProperty(
        'width',
        '100%',
        'important'
      );

    }else{

      bottom.style.setProperty(
        'grid-template-columns',
        'minmax(0,1fr) 104px 104px',
        'important'
      );

      normal.style.setProperty(
        'width',
        '104px',
        'important'
      );

      send.style.setProperty(
        'width',
        '104px',
        'important'
      );
    }
  }

  function scan(){

    document
      .querySelectorAll('.ready-stock-card')
      .forEach(add);
  }

  /*
    แบบส่งใช้ระบบออเดอร์เดียวกัน
    แต่เปลี่ยนข้อมูลรายการ
  */

  function patchSendOrder(){

    const meta =
      window.YMK_SEND_ORDER_META;

    if(
      !meta ||
      meta.mode !== 'send'
    ){
      return;
    }

    try{

      if(
        typeof lastOrder !== 'undefined' &&
        lastOrder
      ){

        lastOrder.item =
          meta.q > 1
            ? meta.base + ' × ' + meta.q
            : meta.base;

        lastOrder.pack = 'แบบส่ง';
        lastOrder.packPlan = 'แบบส่ง';
        lastOrder.quantity = meta.q;
        lastOrder.price = meta.total;
        lastOrder.orderMode = 'send';
      }

    }catch(e){}

    document
      .querySelectorAll('textarea')
      .forEach(el => {

        let v = el.value || '';

        if(
          !/รายการ:|แพ็ก:|ยอดรวม:/.test(v)
        ){
          return;
        }

        v = v
          .replace(
            /รายการ:\s*[^\n\r]*/,
            'รายการ: ' +
            (
              meta.q > 1
                ? meta.base + ' × ' + meta.q
                : meta.base
            )
          )
          .replace(
            /แพ็ก(?:ที่เติม)?:\s*[^\n\r]*/,
            'แพ็ก: แบบส่ง'
          )
          .replace(
            /ยอดรวม:\s*[^\n\r]*/,
            'ยอดรวม: ' +
            Number(meta.total || 0)
              .toLocaleString('th-TH') +
            ' บาท'
          );

        if(el.value !== v){
          el.value = v;

          el.dispatchEvent(
            new Event('input',{
              bubbles:true
            })
          );
        }
      });
  }

  /*
    หลังออเดอร์แบบส่งสำเร็จ
    เพิ่มข้อความให้ลูกค้าทักเพจ
  */

  function patchSuccess(){

    const meta =
      window.YMK_SEND_ORDER_META;

    if(
      !meta ||
      meta.mode !== 'send'
    ){
      return;
    }

    const walker =
      document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT
      );

    let node;
    let successFound = false;

    while(
      (node = walker.nextNode())
    ){

      const t =
        String(node.nodeValue || '');

      if(
        /สร้างออเดอร์เข้าสู่ระบบเรียบร้อยแล้ว|ยืนยันสลิปเรียบร้อยแล้ว|สั่งซื้อสำเร็จ|ออเดอร์สำเร็จ/.test(t)
      ){
        successFound = true;

        const box =
          node.parentElement?.closest(
            '.modal,.popup,[class*="modal"],[class*="popup"],[class*="success"]'
          ) ||
          node.parentElement?.parentElement;

        if(
          box &&
          !box.querySelector(
            '.ymk-send-contact-note'
          )
        ){

          const note =
            document.createElement('div');

          note.className =
            'ymk-send-contact-note';

          note.textContent =
            'รบกวนลูกค้าทักเพจเข้ามาเพื่อดำเนินการแบบส่งนะคะ ♡';

          note.style.cssText = `
            margin:12px 0 4px;
            padding:11px 13px;
            border-radius:14px;
            background:rgba(226,124,165,.10);
            color:#c85f88;
            font-size:12px;
            font-weight:800;
            text-align:center;
          `;

          box.appendChild(note);
        }
      }
    }

    if(successFound){
      patchSendOrder();
    }
  }

  document.addEventListener(
    'ymk-storefront-products-rendered',
    () => setTimeout(scan,0)
  );

  document.addEventListener(
    'click',
    () => {
      setTimeout(patchSendOrder,0);
      setTimeout(patchSendOrder,100);
      setTimeout(patchSendOrder,300);
    },
    true
  );

  const observer =
    new MutationObserver(() => {

      scan();

      if(
        window.YMK_SEND_ORDER_META?.mode ===
        'send'
      ){
        patchSendOrder();
        patchSuccess();
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
    document.readyState === 'loading'
  ){
    document.addEventListener(
      'DOMContentLoaded',
      boot
    );
  }else{
    boot();
  }

})();
