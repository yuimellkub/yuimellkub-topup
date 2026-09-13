const {onDocumentCreated}=require('firebase-functions/v2/firestore');
const admin=require('firebase-admin');

admin.initializeApp();
const db=admin.firestore();

exports.notifyPendingSlip=onDocumentCreated({
  document:'orders/{orderId}',
  region:'asia-southeast1'
},async event=>{
  const snap=event.data;
  if(!snap)return;
  const order=snap.data()||{};
  const orderId=event.params.orderId;

  const needsManualReview=(
    order.slipAttached===true &&
    order.slipVerified===false &&
    order.paymentStatus==='รอร้านตรวจสอบการชำระเงิน'
  );
  if(!needsManualReview)return;

  const tokenSnap=await db.collection('admin_push_tokens').get();
  const tokens=[];
  tokenSnap.forEach(doc=>{
    const data=doc.data()||{};
    if(data.enabled===false)return;
    if(Array.isArray(data.tokens))tokens.push(...data.tokens.filter(Boolean));
  });
  const unique=[...new Set(tokens)];
  if(!unique.length){
    console.log('No admin push tokens registered');
    return;
  }

  const price=String(order.price||'').trim();
  const item=String(order.item||'ออเดอร์ใหม่').trim();
  const body=`${item}${price?' • '+price:''} • ${orderId}`;
  const response=await admin.messaging().sendEachForMulticast({
    tokens:unique,
    data:{
      title:'Yuimellkub • มีสลิปรอตรวจสอบ 🔔',
      body,
      orderId,
      url:'/yuimellkub-topup/admin.html'
    },
    webpush:{
      fcmOptions:{link:'https://yuimellkub.github.io/yuimellkub-topup/admin.html'}
    }
  });

  const bad=[];
  response.responses.forEach((r,i)=>{
    if(r.success)return;
    const code=r.error?.code||'';
    if(code==='messaging/registration-token-not-registered'||code==='messaging/invalid-registration-token')bad.push(unique[i]);
  });

  if(bad.length){
    const batch=db.batch();
    tokenSnap.forEach(doc=>{
      const data=doc.data()||{};
      if(!Array.isArray(data.tokens))return;
      const kept=data.tokens.filter(t=>!bad.includes(t));
      if(kept.length!==data.tokens.length)batch.set(doc.ref,{tokens:kept,updatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});
    });
    await batch.commit();
  }

  console.log(`Pending slip notification: ${response.successCount}/${unique.length} sent for ${orderId}`);
});
