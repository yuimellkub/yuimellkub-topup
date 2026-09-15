(function(){
  'use strict';
  const money=n=>Number(String(n).replace(/,/g,'')).toLocaleString('th-TH')+' บาท';
  function fixOrderTotal(){
    document.querySelectorAll('textarea').forEach(el=>{
      const v=el.value||'';
      const next=v.replace(/ยอดรวม:\s*([\d,]+)(?:\s*บาท)?/g,(_,n)=>'ยอดรวม: '+money(n));
      if(next!==v)el.value=next;
    });
    const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
    while((n=w.nextNode())){
      const t=n.nodeValue||'';
      if(!/ยอดรวม:\s*[\d,]+(?:\s*บาท)?/.test(t))continue;
      const next=t.replace(/ยอดรวม:\s*([\d,]+)(?:\s*บาท)?/g,(_,x)=>'ยอดรวม: '+money(x));
      if(next!==t)n.nodeValue=next;
    }
  }
  function fixPaymentAmount(){
    const labels=[...document.querySelectorAll('div,p,span')].filter(el=>(el.textContent||'').trim()==='ยอดที่ต้องชำระ');
    labels.forEach(label=>{
      const box=label.parentElement;if(!box)return;
      const candidates=[...box.querySelectorAll('div,p,span,strong,b')].filter(el=>el!==label&&!el.children.length&&/^\s*[\d,]+\s*(?:บาท)?\s*$/.test(el.textContent||''));
      candidates.forEach(el=>{const m=(el.textContent||'').match(/[\d,]+/);if(m)el.textContent=money(m[0]);});
    });
  }
  let queued=false;
  function fix(){queued=false;fixOrderTotal();fixPaymentAmount();}
  function queue(){if(queued)return;queued=true;requestAnimationFrame(fix);}
  queue();
  new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true});
})();
