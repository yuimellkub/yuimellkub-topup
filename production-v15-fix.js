(function () {
  'use strict';

  let activeOrder = null;
  let db = null;

  const $ = s => document.querySelector(s);

  const clean = v =>
    String(v == null ? '' : v)
      .replace(/\s*[×xX]\s*\d+\s*$/, '')
      .trim();

  const number = v => {
    const n = Number(
      String(v == null ? '' : v)
        .replace(/,/g, '')
        .replace(/[^0-9.]/g, '')
    );

    return Number.isFinite(n) ? n : 0;
  };

  const money = n =>
    Number(n || 0).toLocaleString('th-TH') + ' บาท';


  /* =====================================================
     1. PRODUCT CARD UI
     ===================================================== */

  function installStyle() {
    if ($('#ymkProductionV15Style')) return;

    const s = document.createElement('style');
    s.id = 'ymkProductionV15Style';

    s.textContent = `
      /* การ์ดทุกหมวดสูงและจัดวางเหมือนกัน */
      .ready-stock-card.ymk-production-card{
        display:flex!important;
        flex-direction:column!important;
        height:100%!important;
        min-height:245px!important;
        overflow:hidden!important;
        transition:
          transform .22s cubic-bezier(.22,.61,.36,1),
          box-shadow .22s ease!important;
        transform-origin:center center!important;
      }

      /* hover แบบ Preview */
      .ready-stock-card.ymk-production-card:hover{
        transform:translateY(-3px) scale(1.012)!important;
        box-shadow:0 12px 25px rgba(177,90,125,.11)!important;
        z-index:2;
      }

      /* พื้นที่ชื่อเท่ากันทุกใบ */
      .ready-stock-card .ymk-store-name{
        display:-webkit-box!important;
        -webkit-box-orient:vertical!important;
        -webkit-line-clamp:2!important;
        overflow:hidden!important;
        min-height:2.9em!important;
        line-height:1.45!important;
        margin-top:6px!important;
      }

      .ready-stock-card .ymk-store-desc{
        display:-webkit-box!important;
        -webkit-box-orient:vertical!important;
        -webkit-line-clamp:2!important;
        overflow:hidden!important;
        min-height:0!important;
      }

      /* ดันราคา/ปุ่มลงด้านล่าง */
      .ready-stock-card .ymk-store-bottom{
        margin-top:auto!important;
        padding-top:10px!important;
        width:100%!important;
        display:flex!important;
        flex-direction:column!important;
        align-items:stretch!important;
        gap:7px!important;
      }

      .ready-stock-card .ymk-store-price{
        width:100%!important;
        text-align:center!important;
        margin:0!important;
      }

      /* สั่งซื้อ / แบบส่ง ทรงเดียวกัน */
      .ready-stock-card .ready-stock-order-btn,
      .ready-stock-card .ymk-send-choice{
        box-sizing:border-box!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        width:100%!important;
        min-width:0!important;
        min-height:42px!important;
        height:42px!important;
        margin:0!important;
        padding:0 14px!important;
        border-radius:12px!important;
        font:inherit!important;
        font-size:12px!important;
        font-weight:850!important;
        line-height:1!important;
        cursor:pointer!important;
        transition:
          transform .17s ease,
          filter .17s ease,
          box-shadow .17s ease!important;
      }

      .ready-stock-card .ready-stock-order-btn:hover,
      .ready-stock-card .ymk-send-choice:hover{
        transform:translateY(-1px)!important;
        filter:brightness(.985);
      }

      .ready-stock-card .ready-stock-order-btn:active,
      .ready-stock-card .ymk-send-choice:active{
        transform:scale(.975)!important;
      }

      /* แบบส่งยังคงโทนอ่อน แต่ทรงเหมือนสั่งซื้อ */
      .ready-stock-card .ymk-send-choice{
        border:1px solid #e7a6bf!important;
        background:#fff7fa!important;
        color:#c85f88!important;
      }

      html.ymDark .ready-stock-card .ymk-send-choice{
        background:#30232b!important;
        border-color:#654252!important;
        color:#f0b8cf!important;
      }

      @media(max-width:699px){
        .ready-stock-card.ymk-production-card{
          min-height:235px!important;
        }
      }
    `;

    document.head.appendChild(s);
  }


  /* =====================================================
     2. CURRENT PRODUCT STATE — REALTIME
     ===================================================== */

  function productState(btn, mode) {
    if (!btn) return null;

    const card =
      btn.closest('.ready-stock-card');

    if (!card) return null;

    const isSend = mode === 'send';

    const name = clean(
      btn.dataset.readyName ||
      card.querySelector('.ymk-store-name')?.textContent ||
      'สินค้า'
    );

    const unit = isSend
      ? number(btn.dataset.sendPrice)
      : number(btn.dataset.readyPrice);

    if (!(unit > 0)) return null;

    const category =
      String(
        btn.dataset.readyCategory ||
        card.dataset.readyCategory ||
        ''
      ).trim();

    return {
      btn,
      card,
      mode: isSend ? 'send' : 'instant',
      name,
      unit,
      category,
      productId:
        btn.dataset.productId ||
        card.dataset.productId ||
        ''
    };
  }

  function qty() {
    const input = $('#ymOrderQty');

    return Math.max(
      1,
      Math.min(
        99,
        Math.floor(Number(input?.value) || 1)
      )
    );
  }

  function echoAmount(name) {
    const m =
      String(name || '')
        .replace(/,/g, '')
        .match(/(\d+)\s*กระดุม/i);

    return m ? Number(m[1]) || 0 : 0;
  }

  function modeHtml() {
    if (!activeOrder) return '';

    return activeOrder.mode === 'send'
      ? '<span class="ymPackLine ymkOrderTypeLine">ประเภท: แบบส่ง</span>'
      : '';
  }

  function exactEchoPack(q) {
    if (!activeOrder) return '';

    const amount =
      echoAmount(activeOrder.name);

    if (!amount) return '';

    return (
      '<span class="ymPackLine">' +
      'แพ็กที่เติม: ' +
      amount.toLocaleString('th-TH') +
      ' × ' +
      q +
      '</span>'
    );
  }

  function currentPackText() {
    if (!activeOrder) return '';

    if (activeOrder.mode === 'send') {
      return 'แบบส่ง';
    }

    const amount =
      echoAmount(activeOrder.name);

    if (amount) {
      return (
        amount.toLocaleString('th-TH') +
        ' × ' +
        qty()
      );
    }

    /*
      สกิน / ประดับ / แพ็กสกิน ฯลฯ
      ให้ order-pack-modal-fix คำนวณแพ็กจริงต่อ
      แต่ห้ามดึงแพ็กของสินค้าก่อนหน้ามาใช้
    */
    return '';
  }

  function updateGlobals() {
    if (!activeOrder) return;

    const q = qty();
    const total =
      activeOrder.unit * q;

    let pack =
      currentPackText();

    window.YMK_ACTIVE_PRODUCT_ORDER = {
      productId: activeOrder.productId,
      name: activeOrder.name,
      category: activeOrder.category,
      mode: activeOrder.mode,
      unit: activeOrder.unit,
      quantity: q,
      total
    };

    if (activeOrder.mode === 'send') {
      window.YMK_SEND_SELECTION = {
        mode: 'send',
        name: activeOrder.name,
        category: activeOrder.category,
        price: activeOrder.unit,
        quantity: q,
        total
      };

      window.YMK_SEND_ORDER_META = {
        mode: 'send',
        q,
        base: activeOrder.name,
        unit: activeOrder.unit,
        total
      };

      window.YMK_PENDING_ORDER_META = {
        q,
        base: activeOrder.name,
        orderMode: 'send',
        p: {
          send: true,
          unit: activeOrder.unit,
          total
        }
      };

      pack = 'แบบส่ง';

    } else {
      window.YMK_SEND_SELECTION = null;
      window.YMK_SEND_ORDER_META = null;

      window.YMK_PENDING_ORDER_META = {
        q,
        base: activeOrder.name,
        orderMode: 'instant',
        p: {
          unit: activeOrder.unit,
          total
        }
      };
    }

    /*
      ให้ระบบ Production / ระบบตรวจสลิป
      ได้ข้อมูลสินค้าปัจจุบัน ไม่ใช่ของครั้งก่อน
    */
    try {
      window.lastOrder = Object.assign(
        {},
        window.lastOrder || {},
        {
          item:
            activeOrder.name +
            (q > 1 ? ' × ' + q : ''),
          baseItem: activeOrder.name,
          productId: activeOrder.productId,
          category: activeOrder.category,
          quantity: q,
          price: total + ' บาท',
          totalPrice: total,
          pack: pack,
          packPlan: pack,
          orderMode:
            activeOrder.mode === 'send'
              ? 'send'
              : 'instant'
        }
      );
    } catch (e) {}
  }

  function syncOrderPopup() {
    if (!activeOrder) return;

    const q = qty();

    const total =
      activeOrder.unit * q;

    const selected =
      $('#ymOrderSelected');

    if (selected) {
      selected.innerHTML =
        '<b>' +
        activeOrder.name +
        (q > 1 ? ' × ' + q : '') +
        '</b>' +
        '<br>' +
        'ราคา ' +
        money(total) +
        exactEchoPack(q) +
        modeHtml();
    }

    const qtyTotal =
      $('#ymOrderQtyTotal');

    if (qtyTotal) {
      qtyTotal.textContent =
        q > 1
          ? 'รวม ' + money(total)
          : '';
    }

    updateGlobals();
  }

  function syncPaymentPopup() {
    if (!activeOrder) return;

    const q = qty();

    const total =
      activeOrder.unit * q;

    const uid =
      $('#ymOrderUid')?.value.trim() ||
      '-';

    const server =
      $('#ymOrderServer')?.value ||
      '-';

    const customer =
      $('#ymOrderName')?.value.trim() ||
      '';

    const amount =
      $('#ymOrderAmount');

    if (amount) {
      amount.textContent =
        money(total);
    }

    const summary =
      $('#ymOrderSummary');

    if (summary) {
      summary.innerHTML =
        '<b>' +
        activeOrder.name +
        (q > 1 ? ' × ' + q : '') +
        '</b>' +
        exactEchoPack(q) +
        modeHtml() +
        '<br>UID: ' +
        uid +
        ' • Server: ' +
        server +
        (
          customer
            ? '<br>ชื่อ: ' + customer
            : ''
        );
    }

    updateGlobals();
  }

  function scheduleSync() {
    [0, 20, 60, 120, 220].forEach(ms => {
      setTimeout(() => {
        syncOrderPopup();
      }, ms);
    });
  }


  /* =====================================================
     3. HOOK NATIVE PREVIEW FLOW
     ===================================================== */

  function installOrderHook() {
    function wrap() {
      if (
        typeof window.YMK_OPEN_NATIVE_PRODUCT_ORDER !==
        'function'
      ) {
        return false;
      }

      if (
        window
          .YMK_OPEN_NATIVE_PRODUCT_ORDER
          .__ymkV15
      ) {
        return true;
      }

      const original =
        window.YMK_OPEN_NATIVE_PRODUCT_ORDER;

      function wrapped(btn, mode) {
        const state =
          productState(
            btn,
            mode || 'instant'
          );

        if (state) {
          activeOrder = state;

          const q =
            $('#ymOrderQty');

          if (q) q.value = '1';

          /*
            ล้างข้อมูลของออเดอร์เก่า
            ก่อนเปิด Modal ทุกครั้ง
          */
          const selected =
            $('#ymOrderSelected');

          if (selected) {
            selected.innerHTML = '';
          }

          const summary =
            $('#ymOrderSummary');

          if (summary) {
            summary.innerHTML = '';
          }

          const qt =
            $('#ymOrderQtyTotal');

          if (qt) qt.textContent = '';

          updateGlobals();
        }

        const result =
          original.apply(
            this,
            arguments
          );

        scheduleSync();

        return result;
      }

      wrapped.__ymkV15 = true;

      window.YMK_OPEN_NATIVE_PRODUCT_ORDER =
        wrapped;

      return true;
    }

    if (!wrap()) {
      const timer =
        setInterval(() => {
          if (wrap()) {
            clearInterval(timer);
          }
        }, 50);
    }

    /*
      สำรองกรณีปุ่มสั่งซื้อถูก handler ตัวอื่นจับก่อน
    */
    document.addEventListener(
      'pointerdown',
      e => {
        const normal =
          e.target.closest(
            '.ready-stock-order-btn'
          );

        if (
          normal &&
          !normal.closest(
            '#ymkNativeOrderProxyHost'
          )
        ) {
          const state =
            productState(
              normal,
              'instant'
            );

          if (state) {
            activeOrder = state;
            updateGlobals();
          }
        }

        const send =
          e.target.closest(
            '.ymk-send-choice'
          );

        if (send) {
          const card =
            send.closest(
              '.ready-stock-card'
            );

          const btn =
            card?.querySelector(
              '.ready-stock-order-btn'
            );

          const state =
            productState(
              btn,
              'send'
            );

          if (state) {
            activeOrder = state;
            updateGlobals();
          }
        }
      },
      true
    );

    document.addEventListener(
      'click',
      e => {
        if (
          e.target.closest(
            '#ymOrderQtyPlus,#ymOrderQtyMinus'
          )
        ) {
          setTimeout(
            syncOrderPopup,
            0
          );

          setTimeout(
            syncOrderPopup,
            30
          );
        }

        if (
          e.target.closest(
            '#ymOrderNext'
          )
        ) {
          /*
            Preview handler ทำงานก่อน/หลังได้
            เราเขียน snapshot ปัจจุบันทับอีกครั้ง
          */
          setTimeout(() => {
            syncOrderPopup();
            syncPaymentPopup();
          }, 0);

          setTimeout(
            syncPaymentPopup,
            40
          );

          setTimeout(
            syncPaymentPopup,
            120
          );
        }

        if (
          e.target.closest(
            '[data-ym-order-pay]'
          )
        ) {
          setTimeout(
            syncPaymentPopup,
            0
          );

          setTimeout(
            syncPaymentPopup,
            80
          );
        }
      },
      true
    );

    document.addEventListener(
      'input',
      e => {
        if (
          e.target?.id ===
          'ymOrderQty'
        ) {
          syncOrderPopup();
        }
      },
      true
    );

    document.addEventListener(
      'change',
      e => {
        if (
          e.target?.id ===
          'ymOrderQty'
        ) {
          syncOrderPopup();
        }
      },
      true
    );
  }


  /* =====================================================
     4. LEGACY → PREVIEW PRODUCTION ORDER ADAPTER
     Preview ใช้ ymOrder...
     ระบบ Production เก่าใช้ orderUid/slipFile...
     ===================================================== */

  function hiddenInput(id, type) {
    let el = $('#' + id);

    if (el) return el;

    el =
      document.createElement('input');

    el.id = id;
    el.type = type || 'text';

    el.style.cssText =
      'display:none!important';

    document.body.appendChild(el);

    return el;
  }

  function ensureLegacyElements() {
    hiddenInput('orderUid');
    hiddenInput('orderName');

    let server =
      $('#orderServer');

    if (!server) {
      server =
        document.createElement(
          'select'
        );

      server.id = 'orderServer';

      server.innerHTML =
        '<option value="Asia">Asia</option>' +
        '<option value="NA-EU">NA-EU</option>' +
        '<option value="อื่น ๆ">อื่น ๆ</option>';

      server.style.cssText =
        'display:none!important';

      document.body.appendChild(server);
    }

    let slip =
      $('#slipFile');

    if (!slip) {
      slip =
        document.createElement(
          'input'
        );

      slip.type = 'file';
      slip.accept = 'image/*';
      slip.id = 'slipFile';

      slip.style.cssText =
        'display:none!important';

      document.body.appendChild(slip);
    }

    let status =
      $('#adminSaveStatus');

    if (!status) {
      status =
        document.createElement(
          'div'
        );

      status.id =
        'adminSaveStatus';

      status.style.cssText =
        'display:none!important';

      document.body.appendChild(status);
    }

    if (
      typeof window.getPaymentMethod !==
      'function'
    ) {
      window.getPaymentMethod =
        function () {
          const b =
            document.querySelector(
              '[data-ym-order-pay].on'
            );

          return (
            b?.dataset.ymOrderPay ||
            'qr'
          );
        };
    }
  }

  function copyFileList(from, to) {
    if (
      !from?.files?.length ||
      !to
    ) {
      return;
    }

    try {
      to.files = from.files;
      return;
    } catch (e) {}

    try {
      const dt =
        new DataTransfer();

      Array.from(from.files)
        .forEach(file => {
          dt.items.add(file);
        });

      to.files = dt.files;
    } catch (e) {}
  }

  function syncLegacyFields() {
    ensureLegacyElements();

    const uid =
      $('#ymOrderUid');

    const server =
      $('#ymOrderServer');

    const name =
      $('#ymOrderName');

    const slip =
      $('#ymOrderSlip');

    $('#orderUid').value =
      uid?.value.trim() || '';

    $('#orderServer').value =
      server?.value || 'Asia';

    $('#orderName').value =
      name?.value.trim() || '';

    copyFileList(
      slip,
      $('#slipFile')
    );

    syncOrderPopup();
    syncPaymentPopup();
    updateGlobals();
  }


  /* =====================================================
     5. PREVIEW STATUS ← PRODUCTION STATUS
     ===================================================== */

  function renderPendingStatus() {
    const box =
      $('#ymOrderStatus');

    if (!box) return;

    box.className =
      'ymOrderStatus show';

    box.innerHTML = `
      <div style="
        font-size:28px;
        font-weight:900;
        color:#d9789e;
        margin-bottom:7px
      ">✓</div>

      <b>ส่งสลิปเรียบร้อยแล้ว ♡</b>

      <div style="
        margin-top:5px;
        font-weight:800
      ">
        กำลังรอร้านตรวจสอบสลิป
      </div>

      <div style="
        margin-top:10px;
        font-size:12px;
        line-height:1.7
      ">
        ร้านได้รับสลิปในระบบแล้ว
        ไม่ต้องส่งซ้ำนะคะ ♡
      </div>

      <div style="
        margin-top:10px;
        font-size:11px;
        opacity:.8;
        line-height:1.6
      ">
        หลังตรวจสอบเรียบร้อย
        ระบบจะแสดงเลขออเดอร์สำหรับติดตามสถานะตามปกติ
      </div>
    `;
  }

  function renderApprovedStatus(id) {
    const box =
      $('#ymOrderStatus');

    if (!box || !id) return;

    const isSend =
      activeOrder?.mode === 'send' ||
      window
        .YMK_SEND_ORDER_META
        ?.mode === 'send';

    box.className =
      'ymOrderStatus show ok ymUnifiedDone';

    box.innerHTML = `
      <div class="ymUCheck">✓</div>

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
        ${id}
      </b>

      ${
        isSend
          ? `
            <div style="
              margin:12px 0 0;
              padding:12px;
              border:1px solid #efc6d7;
              border-radius:14px;
              background:#fff3f8;
              color:#8f4f68;
              font-size:12px;
              line-height:1.7
            ">
              รบกวนลูกค้าทักเพจร้าน
              พร้อมแจ้งเลขออเดอร์
              <b>${id}</b>
              เพื่อให้ทางร้านดำเนินการแบบส่งต่อค่ะ ♡

              <a
                href="https://m.me/yuimellkubtopup"
                target="_blank"
                rel="noopener"
                style="
                  display:block;
                  margin-top:8px;
                  padding:9px;
                  border-radius:12px;
                  background:#e27ca5;
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
          class="ymOrderNext"
          data-ymk-v15-new
        >
          ทำรายการออเดอร์ใหม่
        </button>

        <button
          type="button"
          class="ymOrderBack"
          data-ymk-v15-copy="${id}"
        >
          คัดลอกเลขออเดอร์
        </button>
      </div>
    `;

    const submit =
      $('#ymOrderSubmit');

    if (submit) {
      submit.disabled = true;
    }
  }

  function mirrorProductionStatus() {
    const source =
      $('#adminSaveStatus');

    if (!source) return;

    const text =
      String(
        source.textContent || ''
      ).trim();

    if (!text) return;

    if (
      /กำลังรอร้านตรวจสอบ|ส่งสลิปแล้ว|รอร้านตรวจสอบสลิป|ยังไม่มีการสร้างออเดอร์/.test(
        text
      )
    ) {
      renderPendingStatus();
    }

    const id =
      (
        text.match(
          /YMK\d{6}-\d{6}/
        ) ||
        []
      )[0];

    if (
      id &&
      /ส่งออเดอร์เข้าระบบแล้ว|เลขออเดอร์|ยืนยันสลิป/.test(
        text
      )
    ) {
      renderApprovedStatus(id);
    }
  }


  /* =====================================================
     6. SUBMIT NORMAL SLIP → PRODUCTION
     ===================================================== */

  function paymentMethod() {
    return (
      document
        .querySelector(
          '[data-ym-order-pay].on'
        )
        ?.dataset.ymOrderPay ||
      'qr'
    );
  }

  function installProductionSubmit() {
    window.addEventListener(
      'click',
      async e => {
        const submit =
          e.target?.closest?.(
            '#ymOrderSubmit'
          );

        if (!submit) return;

        /*
          เครดิตให้ member-production-bridge
          เป็นเจ้าของ transaction ตามเดิม
        */
        if (
          paymentMethod() === 'credit'
        ) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const slip =
          $('#ymOrderSlip')
            ?.files?.[0];

        if (!activeOrder) {
          const st =
            $('#ymOrderStatus');

          if (st) {
            st.className =
              'ymOrderStatus show';

            st.textContent =
              'ไม่พบข้อมูลสินค้าที่กำลังสั่ง กรุณากลับไปเลือกสินค้าอีกครั้ง';
          }

          return;
        }

        if (
          !$('#ymOrderUid')
            ?.value
            ?.trim()
        ) {
          alert(
            'กรุณากรอก UID / ID ผู้เล่น'
          );
          return;
        }

        if (!slip) {
          const st =
            $('#ymOrderStatus');

          if (st) {
            st.className =
              'ymOrderStatus show';

            st.textContent =
              'กรุณาแนบสลิปชำระเงินก่อนส่งออเดอร์';
          }

          return;
        }

        syncLegacyFields();

        if (
          typeof window
            .saveOrderToDemoAdmin !==
          'function'
        ) {
          const st =
            $('#ymOrderStatus');

          if (st) {
            st.className =
              'ymOrderStatus show';

            st.textContent =
              'ระบบออเดอร์ Production ยังโหลดไม่เสร็จ กรุณาลองใหม่อีกครั้ง';
          }

          return;
        }

        submit.disabled = true;

        const st =
          $('#ymOrderStatus');

        if (st) {
          st.className =
            'ymOrderStatus show';

          st.textContent =
            'กำลังส่งสลิปเข้าสู่ระบบร้าน…';
        }

        try {
          const ok =
            await window
              .saveOrderToDemoAdmin();

          mirrorProductionStatus();

          if (ok === false) {
            submit.disabled = false;
          }

        } catch (err) {
          console.error(
            'production submit failed',
            err
          );

          if (st) {
            st.className =
              'ymOrderStatus show';

            st.textContent =
              'ส่งออเดอร์ไม่สำเร็จ: ' +
              (
                err?.message ||
                'กรุณาลองใหม่'
              );
          }

          submit.disabled = false;
        }
      },
      true
    );

    ensureLegacyElements();

    const status =
      $('#adminSaveStatus');

    if (status) {
      new MutationObserver(
        mirrorProductionStatus
      ).observe(
        status,
        {
          childList: true,
          subtree: true,
          characterData: true
        }
      );
    }
  }


  /* =====================================================
     7. REAL FIRESTORE ORDER LOOKUP
     ===================================================== */

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(
        /[&<>"']/g,
        c => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[c])
      );
  }

  async function findOrder(raw) {
    if (!db) {
      throw Error(
        'ยังเชื่อมฐานข้อมูลไม่สำเร็จ'
      );
    }

    const value =
      String(raw || '')
        .trim()
        .replace(/^#/, '')
        .toUpperCase();

    if (!value) {
      throw Error(
        'กรุณากรอกเลขออเดอร์'
      );
    }

    /*
      เลขเต็ม Production
    */
    if (
      /^YMK\d{6}-\d{6}$/.test(value)
    ) {
      const [
        orderSnap,
        statusSnap
      ] = await Promise.all([
        db
          .collection('orders')
          .doc(value)
          .get(),
        db
          .collection('order_status')
          .doc(value)
          .get()
      ]);

      if (
        !orderSnap.exists &&
        !statusSnap.exists
      ) {
        return null;
      }

      return Object.assign(
        {
          id: value
        },
        orderSnap.exists
          ? orderSnap.data()
          : {},
        statusSnap.exists
          ? {
              status:
                statusSnap.data()
                  .status,
              paymentStatus:
                statusSnap.data()
                  .paymentStatus
            }
          : {}
      );
    }

    /*
      รองรับกรอกท้ายเลข เช่น 1652 / 501652
      ค้นเฉพาะรายการล่าสุด ไม่แตะข้อมูลเก่า
    */
    const snap =
      await db
        .collection('orders')
        .orderBy(
          'createdAt',
          'desc'
        )
        .limit(150)
        .get();

    const hit =
      snap.docs.find(doc =>
        String(doc.id)
          .toUpperCase()
          .endsWith(value)
      );

    if (!hit) return null;

    const st =
      await db
        .collection(
          'order_status'
        )
        .doc(hit.id)
        .get();

    return Object.assign(
      {
        id: hit.id
      },
      hit.data() || {},
      st.exists
        ? {
            status:
              st.data().status,
            paymentStatus:
              st.data()
                .paymentStatus
          }
        : {}
    );
  }

  function installLookup() {
    window.addEventListener(
      'click',
      async e => {
        const btn =
          e.target?.closest?.(
            '#orderPopupSubmit'
          );

        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const input =
          $('#orderPopupInput');

        const result =
          $('#orderPopupResult');

        if (!result) return;

        const raw =
          input?.value || '';

        result.classList.add(
          'show'
        );

        result.innerHTML =
          'กำลังตรวจสอบออเดอร์…';

        try {
          const order =
            await findOrder(raw);

          if (!order) {
            result.innerHTML = `
              <div class="orderEmptyIcon">♡</div>
              ไม่พบเลขออเดอร์นี้ในระบบ
            `;
            return;
          }

          const status =
            order.shopStatus ||
            order.status ||
            order.paymentStatus ||
            'รอดำเนินการ';

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

            </div>
          `;

        } catch (err) {
          console.error(
            'order lookup failed',
            err
          );

          result.textContent =
            'ตรวจสอบออเดอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
        }
      },
      true
    );
  }


  /* =====================================================
     8. SUCCESS BUTTONS
     ===================================================== */

  document.addEventListener(
    'click',
    e => {
      const copy =
        e.target.closest(
          '[data-ymk-v15-copy]'
        );

      if (copy) {
        const id =
          copy.getAttribute(
            'data-ymk-v15-copy'
          );

        navigator.clipboard
          ?.writeText(id)
          .then(() => {
            const old =
              copy.textContent;

            copy.textContent =
              'คัดลอกแล้ว ✓';

            setTimeout(() => {
              if (copy.isConnected) {
                copy.textContent =
                  old;
              }
            }, 1000);
          });

        return;
      }

      if (
        e.target.closest(
          '[data-ymk-v15-new]'
        )
      ) {
        activeOrder = null;

        window.YMK_ACTIVE_PRODUCT_ORDER =
          null;

        window.YMK_SEND_SELECTION =
          null;

        window.YMK_SEND_ORDER_META =
          null;

        window.YMK_PENDING_ORDER_META =
          null;

        window.lastOrder = null;

        const st =
          $('#ymOrderStatus');

        if (st) {
          st.className =
            'ymOrderStatus';

          st.innerHTML = '';
        }

        const slip =
          $('#ymOrderSlip');

        if (slip) slip.value = '';

        const preview =
          $('#ymOrderSlipPreview');

        if (preview) {
          preview.innerHTML = '';
        }

        const submit =
          $('#ymOrderSubmit');

        if (submit) {
          submit.disabled = false;
        }

        $('#ymProductPaymentOverlay')
          ?.classList
          .remove('show');

        $('#ymProductOrderOverlay')
          ?.classList
          .remove('show');

        $('#products')
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
      }
    },
    true
  );


  /* =====================================================
     9. FIREBASE
     ===================================================== */

  function firebaseStart() {
    try {
      if (
        !window.firebase ||
        !firebase.firestore ||
        !window
          .YUIMELLKUB_FIREBASE_CONFIG
      ) {
        return setTimeout(
          firebaseStart,
          150
        );
      }

      if (!firebase.apps.length) {
        firebase.initializeApp(
          window
            .YUIMELLKUB_FIREBASE_CONFIG
        );
      }

      db = firebase.firestore();

      window.YMK_PRODUCTION_DB =
        db;

    } catch (e) {
      console.error(
        'Firebase V15 start failed',
        e
      );
    }
  }


  /* =====================================================
     START
     ===================================================== */

  function boot() {
    installStyle();

    firebaseStart();

    installOrderHook();

    installProductionSubmit();

    installLookup();

    document.addEventListener(
      'ymk-storefront-products-rendered',
      () => {
        installStyle();
      }
    );
  }

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      boot
    );
  } else {
    boot();
  }

})();
