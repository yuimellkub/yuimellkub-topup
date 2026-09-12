(function(){
  // Yuimellkub calculator rules for normal Echoes + gacha calculators only.
  // Rule 1: amounts/remainders 0-607 use small packs first.
  // Rule 2: above that, 759 is the main pack; if the remainder is over 607, add one more 759.
  // Rule 3: 759 uses bulk tier pricing.
  // Small-pack limits: 335 <= 1, 203 <= 1, 66 <= 2.

  function price759Tier(qty){
    qty=Math.max(0,Math.floor(Number(qty)||0));
    if(qty>=30) return 283;
    if(qty>=20) return 285;
    if(qty>=10) return 287;
    return qty>0 ? 290 : 0;
  }

  function bestSmallPackFill(need){
    need=Math.max(0,Math.floor(Number(need)||0));
    if(need<=0) return {a:0,b:0,c:0,echoes:0,cost:0,count:0};

    let best=null;
    for(let c=0;c<=1;c++){
      for(let b=0;b<=1;b++){
        for(let a=0;a<=2;a++){
          const echoes=a*66+b*203+c*335;
          if(echoes<need) continue;
          const cost=a*30+b*90+c*145;
          const count=a+b+c;
          const candidate={a,b,c,echoes,cost,count,extra:echoes-need};
          if(!best ||
             candidate.extra<best.extra ||
             (candidate.extra===best.extra && candidate.cost<best.cost) ||
             (candidate.extra===best.extra && candidate.cost===best.cost && candidate.count<best.count)){
            best=candidate;
          }
        }
      }
    }
    return best || {a:0,b:0,c:0,echoes:0,cost:0,count:0};
  }

  function ymkFindBest(target){
    target=Math.max(0,Math.floor(Number(target)||0));
    if(target<=0){
      return {counts:[0,0,0,0],totalEchoes:0,totalTopup:0,cost:0,extra:0,count:0};
    }

    let a=0,b=0,c=0,d=0;

    if(target<=607){
      const small=bestSmallPackFill(target);
      a=small.a; b=small.b; c=small.c;
    }else{
      d=Math.floor(target/759);
      const remainder=target-d*759;

      if(remainder>607){
        d+=1;
      }else if(remainder>0){
        const small=bestSmallPackFill(remainder);
        a=small.a; b=small.b; c=small.c;
      }
    }

    const totalEchoes=a*66+b*203+c*335+d*759;
    const totalTopup=a*60+b*185+c*305+d*690;
    const unit759=price759Tier(d);
    const cost=a*30+b*90+c*145+d*unit759;
    const count=a+b+c+d;

    // Return counts in the same order as packs[] (66,203,335,759).
    // Rendering is overridden below so the visible pack list is largest -> smallest.
    return {
      counts:[a,b,c,d],
      totalEchoes,
      totalTopup,
      cost,
      extra:totalEchoes-target,
      count
    };
  }

  function formatLargestFirst(best){
    const order=[3,2,1,0];
    const echoes=[66,203,335,759];
    return order.map(i=>best.counts[i]>0 ? `${echoes[i].toLocaleString()} × ${best.counts[i]}` : '').filter(Boolean).join(' + ');
  }

  // Override only calculator pricing/pack selection functions.
  window.price759=price759Tier;
  window.findBest=ymkFindBest;
  window.YMK_CALCULATOR_PACK_RULES={price759:price759Tier,findBest:ymkFindBest,bestSmallPackFill,formatLargestFirst};

  // Replace calculator result renderers only to display packs largest -> smallest.
  window.showNormalDone=function(){
    currentOrderId=null;
    const target=Math.max(0,Math.floor(Number(document.getElementById('target').value)||0));
    if(!target)return;
    const best=findBest(target);
    const detail=formatLargestFirst(best);
    lastOrder={item:target.toLocaleString()+' กระดุม',pack:detail,price:best.cost.toLocaleString()+' บาท'};
    openDonePopup([
      ['ต้องการ',target.toLocaleString()+' กระดุม'],
      ['ได้ทั้งหมด',best.totalEchoes.toLocaleString()+' กระดุม'],
      ['แพ็ก',detail],
      ['ยอดรวม',best.cost.toLocaleString()+' บาท','done-price']
    ]);
  };

  window.showGachaDone=function(){
    currentOrderId=null;
    const rolls=Math.max(0,Math.floor(Number(document.getElementById('gachaRolls').value)||0));
    const special=Math.min(3,Math.max(0,Number(document.getElementById('specialCrystalPacks').value)||0));
    if(!rolls&&!special)return;
    const totalBalls=rolls+special*10;
    const need=rolls*96+special*576;
    const best=findBest(need);
    const detail=formatLargestFirst(best);
    lastOrder={item:totalBalls.toLocaleString()+' ลูก (ปกติ '+rolls.toLocaleString()+' + พิเศษ '+special.toLocaleString()+' แพ็ก)',pack:detail,price:best.cost.toLocaleString()+' บาท'};
    openDonePopup([
      ['ลูกทั้งหมด',totalBalls.toLocaleString()+' ลูก'],
      ['แพ็กพิเศษ',special.toLocaleString()+' แพ็ก'],
      ['ใช้กระดุม',need.toLocaleString()+' กระดุม'],
      ['แพ็ก',detail],
      ['ยอดรวม',best.cost.toLocaleString()+' บาท','done-price']
    ],'คำนวณกาชาเรียบร้อยแล้ว');
  };
})();
