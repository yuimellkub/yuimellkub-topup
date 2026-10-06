(function(){
var h=document.querySelector('.head'),o=document.getElementById('orders'),p=document.getElementById('productAdmin');if(!h||!o||!p)return;
var nav=document.createElement('div');nav.id='ymkV8Nav';nav.className='actions';nav.style.margin='14px 0';
function add(t,k){var x=document.createElement('button');x.className='btn soft';x.textContent=t;x.dataset.view=k;nav.appendChild(x);return x}
add('ออเดอร์','orders');add('จัดการสินค้า','products');add('อนุมัติเครดิต','credit');add('จัดการบัญชี','accounts');h.after(nav);
function show(k){var host=document.getElementById('ymkMemberCreditProd'),panels=host?host.querySelectorAll('.ymkMcPanel'):[];o.style.display=k==='orders'?'grid':'none';p.style.display=k==='products'?'block':'none';if(host)host.style.display=(k==='credit'||k==='accounts')?'block':'none';panels.forEach(function(x,i){x.style.display=(k==='credit'&&i===0)||(k==='accounts'&&i===1)?'block':'none'});nav.querySelectorAll('button').forEach(function(x){x.classList.toggle('primary',x.dataset.view===k);x.classList.toggle('soft',x.dataset.view!==k)})}
nav.onclick=function(e){var x=e.target.closest('button[data-view]');if(x)show(x.dataset.view)};
new MutationObserver(function(){var host=document.getElementById('ymkMemberCreditProd');if(host&&!host.dataset.tabbed){host.dataset.tabbed='1';host.style.display='none'}}).observe(document.body,{childList:true,subtree:true});
show('orders');
})();