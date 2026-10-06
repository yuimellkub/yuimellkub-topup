(function () {
  const CACHE = 'ymk_production_products_cache_v4';

  let items = [];
  let active = 'all';

  const clean = v => String(v || '').trim();

  const esc = v =>
    String(v == null ? '' : v).replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));

  const CATEGORY_ORDER = [
    'echoes',
    'skins',
    'accessory',
    'skinpack',
    'pets',
    'room'
  ];

  const CATEGORY_LABEL = {
    echoes: 'เติมกระดุม',
    skins: 'เติมสกิน',
    accessory: 'เติมประดับ',
    skinpack: 'แพ็กสกิน',
    pets: 'สัตว์เลี้ยง',
    room: 'ห้อง'
  };

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

    if (l === 'แพ็กสกิน' || c === 'skinpack') return 'skinpack';

    if (
      l === 'สัตว์เลี้ยง' ||
      c === 'pets' ||
      c === 'pet'
    ) return 'pets';

    if (
      l === 'ห้อง' ||
      c === 'room' ||
      c === 'rooms'
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
        data-send-enabled="${send ? '1' : '0'}"
        data-send-price="${send ? Number(p.sendPrice || 0) : 0}"
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

  function pane(name) {
    return document.querySelector(
      `.realProductPane[data-product-pane="${name}"]`
    );
  }

  function targetPane() {
    if (active === 'all') {
      return pane('echoes') ||
        document.querySelector('.realProductPane');
    }

    return pane(active) ||
      pane(
        active === 'accessory'
          ? 'accessories'
          : active
      ) ||
      pane('echoes') ||
      document.querySelector('.realProductPane');
  }

  function visibleProducts() {
    return items
      .filter(p => p.visible !== false)
      .sort((a, b) => {
        const ka = key(a);
        const kb = key(b);

        const ca = CATEGORY_ORDER.indexOf(ka);
        const cb = CATEGORY_ORDER.indexOf(kb);

        const oa = ca === -1 ? 999 : ca;
        const ob = cb === -1 ? 999 : cb;

        return (
          oa - ob ||
          Number(a.categoryOrder || 999) -
            Number(b.categoryOrder || 999) ||
          Number(a.order || 0) -
            Number(b.order || 0)
        );
      });
  }

  function allHTML(rows) {
    const known = [
      ...CATEGORY_ORDER,
      ...Array.from(
        new Set(rows.map(key))
      ).filter(k => !CATEGORY_ORDER.includes(k))
    ];

    return known.map(cat => {
      const products = rows.filter(p => key(p) === cat);

      if (!products.length) return '';

      const label =
        CATEGORY_LABEL[cat] ||
        clean(products[0]?.categoryLabel) ||
        cat;

      return `
        <section class="ymk-product-category-section">

          <div class="ymk-product-category-title">
            <b>${esc(label)}</b>
            <span>${products.length} รายการ</span>
          </div>

          <div class="products">
            ${products.map(card).join('')}
          </div>

        </section>
      `;
    }).join('');
  }

  function categoryHTML(rows) {
    if (!rows.length) {
      return `
        <div class="categoryPlaceholder">
          <b>♡ ยังไม่มีสินค้า</b>
        </div>
      `;
    }

    return `
      <div class="products">
        ${rows.map(card).join('')}
      </div>
    `;
  }

  function render() {
    const p = targetPane();

    if (!p) return;

    document
      .querySelectorAll('.realProductPane[data-product-pane]')
      .forEach(x => {
        x.classList.toggle('on', x === p);
      });

    const all = visibleProducts();

    const rows =
      active === 'all'
        ? all
        : all.filter(x => key(x) === active);

    p.innerHTML =
      active === 'all'
        ? allHTML(rows)
        : categoryHTML(rows);

    document.dispatchEvent(
      new CustomEvent('ymk-storefront-products-rendered', {
        detail: {
          count: rows.length,
          category: active
        }
      })
    );
  }

  function style() {
    if (document.getElementById('ymkProductionV13')) return;

    const s = document.createElement('style');

    s.id = 'ymkProductionV13';

    s.textContent = `
      .ymk-product-category-section{
        margin:0 0 24px;
      }

      .ymk-product-category-title{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        margin:0 0 10px;
      }

      .ymk-product-category-title b{
        font-size:16px;
      }

      .ymk-product-category-title span{
        font-size:11px;
        opacity:.65;
      }

      .ymk-production-card{
        animation:ymkProdIn .28s ease both;
      }

      .ymk-production-image{
        height:72px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        overflow:hidden!important;
      }

      .ymk-production-image img{
        width:66px!important;
        height:66px!important;
        max-width:66px!important;
        max-height:66px!important;
        object-fit:contain!important;
        display:block!important;
      }

      .ymk-store-desc{
        font-size:11px;
        opacity:.65;
        margin-top:4px;
        min-height:0;
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
          transform:translateY(7px);
        }
        to{
          opacity:1;
          transform:none;
        }
      }
    `;

    document.head.appendChild(s);
  }

  function normalizeActive(raw) {
    raw = clean(raw).toLowerCase();

    if (!raw || raw === 'all') return 'all';

    if (raw === 'accessories') return 'accessory';
    if (raw === 'skin') return 'skins';
    if (raw === 'pet') return 'pets';
    if (raw === 'rooms') return 'room';

    return raw;
  }

  function bind() {
    document.addEventListener('click', e => {
      const b = e.target.closest(
        '.catbar [data-maincat]'
      );

      if (!b) return;

      active = normalizeActive(
        b.dataset.maincat
      );

      document
        .querySelectorAll('.catbar [data-maincat]')
        .forEach(x => {
          x.classList.toggle('on', x === b);
        });

      setTimeout(render, 0);
    }, true);
  }

  function cached() {
    try {
      const a = JSON.parse(
        localStorage.getItem(CACHE) || '[]'
      );

      if (Array.isArray(a) && a.length) {
        items = a;
        window.YMK_PRODUCTION_PRODUCTS = items;
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
          items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          window.YMK_PRODUCTION_PRODUCTS = items;

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
    bind();
    cached();
    connect();

    setTimeout(render, 150);
    setTimeout(render, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      boot
    );
  } else {
    boot();
  }
})();
