const {onDocumentCreated}=require('firebase-functions/v2/firestore');
const {onRequest}=require('firebase-functions/v2/https');
const admin=require('firebase-admin');

admin.initializeApp();
const db=admin.firestore();

const ALLOWED_ORIGINS=new Set([
  'https://yuimellkub.github.io',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
]);

function setCors(req,res){
  const origin=req.get('origin')||'';
  if(ALLOWED_ORIGINS.has(origin))res.set('Access-Control-Allow-Origin',origin);
  res.set('Vary','Origin');
  res.set('Access-Control-Allow-Methods','POST, OPTIONS');
  res.set('Access-Control-Allow-Headers','Content-Type');
}

function text(v,max=120){return String(v==null?'':v).trim().slice(0,max);}
function validReviewId(v){return /^SLIP\d{6}-\d{6}-[A-Z0-9]{3}$/.test(String(v||''));}

exports.submitManualSlip=onRequest({region:'asia-southeast1',cors:false},async(req,res)=>{
  setCors(req,res);
  if(req.method==='OPTIONS')return res.status(204).send('');
  if(req.method!=='POST')return res.status(405).json({ok:false,error:'METHOD_NOT_ALLOWED'});
  const origin=req.get('origin')||'';
  if(origin&&!ALLOWED_ORIGINS.has(origin))return res.status(403).json({ok:false,error:'ORIGIN_NOT_ALLOWED'});
  try{
    const b=req.body||{};
    const reviewId=text(b.reviewId,40);
    const imageData=String(b.imageData||'');
    if(!validReviewId(reviewId))return res.status(400).json({ok:false,error:'INVALID_REVIEW_ID'});
    if(!/^data:image\/jpeg;base64,/.test(imageData))return res.status(400).json({ok:false,error:'INVALID_IMAGE'});
    if(imageData.length>550000)return res.status(413).json({ok:false,error:'IMAGE_TOO_LARGE'});
    const ref=db.collection('order_slips').doc(reviewId);
    const old=await ref.get();
    if(old.exists)return res.status(409).json({ok:false,error:'REVIEW_ID_EXISTS'});
    const doc={
      reviewId,
      reviewPending:true,
      reviewDecision:'pending',
      item:text(b.item,160),
      pack:text(b.pack,160),
      price:text(b.price,80),
      paymentMethod:text(b.paymentMethod,80),
      uid:text(b.uid,100),
      server:text(b.server,40)||'Asia',
      name:text(b.name,100),
      imageData,
      mimeType:'image/jpeg',
      width:Math.max(0,Math.min(5000,Number(b.width)||0)),
      height:Math.max(0,Math.min(5000,Number(b.height)||0)),
      bytes:Math.max(0,Math.min(550000,Number(b.bytes)||imageData.length)),
      verified:false,
      verificationMode:'manual',
      createdAt:admin.firestore.FieldValue.serverTimestamp()
    };
    await ref.set(doc);
    return res.status(200).json({ok:true,reviewId});
  }catch(err){
    console.error('submitManualSlip failed',err);
    return res.status(500).json({ok:false,error:'SERVER_ERROR'});
  }
});

exports.notifyPendingSlip=onDocumentCreated({
  document:'order_slips/{reviewId}',
  region:'asia-southeast1'
},async event=>{
  const snap=event.data;if(!snap)return;
  const review=snap.data()||{};
  const reviewId=event.params.reviewId;
  if(review.reviewPending!==true||review.verificationMode!=='manual')return;

  const tokenSnap=await db.collection('admin_push_tokens').get();
  const tokens=[];
  tokenSnap.forEach(doc=>{const data=doc.data()||{};if(data.enabled===false)return;if(Array.isArray(data.tokens))tokens.push(...data.tokens.filter(Boolean));});
  const unique=[...new Set(tokens)];
  if(!unique.length){console.log('No admin push tokens registered');return;}

  const price=String(review.price||'').trim();
  const item=String(review.item||'รายการใหม่').trim();
  const body=`${item}${price?' • '+price:''} • ${reviewId}`;
  const response=await admin.messaging().sendEachForMulticast({
    tokens:unique,
    data:{title:'Yuimellkub • มีสลิปรอตรวจสอบ 🔔',body,reviewId,url:'/yuimellkub-topup/admin.html'},
    webpush:{fcmOptions:{link:'https://yuimellkub.github.io/yuimellkub-topup/admin.html'}}
  });

  const bad=[];
  response.responses.forEach((r,i)=>{if(r.success)return;const code=r.error?.code||'';if(code==='messaging/registration-token-not-registered'||code==='messaging/invalid-registration-token')bad.push(unique[i]);});
  if(bad.length){const batch=db.batch();tokenSnap.forEach(doc=>{const data=doc.data()||{};if(!Array.isArray(data.tokens))return;const kept=data.tokens.filter(t=>!bad.includes(t));if(kept.length!==data.tokens.length)batch.set(doc.ref,{tokens:kept,updatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});});await batch.commit();}
  console.log(`Pending slip notification: ${response.successCount}/${unique.length} sent for ${reviewId}`);
});
