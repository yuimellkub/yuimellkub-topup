(function(){

  let products = [];
  let current = null;

  const clean = v =>
    String(v || '')
      .replace(/\s*[×xX]\s*\d+\s*$/,'')
      .trim();

  const number = v => {
    const n = Number(
      String(v ?? '').replace(/[^0-9.]/g,'')
    );
    return Number.isFinite(n) ? n : 0;
  };

  function productFor(btn){
    const id = btn.dataset.productId;

    if(id){
      const byId = products.find(p => p.id === id);
      if(byId) return byId;
    }

    const name = clean(btn.dataset.readyName || '');

    return products.find(
      p => clean(p.name) === name
    ) || null;
  }

  function maxFor(btn){
    const p = productFor(btn);

    if(
      !p ||
      p.unlimitedStock === true ||
      p.stock == null
    ){
      return 99;
    }

    return Math.max(
      1,
      Math.floor(Number(p.stock) || 0)
    );
  }

  function ensureModal(){

    let shade =
      document.getElementById('ymkReadyOrderShade');

    if(shade) return shade;

    shade = document.createElement('div');

    shade.id = 'ymkReadyOrderShade';

    shade.innerHTML = `
      <div class="ymk-ready-modal">

        <button
          type="button"
          class="ymk-ready-close"
          aria-label="ปิด"
        >×</button>

        <div class="ymk-ready-kicker">
          ♡ รายละเอียดการสั่งซื้อ
        </div>

        <h3 class="ymk-ready-name">
          สินค้า
        </h3>

        <div class="ymk-ready-mode">
          เติมทันที
        </div>

        <div class="ymk-ready-unit">
          ราคา 0 บาท
        </div>

        <div class="ymk-ready-qty-label">
          จำนวน
        </div>

        <div class="ymk-ready-qty">
          <button type="button" class="ymk-ready-minus">−</button>

          <input
            type="text"
            inputmode="numeric"
            value="1"
            class="ymk-ready-input"
          >

          <button type="button" class="ymk-ready-plus">+</button>
        </div>

        <div class="ymk-ready-total">
          รวม 0 บาท
        </div>

        <button
          type="button"
          class="ymk-ready-confirm"
        >
          ยืนยันสั่งซื้อ
        </button>

      </div>
    `;

    const style = document.createElement('style');

    style.textContent = `
      #ymkReadyOrderShade{
        position:fixed;
        inset:0;
        z-index:2147483000;
        display:none;
        align-items:center;
        justify-content:center;
        padding:18px;
        box-sizing:border-box;
        background:rgba(42,24,32,.38);
        backdrop-filter:blur(5px);
      }

      #ymkReadyOrderShade.on{
        display:flex;
      }

      .ymk-ready-modal{
        position:relative;
        width:min(390px,100%);
        box-sizing:border-box;
        padding:24px 20px 20px;
        border:1px solid rgba(226,124,165,.28);
        border-radius:26px;
        background:var(--card,#fff);
        color:var(--text,#513642);
        box-shadow:0 24px 70px rgba(70,35,50,.18);
        text-align:center;
      }

      .ymk-ready-close{
        position:absolute;
        right:13px;
        top:12px;
        width:34px;
        height:34px;
        border:0;
        border-radius:50%;
        background:rgba(226,124,165,.10);
        color:#c85f88;
        font-size:22px;
        cursor:pointer;
      }

      .ymk-ready-kicker{
        color:#d16d96;
        font-size:12px;
        font-weight:800;
        margin-bottom:8px;
      }

      .ymk-ready-name{
        margin:0;
        font-size:20px;
      }

      .ymk-ready-mode{
        display:inline-flex;
        margin-top:9px;
        padding:6px 12px;
        border-radius:999px;
        background:rgba(226,124,165,.11);
        color:#c85f88;
        font-size:12px;
        font-weight:850;
      }

      .ymk-ready-unit{
        margin-top:10px;
        font-size:13px;
        opacity:.75;
      }

      .ymk-ready-qty-label{
        margin:20px 0 9px;
        font-size:12px;
        font-weight:800;
      }

      .ymk-ready-qty{
        display:flex;
        justify-content:center;
        align-items:center;
        gap:12px;
      }

      .ymk-ready-minus,
      .ymk-ready-plus{
        width:40px;
        height:40px;
        border:0;
        border-radius:50%;
        background:#e27ca5;
        color:#fff;
        font-size:22px;
        font-weight:900;
        cursor:pointer;
      }

      .ymk-ready-input{
        width:64px;
        height:40px;
        box-sizing:border-box;
        border:1px solid #e7a6bf;
        border-radius:13px;
        background:var(--card,#fff);
        color:inherit;
        text-align:center;
        font:inherit;
        font-size:16px;
      }

      .ymk-ready-total{
        margin:14px 0;
        color:#c85f88;
        font-size:14px;
        font-weight:850;
      }

      .ymk-ready-confirm{
        width:100%;
        height:46px;
        border:0;
        border-radius:999px;
        background:#e27ca5;
        color:#fff;
        font:inherit;
        font-weight:850;
        cursor:pointer;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(shade);

    const input =
      shade.querySelector('.ymk-ready-input');

    shade
      .querySelector('.ymk-ready-close')
      .onclick = close;

    shade.onclick = e => {
      if(e.target === shade) close();
    };

    shade
      .querySelector('.ymk-ready-minus')
      .onclick = () => {
        if(!current) return;

        input.value = Math.max(
          1,
          (Number(input.value) || 1) - 1
        );

        update();
      };

    shade
      .querySelector('.ymk-ready-plus')
      .onclick = () => {
        if(!current) return;

        input.value = Math.min(
          maxFor(current.btn),
          (Number(input.value) || 1) + 1
        );

        update();
      };

    input.oninput = update;

    shade
      .querySelector('.ymk-ready-confirm')
      .onclick = confirm;

    return shade;
  }

  function update(){

    if(!current) return;

    const shade = ensureModal();

    const input =
      shade.querySelector('.ymk-ready-input');

    const q = Math.max(
      1,
      Math.min(
        maxFor(current.btn),
        Math.floor(Number(input.value) || 1)
      )
    );

    input.value = q;

    shade.querySelector(
      '.ymk-ready-total'
    ).textContent =
      'รวม ' +
      (current.unit * q).toLocaleString('th-TH') +
      ' บาท';
  }

  function open(card, mode){

    const btn =
      card?.querySelector('.ready-stock-order-btn');

    if(!btn || btn.disabled) return;

    const isSend = mode === 'send';

    const unit = isSend
      ? number(btn.dataset.sendPrice)
      : number(btn.dataset.readyPrice);

    if(isSend && unit <= 0) return;

    current = {
      card,
      btn,
      mode: isSend ? 'send' : 'instant',
      unit,
      base: clean(
        btn.dataset.ymkBaseName ||
        btn.dataset.readyName ||
        'สินค้า'
      )
    };

    const shade = ensureModal();

    shade.querySelector(
      '.ymk-ready-name'
    ).textContent = current.base;

    shade.querySelector(
      '.ymk-ready-mode'
    ).textContent =
      isSend
        ? 'แบบส่ง'
        : 'เติมทันที';

    shade.querySelector(
      '.ymk-ready-unit'
    ).textContent =
      'ราคา ' +
      unit.toLocaleString('th-TH') +
      ' บาท';

    shade.querySelector(
      '.ymk-ready-input'
    ).value = '1';

    shade.querySelector(
      '.ymk-ready-confirm'
    ).textContent =
      isSend
        ? 'ยืนยันแบบส่ง'
        : 'ยืนยันสั่งซื้อ';

    shade.classList.add('on');

    update();
  }

  function close(){
    const shade =
      document.getElementById('ymkReadyOrderShade');

    if(shade){
      shade.classList.remove('on');
    }

    current = null;
  }

  function confirm(){

    if(!current) return;

    const shade = ensureModal();

    const input =
      shade.querySelector('.ymk-ready-input');

    const q = Math.max(
      1,
      Math.min(
        maxFor(current.btn),
        Math.floor(Number(input.value) || 1)
      )
    );

    const total =
      current.unit * q;

    const btn = current.btn;
    const base = current.base;
    const mode = current.mode;

    const oldName =
      btn.dataset.readyName;

    const oldPrice =
      btn.dataset.readyPrice;

    btn.dataset.readyName =
      q > 1
        ? base + ' × ' + q
        : base;

    btn.dataset.readyPrice =
      String(total);

    btn.dataset.ymkConfirming = '1';
    btn.dataset.ymkInstantConfirming = '1';

    if(mode === 'send'){

      window.YMK_SEND_SELECTION = {
        mode:'send',
        name:base,
        category:btn.dataset.readyCategory || '',
        price:current.unit,
        quantity:q,
        total
      };

      window.YMK_SEND_ORDER_META = {
        mode:'send',
        q,
        base,
        unit:current.unit,
        total
      };

      window.YMK_PENDING_ORDER_META = {
        q,
        base,
        p:{
          send:true,
          unit:current.unit,
          total
        },
        orderMode:'send'
      };

      window.YMK_FORCED_PACK_META = null;

    }else{

      window.YMK_SEND_SELECTION = null;
      window.YMK_SEND_ORDER_META = null;

      window.YMK_PENDING_ORDER_META = {
        q,
        base,
        p:{
          unit:current.unit,
          total
        },
        orderMode:'instant'
      };
    }

    close();

    btn.click();

    setTimeout(() => {
      btn.dataset.readyName =
        oldName || base;

      btn.dataset.readyPrice =
        oldPrice || String(current?.unit || '');

      delete btn.dataset.ymkConfirming;
      delete btn.dataset.ymkInstantConfirming;
    }, 500);
  }

  window.YMK_OPEN_READY_ORDER =
    function(card, mode){
      open(card, mode || 'instant');
    };

  document.addEventListener('click', e => {

    const btn =
      e.target.closest('.ready-stock-order-btn');

    if(
      !btn ||
      btn.disabled ||
      btn.dataset.ymkConfirming === '1'
    ){
      return;
    }

    const card =
      btn.closest('.ready-stock-card');

    if(!card) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    open(card, 'instant');

  }, true);

  function load(){

    try{

      if(
        !window.firebase ||
        !firebase.firestore
      ){
        return setTimeout(load,250);
      }

      firebase
        .firestore()
        .collection('products')
        .onSnapshot(s => {

          products = s.docs.map(d => ({
            id:d.id,
            ...d.data()
          }));

        });

    }catch(e){
      setTimeout(load,500);
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener(
      'DOMContentLoaded',
      load
    );
  }else{
    load();
  }

})();
