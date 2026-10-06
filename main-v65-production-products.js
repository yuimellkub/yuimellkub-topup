(function () {
  var CACHE = 'ymk_production_products_cache_v1';
  var items = [];
  var activeLabel = 'ทั้งหมด';

  function clean(v) {
    return String(v || '').trim();
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c];
    });
  }

  function labelOf(p) {
    return clean(p.categoryLabel || p.category || 'เติมกระดุม');
  }

  function isEcho(p) {
    var category = clean(p.category).toLowerCase();
    var label = labelOf(p);

    return (
      category === 'echoes' ||
      category === 'echo' ||
      label === 'เติมกระดุม' ||
      label === 'กระดุม'
    );
  }

  function sameCategory(p, label) {
    label = clean(label);

    if (label === 'ทั้งหมด') return true;

    if (label === 'เติมกระดุม') {
      return isEcho(p);
    }

    /*
      หมวดอื่นยึดชื่อจริงจาก Admin
      เช่น แพ็กสกิน / สัตว์เลี้ยง / ห้อง
      ไม่เดาหรือแปลงชื่อหมวดเอง
    */
    return (
      labelOf(p) === label ||
      clean(p.category) === label
    );
  }

  function unavailable(p) {
    return (
      p.status === 'out' ||
      p.status === 'paused' ||
      (
        !p.unlimitedStock &&
        p.stock != null &&
        Number(p.stock) <= 0
      )
    );
  }

  /*
    หาโซน "สินค้าพร้อมเติม" ของหน้า v65
    แล้วใช้พื้นที่สินค้าจริงแทน Preview
  */
  function getArea() {
    var title = Array.prototype.slice.call(
      document.querySelectorAll('h1,h2,h3,h4,b,strong,div,span')
    ).find(function (el) {
      var t = clean(el.textContent);
      return (
        t === '🎀 สินค้าพร้อมเติม' ||
        t === 'สินค้าพร้อมเติม'
      );
    });

    if (!title) return null;

    var root =
      title.closest(
        'section,.card,.panel,[class*="ready"],[class*="stock"]'
      ) ||
      title.parentElement;

    if (!root) return null;

    /*
      ซ่อน Preview เดิม
      ไม่ได้ลบสินค้าใน Firestore
    */
    root.querySelectorAll(
      '.ready-stock-grid,.products,.realProductPane'
    ).forEach(function (el) {
      if (!el.classList.contains('ymk-production-products')) {
        el.style.setProperty('display', 'none', 'important');
      }
    });

    var box = root.querySelector('.ymk-production-products');

    if (!box) {
      box = document.createElement('div');
      box.className = 'products ymk-production-products';
      root.appendChild(box);
    }

    return box;
  }

  function productCard(p) {
    var disabled = unavailable(p);

    var status = disabled
      ? (p.status === 'paused'
          ? 'ปิดชั่วคราว'
          : 'สินค้าหมด')
      : 'พร้อมเติม';

    var sendEnabled =
      p.sendEnabled === true &&
      Number(p.sendPrice || 0) > 0;

    var image =
      p.image ||
      p.imageUrl ||
      p.icon ||
      '';

    return (
      '<article ' +
        'class="product ready-stock-card ymk-real-product' +
        (disabled ? ' is-soldout' : '') +
        '" ' +
        'data-product-id="' + esc(p.id) + '" ' +
        'data-ready-category="' + esc(p.category || '') + '">' +

        '<div class="ymk-prod-image">' +

          (
            image
              ? '<img src="' +
                  esc(image) +
                  '" alt="' +
                  esc(p.name || 'สินค้า') +
                  '" loading="eager">'
              : '<span class="ymk-no-image">◉</span>'
          ) +

        '</div>' +

        '<b class="ymk-prod-name">' +
          esc(p.name || 'สินค้า') +
        '</b>' +

        '<span class="ready-stock-status ymk-prod-status">' +
          status +
        '</span>' +

        '<div class="ymk-store-bottom">' +

          '<strong class="ymk-store-price">' +
            Number(p.price || 0).toLocaleString('th-TH') +
            ' บาท' +
          '</strong>' +

          '<button ' +
            'type="button" ' +
            'class="ready-stock-order-btn" ' +

            'data-ready-name="' +
              esc(p.name || 'สินค้า') +
            '" ' +

            'data-ready-price="' +
              Number(p.price || 0) +
            '" ' +

            'data-ready-category="' +
              esc(p.category || '') +
            '" ' +

            'data-send-enabled="' +
              (sendEnabled ? '1' : '0') +
            '" ' +

            'data-send-price="' +
              (sendEnabled
                ? Number(p.sendPrice || 0)
                : 0) +
            '" ' +

            (disabled ? 'disabled' : '') +

          '>' +

            (disabled ? status : 'สั่งซื้อ') +

          '</button>' +

        '</div>' +

      '</article>'
    );
  }

  function addStyle() {
    if (document.getElementById('ymkProductionProductsV10')) {
      return;
    }

    var style = document.createElement('style');
    style.id = 'ymkProductionProductsV10';

    style.textContent = `

      .ymk-production-products{
        display:grid!important;
        grid-template-columns:
          repeat(auto-fill,minmax(155px,1fr))!important;
        gap:10px!important;
        width:100%!important;
        box-sizing:border-box!important;
      }

      .ymk-production-products
      .ready-stock-card{
        min-width:0!important;
        max-width:100%!important;
        box-sizing:border-box!important;
        overflow:hidden!important;
      }

      .ymk-production-products
      .ymk-prod-image{
        width:100%!important;
        height:88px!important;

        display:flex!important;
        align-items:center!important;
        justify-content:center!important;

        overflow:hidden!important;

        margin:
          4px auto
          8px!important;
      }

      .ymk-production-products
      .ymk-prod-image img{
        width:70px!important;
        height:70px!important;

        max-width:70px!important;
        max-height:70px!important;

        object-fit:contain!important;

        display:block!important;
      }

      .ymk-production-products
      .ymk-no-image{
        font-size:46px!important;
        color:#e38caf!important;
      }

      .ymk-production-products
      .ymk-prod-name{
        display:block!important;
      }

      .ymk-production-products
      .ymk-prod-status{
        display:inline-flex!important;
        margin:6px 0!important;
      }

      .ymk-production-products
      .ymk-store-bottom{
        margin-top:auto!important;

        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;

        gap:8px!important;
      }

      .ymk-production-products
      .ymk-store-price{
        white-space:nowrap!important;
      }

      /*
        หมวด "ทั้งหมด"
        มีสินค้าหลายรายการจึงเลื่อนภายในได้
      */
      .ymk-production-products.ymk-all{
        max-height:520px!important;
        overflow-y:auto!important;
        overflow-x:hidden!important;

        overscroll-behavior:contain;

        padding-right:4px;
      }

      /*
        animation ใช้กับสินค้า Production จริงเท่านั้น
      */
      .ymk-production-products
      .ymk-real-product{
        animation:
          ymkProductionProductIn
          .32s
          ease
          both;
      }

      @keyframes ymkProductionProductIn{
        from{
          opacity:0;
          transform:translateY(7px);
        }

        to{
          opacity:1;
          transform:translateY(0);
        }
      }

      @media(max-width:699px){

        .ymk-production-products{
          grid-template-columns:
            repeat(2,minmax(0,1fr))!important;
        }

        .ymk-production-products
        .ymk-prod-image{
          height:84px!important;
        }

        .ymk-production-products
        .ymk-prod-image img{
          width:66px!important;
          height:66px!important;

          max-width:66px!important;
          max-height:66px!important;
        }

      }

    `;

    document.head.appendChild(style);
  }

  function render() {
    var box = getArea();

    if (!box || !items.length) {
      return;
    }

    addStyle();

    var rows = items
      .filter(function (p) {
        return (
          p.visible !== false &&
          sameCategory(p, activeLabel)
        );
      })
      .sort(function (a, b) {

        var categoryOrder =
          Number(a.categoryOrder || 999) -
          Number(b.categoryOrder || 999);

        if (categoryOrder) {
          return categoryOrder;
        }

        return (
          Number(a.order || 0) -
          Number(b.order || 0)
        );
      });

    box.classList.toggle(
      'ymk-all',
      activeLabel === 'ทั้งหมด'
    );

    box.innerHTML =
      rows.map(productCard).join('');

    /*
      แจ้ง script แบบส่ง
      ให้ตรวจสินค้าใหม่อีกครั้ง
    */
    document.dispatchEvent(
      new CustomEvent(
        'ymk-storefront-products-rendered',
        {
          detail: {
            count: rows.length,
            category: activeLabel
          }
        }
      )
    );
  }

  /*
    อ่านชื่อแท็บตามที่หน้าเว็บแสดงจริง
    ไม่เปลี่ยน "แพ็กสกิน" เป็น "สกิน"
  */
  function getTabLabel(el) {
    if (!el) return '';

    var text = clean(el.textContent);

    var labels = [
      'ทั้งหมด',
      'เติมกระดุม',
      'แพ็กสกิน',
      'สัตว์เลี้ยง',
      'ห้อง',
      'เติมสกิน',
      'เติมประดับ'
    ];

    return labels.indexOf(text) !== -1
      ? text
      : '';
  }

  function bindTabs() {
    document.addEventListener(
      'click',
      function (event) {

        var tab =
          event.target.closest(
            'button,a,[role="tab"]'
          );

        if (!tab) return;

        var label = getTabLabel(tab);

        if (!label) return;

        activeLabel = label;

        setTimeout(render, 0);
      },
      true
    );
  }

  /*
    cache นี้เก็บเฉพาะข้อมูลที่เคยอ่าน
    สำเร็จจาก collection products จริง
  */
  function loadCache() {
    try {
      var cache =
        JSON.parse(
          localStorage.getItem(CACHE) ||
          '[]'
        );

      if (
        Array.isArray(cache) &&
        cache.length
      ) {
        items = cache;

        window.YMK_PRODUCTION_PRODUCTS =
          items;

        render();
      }

    } catch (e) {
      console.warn(
        'production cache unavailable',
        e
      );
    }
  }

  function saveCache() {
    try {
      localStorage.setItem(
        CACHE,
        JSON.stringify(items)
      );
    } catch (e) {}
  }

  function connectProduction() {

    if (
      !window.firebase ||
      !firebase.firestore
    ) {
      setTimeout(
        connectProduction,
        120
      );

      return;
    }

    firebase
      .firestore()
      .collection('products')
      .onSnapshot(
        function (snapshot) {

          items =
            snapshot.docs.map(
              function (doc) {
                return Object.assign(
                  { id: doc.id },
                  doc.data()
                );
              }
            );

          window.YMK_PRODUCTION_PRODUCTS =
            items;

          /*
            cache หลังจากอ่าน Production
            สำเร็จเท่านั้น
          */
          saveCache();

          render();
        },

        function (error) {
          console.warn(
            'production products failed',
            error
          );
        }
      );
  }

  function boot() {

    addStyle();

    bindTabs();

    /*
      ลำดับสำคัญ:
      1. สินค้าจริงครั้งล่าสุดจาก cache
      2. Production Firestore อัปเดตตามหลัง
    */
    loadCache();

    connectProduction();

    /*
      หน้า v65 บางส่วนสร้าง DOM ภายหลัง
      ถ้า cache โหลดก่อน container เกิด
      ให้ลอง render อีกครั้ง
    */
    setTimeout(render, 150);
    setTimeout(render, 400);
    setTimeout(render, 900);
  }

  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      boot
    );
  } else {
    boot();
  }

})();
