(function(){

let current='orders';

const head=
  document.querySelector(
    '.head'
  );

const orders=
  document.getElementById(
    'orders'
  );

const products=
  document.getElementById(
    'productAdmin'
  );

if(
  !head ||
  !orders ||
  !products
){
  return;
}

const wrap=
  document.querySelector(
    '.wrap'
  );

const nav=
  document.createElement(
    'div'
  );

nav.id='ymkV8Nav';
nav.className='actions';
nav.style.margin='14px 0';

function add(text,key){

  const b=
    document.createElement(
      'button'
    );

  b.className='btn soft';
  b.textContent=text;
  b.dataset.view=key;

  nav.appendChild(b);

  return b;
}

add('ออเดอร์','orders');
add('จัดการสินค้า','products');
add('อนุมัติเครดิต','credit');
add('จัดการบัญชี','accounts');

head.after(nav);

function show(key){

  current=key;

  const host=
    document.getElementById(
      'ymkMemberCreditProd'
    );

  /*
    ซ่อน section หลักของ Admin
    เมื่ออยู่หน้าเครดิต / บัญชี
  */
  [...wrap.children]
    .forEach(el=>{

      if(
        el === head ||
        el === nav ||
        el.classList.contains(
          'footer'
        )
      ){
        return;
      }

      if(el === orders){

        el.style.display=
          key === 'orders'
            ? 'grid'
            : 'none';

        return;
      }

      if(el === products){

        el.style.display=
          key === 'products'
            ? 'block'
            : 'none';

        return;
      }

      if(el === host){

        el.style.display=
          (
            key === 'credit' ||
            key === 'accounts'
          )
            ? 'block'
            : 'none';

        return;
      }

      /*
        summary / slip review / dashboard อื่น ๆ
        ให้แสดงเฉพาะหน้า Orders
      */
      el.style.display=
        key === 'orders'
          ? ''
          : 'none';
    });

  if(host){

    const panels=
      host.querySelectorAll(
        '.ymkMcPanel'
      );

    panels.forEach(
      (panel,i)=>{

        panel.style.display=
          (
            key === 'credit' &&
            i === 0
          )
          ||
          (
            key === 'accounts' &&
            i === 1
          )
            ? 'block'
            : 'none';
      }
    );
  }

  nav
    .querySelectorAll(
      'button'
    )
    .forEach(
      b=>{

        b.classList.toggle(
          'primary',
          b.dataset.view === key
        );

        b.classList.toggle(
          'soft',
          b.dataset.view !== key
        );
      }
    );
}

nav.onclick=
  e=>{

    const b=
      e.target.closest(
        'button[data-view]'
      );

    if(b){
      show(
        b.dataset.view
      );
    }
  };


document.addEventListener(
  'ymk-member-credit-ready',
  ()=>{
    show(current);
  }
);


/*
  ถ้า panel เครดิตถูกสร้างทีหลัง
  ให้คง tab เดิมไว้
*/
let queued=false;

new MutationObserver(
  ()=>{

    if(queued){
      return;
    }

    queued=true;

    requestAnimationFrame(
      ()=>{

        queued=false;
        show(current);
      }
    );
  }
).observe(
  wrap,
  {
    childList:true
  }
);


show('orders');

})();
