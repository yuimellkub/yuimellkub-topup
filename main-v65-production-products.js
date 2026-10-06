(function () {
  'use strict';

  const CACHE = 'ymk_production_products_cache_v5';

  let items = [];
  let active = 'echoes';

  const clean = v => String(v || '').trim();

  const esc = v =>
    String(v == null ? '' : v).replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));

  function key(p) {
    const c = clean(p.category).toLowerCase();
    const l = clean(p.categoryLabel);

    if (
      c === 'echoes' ||
      c === 'echo' ||
      l === 'เติมกระดุม' ||
      l === 'กระดุม'
    ) return 'echoes';

    if (
      c === 'skins' ||
      c === 'skin' ||
      l === 'เติมสกิน'
    ) return 'skins';

    if (
      c === 'accessories' ||
      c === 'accessory' ||
      l === 'เติมประดับ'
    ) return 'accessory';

    if (
      c === 'skinpack' ||
      l === 'แพ็กสกิน'
    ) return 'skinpack';

    if (
      c === 'pets' ||
      c === 'pet' ||
      l === 'สัตว์เลี้ยง'
    ) return 'pets';

    if (
      c === 'room' ||
      c === 'rooms' ||
      l === 'ห้อง'
    ) return 'room';

    return c || l || 'other';
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

  function card(p) {
    const bad = unavailable(p);

    const img =
      p.image ||
      p.imageUrl ||
      p.icon ||
      '';

    const send =
      p.sendEnabled === true &&
      Number(p.sendPrice || 0) > 0;

    return `
      <div
        class="product ready-stock-card ymk-production-card"
        data-product-id="${esc(p.id)}"
        data-ready-category="${esc(p.category || '')}"
      >

        ${
          img
            ? `
              <div class="gem ymk-production-image">
                <img
                  src="${esc(img)}"
                  alt="${esc(p.name || 'สินค้า')}"
                >
              </div>
            `
            : `<div class="gem">♡</div>`
        }

        <b class="ymk-store-name">
          ${esc(p.name || 'สินค้า')}
        </b>

        ${
          p.description
            ? `
              <div class="ymk-store-desc">
                ${esc(p.description)}
              </div>
            `
            : ''
        }

        <div class="ymk-store-bottom">

          <div class="price ready-stock-price ymk-store-price">
            ฿${Number(p.price || 0).toLocaleString('th-TH')}
          </div>

          <button
            type="button"
            class="ready-stock-order-btn"
            data-product-id="${esc(p.id)}"
            data-ready-name="${esc(p.name || 'สินค้า')}"
            data-ready-price="${Number(p.price || 0)}"
            data-ready-category="${esc(p.category || '')}"
            data-send-enabled="${send ? '1' : '0'}"
            data-send-price="${send ? Number(p.sendPrice || 0) : 0}"
            ${bad ? 'disabled' : ''}
          >
            ${
              bad
                ? (
                    p.status === 'paused'
                      ? 'ปิดชั่วคราว'
                      : 'สินค้าหมด'
                  )
                : 'สั่งซื้อ'
            }
          </button>

        </div>

      </div>
    `;
  }

  function normalizeCategory(raw) {
    raw = clean(raw).toLowerCase();

    if (!raw || raw === 'all') {
      return 'echoes';
    }

    if (raw === 'accessories') {
      return 'accessory';
    }

    if (raw === 'skin') {
      return 'skins';
    }

    if (raw === 'pet') {
      return 'pets';
    }

    if (raw === 'rooms') {
      return 'room';
    }

    return raw;
  }

  function pane(name) {
    return (
      document.querySelector(
        `.realProductPane[data-product-pane="${name}"]`
      ) ||
      (
        name === 'accessory'
          ? document.querySelector(
              '.realProductPane[data-product-pane="accessories"]'
            )
          : null
      )
    );
  }

  function visibleProducts() {
    return items
      .filter(p =>
        p.visible !== false &&
        key(p) === active
      )
      .sort((a, b) =>
        Number(a.categoryOrder || 999) -
          Number(b.categoryOrder || 999) ||
        Number(a.order || 0) -
          Number(b.order || 0)
      );
  }

  function removeAllCategory() {
    document
      .querySelectorAll(
        '.catbar [data-maincat="all"]'
      )
      .forEach(el => el.remove());

    document
      .querySelectorAll(
        '.catbar [data-maincat]'
      )
      .forEach(el => {
        el.classList.toggle(
          'on',
          normalizeCategory(el.dataset.maincat) === active
        );
      });
  }

  function render() {
    removeAllCategory();

    const p =
      pane(active) ||
      pane('echoes') ||
      document.querySelector(
        '.realProductPane[data-product-pane]'
      );

    if (!p) return;

    document
      .querySelectorAll(
        '.realProductPane[data-product-pane]'
      )
      .forEach(el => {
        el.classList.toggle('on', el === p);
      });

    const rows = visibleProducts();

    p.innerHTML = rows.length
      ? `
        <div class="products">
          ${rows.map(card).join('')}
        </div>
      `
      : `
        <div class="categoryPlaceholder">
          <b>♡ ยังไม่มีสินค้า</b>
        </div>
      `;

    document.dispatchEvent(
      new CustomEvent(
        'ymk-storefront-products-rendered',
        {
          detail: {
            category: active,
            count: rows.length
          }
        }
      )
    );
  }

  function style() {
    if (
      document.getElementById(
        'ymkProductionV14'
      )
    ) {
      return;
    }

    const s =
      document.createElement('style');

    s.id = 'ymkProductionV14';

    s.textContent = `
      .ymk-production-card{
        animation:ymkProdIn .25s ease both;
      }

      .ymk-production-image{
        height:72px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        overflow:hidden!important;
      }

      .ymk-production-image img{
        display:block!important;
        width:66px!important;
        height:66px!important;
        max-width:66px!important;
        max-height:66px!important;
        object-fit:contain!important;
      }

      .ymk-store-desc{
        margin-top:4px;
        font-size:11px;
        opacity:.65;
      }

      .ymk-store-bottom{
        margin-top:10px;
      }

      .ymk-production-card button:disabled{
        opacity:.55!important;
        cursor:not-allowed!important;
      }

      @keyframes ymkProdIn{
        from{
          opacity:0;
          transform:translateY(6px);
        }
        to{
          opacity:1;
          transform:none;
        }
      }
    `;

    document.head.appendChild(s);
  }

  function bind() {
    document.addEventListener(
      'click',
      e => {
        const b =
          e.target.closest(
            '.catbar [data-maincat]'
          );

        if (!b) return;

        active =
          normalizeCategory(
            b.dataset.maincat
          );

        document
          .querySelectorAll(
            '.catbar [data-maincat]'
          )
          .forEach(el => {
            el.classList.toggle(
              'on',
              el === b
            );
          });

        setTimeout(render, 0);
      },
      true
    );
  }

  function cached() {
    try {
      const a = JSON.parse(
        localStorage.getItem(CACHE) || '[]'
      );

      if (
        Array.isArray(a) &&
        a.length
      ) {
        items = a;

        window.YMK_PRODUCTION_PRODUCTS =
          items;

        render();
      }
    } catch (e) {}
  }

  function connect() {
    if (
      !window.firebase ||
      !firebase.firestore
    ) {
      setTimeout(connect, 120);
      return;
    }

    firebase
      .firestore()
      .collection('products')
      .onSnapshot(
        snapshot => {
          items =
            snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

          window.YMK_PRODUCTION_PRODUCTS =
            items;

          try {
            localStorage.setItem(
              CACHE,
              JSON.stringify(items)
            );
          } catch (e) {}

          render();
        },

        error => {
          console.warn(
            'production products failed',
            error
          );
        }
      );
  }

  function boot() {
    style();

    /*
      ไม่มีหมวด "ทั้งหมด"
      เปิดมาที่ เติมกระดุม ทันที
    */
    active = 'echoes';

    removeAllCategory();
    bind();
    cached();
    connect();

    setTimeout(render, 100);
    setTimeout(render, 350);
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
