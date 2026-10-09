(function () {
  'use strict';

  const orderIdPattern = /^YMK\d{6}-\d{6}$/;
  const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  function ensureStyles() {
    if (document.getElementById('ymk-order-confirmation-shared-css')) return;
    const style = document.createElement('style');
    style.id = 'ymk-order-confirmation-shared-css';
    style.textContent = `
      #ymOrderStatus.ymConfirmFinal2026{font:inherit!important;text-align:center!important;background:var(--ym-confirm-bg,#fff8fb)!important;color:var(--ym-confirm-text,#a65b7b)!important;border:1px solid var(--ym-confirm-border,#f3c9db)!important;border-radius:17px!important;padding:22px 15px!important}
      #ymOrderStatus.ymConfirmFinal2026 .ymUCheck{display:block!important;font-size:28px!important;line-height:1.2!important;color:var(--ym-confirm-head,#d572a0)!important;margin:0 0 9px!important}
      #ymOrderStatus.ymConfirmFinal2026 .ymUTitle{font:inherit!important;font-weight:800!important;font-size:17px!important;color:var(--ym-confirm-head,#b75b85)!important}
      #ymOrderStatus.ymConfirmFinal2026 .ymUSub{font:inherit!important;font-size:12px!important;font-weight:600!important;margin-top:7px!important}
      #ymOrderStatus.ymConfirmFinal2026 .ymUIdLabel{font-size:12px!important;margin-top:18px!important}
      #ymOrderStatus.ymConfirmFinal2026 .ymUId{font-size:17px!important;display:block!important;overflow-wrap:anywhere!important;margin:3px 0 9px!important}
      #ymOrderStatus.ymConfirmFinal2026 .ymUDetails{font:inherit!important;font-size:12px!important;line-height:1.8!important;margin:6px 0 18px!important}
      #ymOrderStatus.ymConfirmFinal2026 .ymUActions{display:flex!important;flex-direction:column!important;gap:12px!important;margin-top:18px!important}
      #ymOrderStatus.ymConfirmFinal2026 .ymUActions button{order:unset!important;width:100%!important;min-height:47px!important;margin:0!important;font:inherit!important;font-weight:800!important;border-radius:999px!important}
      #ymOrderStatus.ymConfirmFinal2026 .ymUActions .ymOrderBack{background:transparent!important;border:1px solid var(--ym-confirm-border,#f3c9db)!important;color:var(--ym-confirm-head,#b75b85)!important}
      #ymOrderStatus.ymConfirmFinal2026 .ymUActions .ymOrderNext{background:#df78a4!important;border:1px solid #df78a4!important;color:#fff!important}
     
#ymOrderStatus.ymConfirmFinal2026 .ymSendOrderNotice {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid #f1d9a7;
  border-radius: 16px;
  background: #fff9ef;
  color: #987769;
  text-align: left;
  font-size: 12px;
  line-height: 1.7;
}

#ymOrderStatus.ymConfirmFinal2026 .ymSendNoticeTitle {
  margin-bottom: 7px;
  color: #bf6b8d;
  font-weight: 800;
  font-size: 13px;
}

#ymOrderStatus.ymConfirmFinal2026 .ymSendOrderNotice div + div {
  margin-top: 6px;
}



#ymOrderStatus.ymConfirmFinal2026 .ymSendOrderNotice strong {
  color: #987769 !important;
  font-weight: 400 !important;
}



html.ymDark #ymOrderStatus.ymConfirmFinal2026 .ymSendOrderNotice {
  background: #3d3030;
  border-color: #775d49;
  color: #e1c4b6;
}

      html.ymDark{--ym-confirm-bg:#33232b;--ym-confirm-text:#dfbaca;--ym-confirm-border:#70485b;--ym-confirm-head:#f3b4d0}
    `;
    document.head.appendChild(style);
  }

  
function render(options) {
  const config = options || {};

  const isDemo = config.isDemo === true;
  const isPending = config.isPending === true;

  const orderId = String(config.orderId || '').trim();

    if (isDemo) {
      if (!localHosts.has(location.hostname)) {
        console.error('Order confirmation demo is restricted to localhost.');
        return false;
      }
    } else if (!orderIdPattern.test(orderId)) {
      console.error('Order confirmation requires a real order ID.');
      return false;
    }

    const status = document.getElementById(config.containerId || 'ymOrderStatus');
    if (!status) {
      console.error('Order confirmation status element is missing.');
      return false;
    }
if (isPending) {
  ensureStyles();

  status.className = 'ymOrderStatus show ok ymConfirmFinal2026';
  status.removeAttribute('data-ymk-confirmation-key');

  status.innerHTML = `
    <div class="ymUCheck">✓</div>
    <div class="ymUTitle">รับสลิปเรียบร้อยแล้ว ♡</div>
    <div class="ymUSub">ส่งข้อมูลให้ร้านตรวจสอบเรียบร้อยแล้ว</div>
    <div class="ymUDetails">
      เมื่อร้านอนุมัติ ระบบจะแสดงเลขออเดอร์ของคุณ
    </div>
  `;

  return true;
}
    const paymentMethod = config.paymentMethod === 'credit' ? 'credit' : 'slip';
    const rawAmount = typeof config.amount === 'number'
      ? config.amount
      : Number(String(config.amount || '').replace(/[^\d.-]/g, ''));
    const amount = rawAmount;
    const amountText = Number.isFinite(amount) && amount > 0
      ? amount.toLocaleString('th-TH') + ' บาท'
      : '-';
    const pack = String(config.pack || '').trim() || '-';
    const idLabel = isDemo ? 'ตัวอย่างเท่านั้น — ไม่มีเลขออเดอร์จริง' : orderId;
    if (!isDemo && (pack === '-' || amountText === '-')) {
      console.error('Order confirmation is missing the actual package or payment amount.');
      return false;
    }

    const renderKey = JSON.stringify([
      isDemo,
      orderId,
      paymentMethod,
      pack,
      amount,
      config.remainingCredit,
      config.isSend === true
    ]);
    if (
      status.dataset.ymkConfirmationKey === renderKey &&
      status.classList.contains('ymConfirmFinal2026')
    ) return true;

    ensureStyles();
    status.className = 'ymOrderStatus show ok ymConfirmFinal2026';
    status.dataset.ymkConfirmationKey = renderKey;
    if (paymentMethod === 'credit') status.classList.add('ymCreditPaidDone');
    status.innerHTML =
      '<div class="ymUCheck">✓</div>' +
      '<div class="ymUTitle">' +
        (paymentMethod === 'credit' ? 'ชำระด้วยเครดิตสำเร็จ ♡' : 'ยืนยันสลิปเรียบร้อยแล้ว ♡') +
      '</div>' +
      '<div class="ymUSub">' +
        (paymentMethod === 'credit' ? 'สร้างออเดอร์เรียบร้อยแล้ว' : 'สร้างออเดอร์เข้าสู่ระบบเรียบร้อยแล้ว') +
      '</div>' +
      '<div class="ymUIdLabel">เลขออเดอร์ของคุณ</div>' +
      '<b class="ymUId">' + escapeHtml(idLabel) + '</b>' +
      '<div class="ymUDetails">' +
        '<div>แพ็กที่เติม: ' + escapeHtml(pack) + '</div>' +
        (paymentMethod === 'credit'
          ? '<div>เครดิตที่หัก: ' + escapeHtml(amountText) + '</div>' +
            '<div>เครดิตคงเหลือ: ' +
              (Number.isFinite(Number(config.remainingCredit)) && Number(config.remainingCredit) >= 0
                ? escapeHtml(Number(config.remainingCredit).toLocaleString('th-TH') + ' บาท')
                : '-') +
            '</div>'
          : '<div>ยอดชำระ: ' + escapeHtml(amountText) + '</div>') +
      '</div>' +
      
(config.isSend && !isDemo
  ? '<div class="ymSendOrderNotice">' +
      '<div class="ymSendNoticeTitle">สำหรับออเดอร์แบบส่ง ♡</div>' +
      '<div>แบบส่งจำเป็นต้องแอดเพื่อนในเกมให้ครบ ' +
        '<strong>24 ชั่วโมง</strong> ก่อนนะคะ</div>' +
      '<div>รบกวนลูกค้าติดต่อทางเพจ พร้อมแจ้ง ' +
        '<strong>เลขออเดอร์</strong> และ ' +
        '<strong>สกิน / ประดับ / อื่น ๆ</strong> ที่ต้องการ ' +
        'เพื่อให้ทางร้านดำเนินการต่อค่ะ</div>' +
   
    '</div>'
  : '') +
      '<div class="ymUActions">' +

        '<button type="button" class="ymOrderBack" ' +
          (isDemo ? 'data-confirm-demo-copy' : 'data-v21-copy="' + escapeHtml(orderId) + '"') +
          '>คัดลอกเลขออเดอร์</button>' +
        '<button type="button" class="ymOrderNext" ' +
          (isDemo ? 'data-confirm-demo-new' : 'data-v21-new') +
          '>ทำรายการออเดอร์ใหม่</button>' +
      '</div>';

    if (isDemo) {
      status.querySelector('[data-confirm-demo-copy]')?.addEventListener('click', event => {
        event.currentTarget.textContent = 'ตัวอย่างไม่มีเลขจริง';
      });
      status.querySelector('[data-confirm-demo-new]')?.addEventListener('click', () => {
        status.className = 'ymOrderStatus';
        status.replaceChildren();
        window.dispatchEvent(new CustomEvent('ymk-confirm-demo-reset'));
      });
    }
    return true;
  }

  window.YMK_RENDER_ORDER_CONFIRMATION = render;
})();
