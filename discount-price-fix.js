(function(){
  const packs=[
    {echoes:66,price:30},{echoes:203,price:90},{echoes:335,price:145},
    {echoes:759,price:290},{echoes:2227,price:870},
    {echoes:3663,price:1450},{echoes:7249,price:2890}
  ];

  function rows(){return [...document.querySelectorAll('.discount-pack-row')];}
  function calculate(){
    let echoes=0,base=0,final=0;
    const detail=[];
    rows().forEach((row,i)=>{
      const pack=packs[i];if(!pack)return;
      const qty=Math.max(0,Math.floor(Number(row.querySelector('.qty-input')?.value)||0));
      const discount=Number(row.querySelector('.discount-select')?.value)||0;
      const rowBase=pack.price*qty;
      const rowFinal=Math.floor(rowBase*(1-discount/100));
      echoes+=pack.echoes*qty;base+=rowBase;final+=rowFinal;
      const price=row.querySelector('.pack-price');if(price)price.textContent=pack.price.toLocaleString('th-TH')+' บาท/แพ็ก';
      const total=row.querySelector('.row-total');if(total)total.textContent=rowFinal.toLocaleString('th-TH')+' บาท';
      if(qty)detail.push(pack.echoes.toLocaleString('th-TH')+' × '+qty+' (ลด '+discount+'%)');
    });
    const e=document.getElementById('mixEchoes'),b=document.getElementById('mixBasePrice'),f=document.getElementById('mixFinalPrice');
    if(e)e.textContent=echoes.toLocaleString('th-TH')+' กระดุม';
    if(b)b.textContent=base.toLocaleString('th-TH')+' บาท';
    if(f)f.textContent=final.toLocaleString('th-TH')+' บาท';
    return {echoes,base,final,detail};
  }

  function refresh(){if(rows().length)calculate();}
  document.addEventListener('input',e=>{
    if(!e.target.closest('.discount-pack-row'))return;
    e.stopImmediatePropagation();calculate();
  },true);
  document.addEventListener('click',e=>{
    if(!e.target.closest('#discountCalcBtn'))return;
    e.preventDefault();e.stopImmediatePropagation();
    const x=calculate();if(!x.echoes)return;
    currentOrderId=null;
    lastOrder={item:x.echoes.toLocaleString('th-TH')+' กระดุม',pack:x.detail.join(' + '),price:x.final.toLocaleString('th-TH')+' บาท'};
    openDonePopup([
      ['กระดุมรวม',x.echoes.toLocaleString('th-TH')+' กระดุม'],
      ['ราคาปกติ',x.base.toLocaleString('th-TH')+' บาท'],
      ['ส่วนลด',x.detail.join(' + ')],
      ['ยอดรวม',x.final.toLocaleString('th-TH')+' บาท','done-price']
    ],'คำนวณส่วนลดเรียบร้อยแล้ว');
  },true);
  [0,100,300,700,1200].forEach(ms=>setTimeout(refresh,ms));
})();
