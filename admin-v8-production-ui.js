(function(){
function init(){
 if(document.getElementById('ymkProdTabs'))return;
 var wrap=document.querySelector('.wrap');if(!wrap)return;
 var head=document.querySelector('.head'), notice=document.querySelector('.notice'), orders=document.getElementById('orders'), products=document.getElementById('productAdmin');
 var tabs=document.createElement('div');tabs.id='ymkProdTabs';tabs.className='actions';tabs.style.margin='16px 0';tabs.innerHTML='<button class="btn primary" data-pt="orders">ระบบเดิม</button><button class="btn soft" data-pt="credit">อนุมัติเครดิต</button><button class="btn soft" data-pt="accounts">จัดการบัญชี</button>';
 if(notice)notice.parentNode.insertBefore(tabs,notice);
 var credit=document.createElement('section');credit.id='ymkProdCredit';credit.style.display='none';credit.innerHTML='<div class="notice"><b>♡ อนุมัติเติมเครดิต</b><br>รายการคำขอจากฐานข้อมูลจริงจะแสดงด้านล่าง</div><div id="ymkCreditSlot"></div>';
 var accounts=document.createElement('section');accounts.id='ymkProdAccounts';accounts.style.display='none';accounts.innerHTML='<div class="notice"><b>♡ จัดการบัญชีสมาชิก</b><br>บัญชีและยอดเครดิตจากฐานข้อมูลจริงจะแสดงด้านล่าง</div><div id="ymkAccountSlot"></div>';
 tabs.parentNode.insertBefore(credit,tabs.nextSibling);tabs.parentNode.insertBefore(accounts,credit.nextSibling);
 function show(n){var old=[notice,orders,products].filter(Boolean);old.forEach(function(x){x.style.display=n==='orders'?'':'none'});credit.style.display=n==='credit'?'':'none';accounts.style.display=n==='accounts'?'':'none';tabs.querySelectorAll('button').forEach(function(b){b.classList.toggle('primary',b.dataset.pt===n);b.classList.toggle('soft',b.dataset.pt!==n)});move();}
 function move(){var mc=document.getElementById('ymkMemberCreditProd');if(!mc)return;var req=mc.querySelector('#ymkCreditRequests'),mem=mc.querySelector('#ymkMembers');if(req&&req.parentElement&&req.parentElement!==document.getElementById('ymkCreditSlot'))document.getElementById('ymkCreditSlot').appendChild(req);if(mem&&mem.parentElement&&mem.parentElement!==document.getElementById('ymkAccountSlot'))document.getElementById('ymkAccountSlot').appendChild(mem);mc.style.display='none';}
 tabs.addEventListener('click',function(e){var b=e.target.closest('[data-pt]');if(b)show(b.dataset.pt)});
 new MutationObserver(move).observe(document.body,{childList:true,subtree:true});setTimeout(move,800);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();