(function(){
  'use strict';
  const fmt=n=>Number(String(n).replace(/,/g,'')).toLocaleString('th-TH')+' บาท';
  function fix(){
    document.querySelectorAll('textarea').forEach(el=>{const v=el.value||'',x=v.replace(/ยอดรวม:\s*([\d,]+)(?:\s*บาท)?/g,(_,n)=>'ยอดรวม: '+fmt(n));if(x!==v)el.value=x;});
    const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
    while((n=w.nextNode())){const t=n.nodeValue||'';if(!/ยอดรวม:\s*[\d,]+(?:\s*บาท)?/.test(t))continue;const x=t.replace(/ยอดรวม:\s*([\d,]+)(?:\s*บาท)?/g,(_,v)=>'ยอดรวม: '+fmt(v));if(x!==t)n.nodeValue=x;}
    [...document.querySelectorAll('div,p,span')].filter(el=>(el.textContent||'').trim()==='ยอดที่ต้องชำระ').forEach(label=>{const box=label.parentElement;if(!box)return;[...box.querySelectorAll('div,p,span,strong,b')].filter(el=>el!==label&&!el.children.length&&/^\s*[\d,]+\s*(?:บาท)?\s*$/.test(el.textContent||'')).forEach(el=>{const m=(el.textContent||'').match(/[\d,]+/);if(m)el.textContent=fmt(m[0]);});});
  }
  let q=false;function queue(){if(q)return;q=true;requestAnimationFrame(()=>{q=false;fix();});}
  queue();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true});
})();
