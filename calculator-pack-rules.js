(function(){
  // Yuimellkub calculator rules for normal Echoes + gacha calculators only.
  // Main pack: 759. If the remaining amount is 0-500, fill with small packs.
  // If the remaining amount is over 500, use one more 759 pack.
  // Small-pack limits: 335 <= 1, 203 <= 1, 66 <= 2.

  function price759Tier(qty){
    qty=Math.max(0,Math.floor(Number(qty)||0));
    if(qty>=30) return 287;
    if(qty>=20) return 290;
    if(qty>=10) return 293;
    return qty>0 ? 295 : 0;
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

    let d=Math.floor(target/759);
    let remainder=target-d*759;
    let a=0,b=0,c=0;

    if(remainder>500){
      d+=1;
      remainder=0;
    }else if(remainder>0){
      const small=bestSmallPackFill(remainder);
      a=small.a; b=small.b; c=small.c;
    }

    const totalEchoes=a*66+b*203+c*335+d*759;
    const totalTopup=a*60+b*185+c*305+d*690;
    const unit759=price759Tier(d);
    const cost=a*30+b*90+c*145+d*unit759;
    const count=a+b+c+d;

    return {
      counts:[a,b,c,d],
      totalEchoes,
      totalTopup,
      cost,
      extra:totalEchoes-target,
      count
    };
  }

  // Override only calculator pricing/pack selection functions.
  window.price759=price759Tier;
  window.findBest=ymkFindBest;
  window.YMK_CALCULATOR_PACK_RULES={price759:price759Tier,findBest:ymkFindBest,bestSmallPackFill};
})();
