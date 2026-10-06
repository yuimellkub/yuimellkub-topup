(function(){
var h=document.querySelector('.head'),o=document.getElementById('orders'),p=document.getElementById('productAdmin');if(!h||!o||!p)return;
var nav=document.createElement('div');nav.className='actions';nav.style.margin='14px 0';
function b(t){var x=document.createElement('button');x.className='btn soft';x.textContent=t;nav.appendChild(x);return x}
var bo=b('ออเดอร์'),bp=b('จัดการสินค้า');h.after(nav);
bo.onclick=function(){o.style.display='grid';p.style.display='none'};
bp.onclick=function(){o.style.display='none';p.style.display='block'};
bo.click();
})();