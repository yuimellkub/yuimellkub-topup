(function(){
  // Yuimellkub calculator rules for normal Echoes + gacha calculators only.
  // 0-607 / remainders use small packs first. Above that, 759 is the main pack.
  // Small-pack limits: 335 <= 1, 203 <= 2, 66 <= 2.
  // Display order: 759 -> 335 -> 203 -> 66.
  // Final price rounding: last digit 1-4 -> 5, 6-9 -> next 10; 0/5 stay unchanged.

  function price759Tier(qty){
    qty=Math.max(0,Math.floor(Number(qty)||0));
    if(qty>=30) return 283;
    if(qty>=20) return 285;
    if(qty>=10) return 287;
    return qty>0 ? 290 : 0;
  }

  function roundSellingPrice(price){
    price=Math.max(0,Math.floor(Number(price)||0));
    const last=price%10;
    if(last===0||last===5)return price;
    if(last>=1&&last<=4)return price+(5-last);
    return price+(10-last);
  }

  function bestSmallPackFill(need){
    need=Math.max(0,Math.floor(Number(need)||0));
    if(need<=0) return {a:0,b:0,c:0,echoes:0,cost:0,count:0};
    let best=null;
    for(let c=0;c<=1;c++){
      for(let b=0;b<=2;b++){
        for(let a=0;a<=2;a++){
          const echoes=a*66+b*203+c*335;
          if(echoes<need)continue;
          const cost=a*30+b*90+c*145;
          const count=a+b+c;
          const candidate={a,b,c,echoes,cost,count,extra:echoes-need};
          if(!best||candidate.extra<best.extra||(candidate.extra===best.extra&&candidate.cost<best.cost)||(candidate.extra===best.extra&&candidate.cost===best.cost&&candidate.count<best.count))best=candidate;
        }
      }
    }
    return best||{a:0,b:0,c:0,echoes:0,cost:0,count:0};
  }

  function ymkFindBest(target){
    target=Math.max(0,Math.floor(Number(target)||0));
    if(target<=0)return {counts:[0,0,0,0],totalEchoes:0,totalTopup:0,cost:0,rawCost:0,extra:0,count:0};
    let a=0,b=0,c=0,d=0;
    if(target<=607){
      const small=bestSmallPackFill(target);a=small.a;b=small.b;c=small.c;
    }else{
      d=Math.floor(target/759);
      const remainder=target-d*759;
      if(remainder>607)d+=1;
      else if(remainder>0){const small=bestSmallPackFill(remainder);a=small.a;b=small.b;c=small.c;}
    }
    const totalEchoes=a*66+b*203+c*335+d*759;
    const totalTopup=a*60+b*185+c*305+d*690;
    const rawCost=a*30+b*90+c*145+d*price759Tier(d);
    const cost=roundSellingPrice(rawCost);
    return {counts:[a,b,c,d],totalEchoes,totalTopup,cost,rawCost,extra:totalEchoes-target,count:a+b+c+d};
  }

  function formatLargestFirst(best){
    const order=[3,2,1,0],echoes=[66,203,335,759];
    return order.map(i=>best.counts[i]>0?`${echoes[i].toLocaleString()} × ${best.counts[i]}`:'').filter(Boolean).join(' + ');
  }

  window.price759=price759Tier;
  window.findBest=ymkFindBest;
  window.YMK_CALCULATOR_PACK_RULES={price759:price759Tier,findBest:ymkFindBest,bestSmallPackFill,formatLargestFirst,roundSellingPrice};

  window.showNormalDone=function(){
    currentOrderId=null;
    const target=Math.max(0,Math.floor(Number(document.getElementById('target').value)||0));if(!target)return;
    const best=findBest(target),detail=formatLargestFirst(best);
    lastOrder={item:target.toLocaleString()+' กระดุม',pack:detail,price:best.cost.toLocaleString()+' บาท'};
    openDonePopup([['ต้องการ',target.toLocaleString()+' กระดุม'],['ได้ทั้งหมด',best.totalEchoes.toLocaleString()+' กระดุม'],['แพ็ก',detail],['ยอดรวม',best.cost.toLocaleString()+' บาท','done-price']]);
  };

  window.showGachaDone=function(){
    currentOrderId=null;
    const rolls=Math.max(0,Math.floor(Number(document.getElementById('gachaRolls').value)||0));
    const special=Math.min(3,Math.max(0,Number(document.getElementById('specialCrystalPacks').value)||0));if(!rolls&&!special)return;
    const totalBalls=rolls+special*10,need=rolls*96+special*576,best=findBest(need),detail=formatLargestFirst(best);
    lastOrder={item:totalBalls.toLocaleString()+' ลูก (ปกติ '+rolls.toLocaleString()+' + พิเศษ '+special.toLocaleString()+' แพ็ก)',pack:detail,price:best.cost.toLocaleString()+' บาท'};
    openDonePopup([['ลูกทั้งหมด',totalBalls.toLocaleString()+' ลูก'],['แพ็กพิเศษ',special.toLocaleString()+' แพ็ก'],['ใช้กระดุม',need.toLocaleString()+' กระดุม'],['แพ็ก',detail],['ยอดรวม',best.cost.toLocaleString()+' บาท','done-price']],'คำนวณกาชาเรียบร้อยแล้ว');
  };
})();
