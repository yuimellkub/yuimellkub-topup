(function(){
  'use strict';

  function statusText(){
    const el=document.getElementById('adminSaveStatus');
    return el ? String(el.textContent||'').trim() : '';
  }

  function realOrderId(){
    const st=statusText();
    const m=st.match(/YMK\d{6}-\d{6}/);
    if(m)return m[0];
    try{
      const id=String(window.currentOrderId||'').trim();
      if(/^YMK\d{6}-\d{6}$/.test(id))return id;
    }catch(e){}
    return '';
  }

  function isPending(){
    return /กำลังรอร้านตรวจสอบสลิป|ยังไม่มีการสร้างออเดอร์|ส่งสลิปแล้ว.*รอร้านตรวจสอบ|กำลังส่งสลิปให้ร้านตรวจสอบ/.test(statusText());
  }

  function isApproved(){
    const st=statusText();
    const id=realOrderId();
    return /^YMK\d{6}-\d{6}$/.test(id) && /ส่งออเดอร์เข้าระบบแล้ว|ร้านยืนยันสลิปแล้ว|เลขออเดอร์/.test(st);
  }

  function candidateScore(el){
    const t=String(el.innerText||'');
    let score=0;
    if(/ส่งออเดอร์เรียบร้อยแล้ว|ส่งสลิปเรียบร้อยแล้ว/.test(t))score+=4;
    if(/เลขออเดอร์ของคุณ|กำลังรอร้านตรวจสอบสลิป/.test(t))score+=3;
    if(/รบกวนส่งสลิปในแชท\s*Messenger/.test(t))score+=6;
    const labels=[...el.querySelectorAll('button,a')].map(x=>String(x.textContent||'').trim());
    if(labels.some(x=>/^Messenger$/i.test(x)))score+=4;
    if(labels.some(x=>/^LINE$/i.test(x)))score+=4;
    return score;
  }

  function findLegacyPanel(){
    const current=document.getElementById('ymkFinalOrderStatusCard');
    if(current)return current;
    const nodes=[...document.querySelectorAll('div,section,article')]
      .filter(el=>candidateScore(el)>=7)
      .sort((a,b)=>{
        const sa=candidateScore(a),sb=candidateScore(b);
        if(sa!==sb)return sb-sa;
        return String(a.innerText||'').length-String(b.innerText||'').length;
      });
    return nodes[0]||document.getElementById('ymkForceCard')||null;
  }

  function stylePanel(panel){
    panel.id='ymkFinalOrderStatusCard';
    panel.style.setProperty('display','block','important');
    panel.style.setProperty('height','auto','important');
    panel.style.setProperty('min-height','0','important');
    panel.style.setProperty('max-height','none','important');
    panel.style.setProperty('overflow','visible','important');
    panel.style.setProperty('box-sizing','border-box','important');
    panel.style.setProperty('padding','22px 16px','important');
    panel.style.setProperty('text-align','center','important');
  }

  function pendingHtml(){
    return '<div data-ymk-final-status="pending">'
      +'<div style="font-size:20px;font-weight:900;line-height:1.45;color:#8f4f68">✓ ส่งสลิปเรียบร้อยแล้ว ♡</div>'
      +'<div style="margin-top:4px;font-size:15px;font-weight:800;line-height:1.5;color:#9a526d">กำลังรอร้านตรวจสอบสลิป</div>'
      +'<div style="margin-top:12px;font-size:13px;font-weight:700;line-height:1.7;color:#9a687c">ร้านได้รับสลิปในระบบแล้ว ไม่ต้องส่งซ้ำนะคะ ♡<br>หลังตรวจสอบเรียบร้อย ระบบจะแสดงเลขออเดอร์สำหรับติดตามสถานะให้ค่ะ</div>'
      +'</div>';
  }

  function approvedHtml(id){
    return '<div data-ymk-final-status="approved" data-order-id="'+id+'">'
      +'<div style="font-size:20px;font-weight:900;line-height:1.45;color:#8f4f68">✓ ยืนยันสลิปเรียบร้อยแล้ว ♡</div>'
      +'<div style="margin-top:4px;font-size:14px;font-weight:800;line-height:1.5;color:#9a526d">สร้างออเดอร์เข้าสู่ระบบเรียบร้อยแล้ว</div>'
      +'<div style="margin-top:13px;font-size:15px;font-weight:900;color:#8f4f68">เลขออเดอร์ของคุณ</div>'
      +'<div style="margin-top:5px;font-size:16px;font-weight:900;color:#8f4f68">'+id+'</div>'
      +'<div style="margin-top:10px;font-size:13px;font-weight:700;line-height:1.7;color:#9a687c">กรุณาเก็บเลขออเดอร์ไว้สำหรับติดตามสถานะ<br>และรอร้านดำเนินการเติมสักครู่นะคะ ♡</div>'
      +'<button type="button" data-ymk-copy-order="'+id+'" style="display:block;width:100%;margin-top:14px;border:1px solid #efbfd1;background:#fff3f8;padding:12px 16px;border-radius:12px;color:#9a526d;font:inherit;font-size:14px;font-weight:900;cursor:pointer">คัดลอกเลขออเดอร์</button>'
      +'</div>';
  }

  function render(){
    const approved=isApproved();
    const pending=!approved&&isPending();
    if(!approved&&!pending)return;

    const panel=findLegacyPanel();
    if(!panel)return;

    const mode=approved?'approved':'pending';
    const id=approved?realOrderId():'';
    const current=panel.querySelector('[data-ymk-final-status]');
    if(current && current.dataset.ymkFinalStatus===mode && (!approved || current.dataset.orderId===id))return;

    stylePanel(panel);
    panel.innerHTML=approved?approvedHtml(id):pendingHtml();
  }

  document.addEventListener('click',function(e){
    const btn=e.target.closest('[data-ymk-copy-order]');
    if(!btn)return;
    const id=String(btn.getAttribute('data-ymk-copy-order')||'');
    if(!/^YMK\d{6}-\d{6}$/.test(id))return;
    const done=function(){const old=btn.textContent;btn.textContent='คัดลอกแล้ว ✓';setTimeout(()=>btn.textContent=old,900);};
    try{
      navigator.clipboard.writeText(id).then(done).catch(function(){
        const ta=document.createElement('textarea');ta.value=id;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();done();
      });
    }catch(err){}
  });

  new MutationObserver(render).observe(document.body,{childList:true,subtree:true,characterData:true});
  setInterval(render,200);
  render();
})();
