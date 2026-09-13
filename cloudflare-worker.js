let oauthCache={token:'',exp:0};

function corsHeaders(){
  return {
    'Access-Control-Allow-Origin':'https://yuimellkub.github.io',
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type'
  };
}

function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{...corsHeaders(),'Content-Type':'application/json'}
  });
}

function b64url(input){
  const bytes=typeof input==='string'?new TextEncoder().encode(input):input;
  let binary='';
  for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function pemToArrayBuffer(pem){
  const clean=String(pem||'').replace(/\\n/g,'\n')
    .replace('-----BEGIN PRIVATE KEY-----','')
    .replace('-----END PRIVATE KEY-----','')
    .replace(/\s+/g,'');
  const binary=atob(clean);
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes.buffer;
}

async function getAccessToken(env){
  const now=Math.floor(Date.now()/1000);
  if(oauthCache.token&&oauthCache.exp>now+120)return oauthCache.token;
  const header={alg:'RS256',typ:'JWT'};
  const claim={
    iss:env.FIREBASE_CLIENT_EMAIL,
    scope:'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging',
    aud:'https://oauth2.googleapis.com/token',
    iat:now,
    exp:now+3600
  };
  const unsigned=b64url(JSON.stringify(header))+'.'+b64url(JSON.stringify(claim));
  const key=await crypto.subtle.importKey(
    'pkcs8',pemToArrayBuffer(env.FIREBASE_PRIVATE_KEY),
    {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']
  );
  const signature=await crypto.subtle.sign(
    {name:'RSASSA-PKCS1-v1_5'},key,new TextEncoder().encode(unsigned)
  );
  const assertion=unsigned+'.'+b64url(new Uint8Array(signature));
  const body=new URLSearchParams({
    grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion
  });
  const r=await fetch('https://oauth2.googleapis.com/token',{
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body
  });
  const data=await r.json();
  if(!r.ok||!data.access_token)throw new Error('GOOGLE_AUTH_FAILED');
  oauthCache={token:data.access_token,exp:now+(Number(data.expires_in)||3600)};
  return oauthCache.token;
}

const fsString=v=>({stringValue:String(v==null?'':v)});
const fsBool=v=>({booleanValue:!!v});
const fsInt=v=>({integerValue:String(Math.trunc(Number(v)||0))});
const fsTime=v=>({timestampValue:v||new Date().toISOString()});

async function saveManualSlip(env,body){
  const reviewId=String(body.reviewId||'').trim();
  const imageData=String(body.imageData||'');
  if(!/^SLIP\d{6}-\d{6}-[A-Z0-9]{3}$/.test(reviewId))return {ok:false,status:400,error:'INVALID_REVIEW_ID'};
  if(!/^data:image\/jpeg;base64,/.test(imageData))return {ok:false,status:400,error:'INVALID_IMAGE'};
  if(imageData.length>550000)return {ok:false,status:413,error:'IMAGE_TOO_LARGE'};

  const token=await getAccessToken(env);
  const project=env.FIREBASE_PROJECT_ID;
  const url=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents/order_slips/${encodeURIComponent(reviewId)}?currentDocument.exists=false`;
  const doc={fields:{
    reviewId:fsString(reviewId),
    reviewPending:fsBool(true),
    reviewDecision:fsString('pending'),
    item:fsString(String(body.item||'').slice(0,160)),
    pack:fsString(String(body.pack||'').slice(0,160)),
    price:fsString(String(body.price||'').slice(0,80)),
    paymentMethod:fsString(String(body.paymentMethod||'').slice(0,80)),
    uid:fsString(String(body.uid||'').slice(0,100)),
    server:fsString(String(body.server||'Asia').slice(0,40)),
    name:fsString(String(body.name||'').slice(0,100)),
    imageData:fsString(imageData),
    mimeType:fsString('image/jpeg'),
    width:fsInt(Math.max(0,Math.min(5000,Number(body.width)||0))),
    height:fsInt(Math.max(0,Math.min(5000,Number(body.height)||0))),
    bytes:fsInt(Math.max(0,Math.min(550000,Number(body.bytes)||imageData.length))),
    verified:fsBool(false),
    verificationMode:fsString('manual'),
    createdAt:fsTime(new Date().toISOString())
  }};
  const r=await fetch(url,{
    method:'PATCH',
    headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
    body:JSON.stringify(doc)
  });
  if(r.status===409)return {ok:false,status:409,error:'REVIEW_ID_EXISTS'};
  if(!r.ok){console.log('Firestore write failed',r.status,await r.text());return {ok:false,status:500,error:'FIRESTORE_WRITE_FAILED'};}
  return {ok:true,status:200,reviewId};
}

function readStringField(doc,name){return doc?.fields?.[name]?.stringValue||'';}
function readBoolField(doc,name){return doc?.fields?.[name]?.booleanValue;}
function readStringArray(doc,name){
  return (doc?.fields?.[name]?.arrayValue?.values||[]).map(v=>v.stringValue).filter(Boolean);
}

async function notifyAdmins(env,review){
  try{
    const token=await getAccessToken(env);
    const project=env.FIREBASE_PROJECT_ID;
    const listUrl=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents/admin_push_tokens?pageSize=100`;
    const r=await fetch(listUrl,{headers:{Authorization:`Bearer ${token}`}});
    if(!r.ok){console.log('Read push tokens failed',r.status,await r.text());return;}
    const data=await r.json();
    const tokens=[];
    for(const doc of data.documents||[]){
      if(readBoolField(doc,'enabled')===false)continue;
      tokens.push(...readStringArray(doc,'tokens'));
    }
    const unique=[...new Set(tokens)];
    if(!unique.length)return;
    const item=String(review.item||'รายการใหม่').trim();
    const price=String(review.price||'').trim();
    const body=`${item}${price?' • '+price:''} • ${review.reviewId}`;
    const endpoint=`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(project)}/messages:send`;
    await Promise.all(unique.map(async pushToken=>{
      const rr=await fetch(endpoint,{
        method:'POST',
        headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
        body:JSON.stringify({message:{
          token:pushToken,
          data:{
            title:'Yuimellkub • มีสลิปรอตรวจสอบ 🔔',
            body,
            orderId:review.reviewId,
            reviewId:review.reviewId,
            url:'/yuimellkub-topup/admin.html'
          },
          webpush:{fcmOptions:{link:'https://yuimellkub.github.io/yuimellkub-topup/admin.html'}}
        }})
      });
      if(!rr.ok)console.log('FCM send failed',rr.status,await rr.text());
    }));
  }catch(e){console.log('Push notification failed',e?.message||e);}
}

async function handleManualSlip(request,env){
  let body={};
  try{body=await request.json();}catch(e){return json({ok:false,error:'INVALID_JSON'},400);}
  try{
    const saved=await saveManualSlip(env,body);
    if(!saved.ok)return json({ok:false,error:saved.error},saved.status);
    await notifyAdmins(env,{...body,reviewId:saved.reviewId});
    return json({ok:true,reviewId:saved.reviewId});
  }catch(e){
    console.log('manual slip failed',e?.message||e);
    return json({ok:false,error:'SERVER_ERROR'},500);
  }
}

async function handleEasySlip(request,env){
  try{
    const formData=await request.formData();
    const image=formData.get('image');
    if(!image||typeof image==='string')return json({success:false,message:'กรุณาเลือกรูปสลิป'},400);
    if(!String(image.type||'').startsWith('image/'))return json({success:false,message:'ไฟล์ต้องเป็นรูปภาพเท่านั้น'},400);
    if(image.size>4*1024*1024)return json({success:false,message:'รูปสลิปต้องมีขนาดไม่เกิน 4MB'},400);
    const bytes=new Uint8Array(await image.arrayBuffer());
    let binary='';
    const chunkSize=0x8000;
    for(let i=0;i<bytes.length;i+=chunkSize)binary+=String.fromCharCode(...bytes.subarray(i,i+chunkSize));
    const base64=`data:${image.type||'image/jpeg'};base64,`+btoa(binary);
    const response=await fetch('https://api.easyslip.com/v2/verify/bank',{
      method:'POST',
      headers:{Authorization:`Bearer ${env.EASYSLIP_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({base64,checkDuplicate:true})
    });
    const result=await response.json();
    return json(result,response.status);
  }catch(e){
    return json({success:false,message:'ระบบตรวจสลิปเกิดข้อผิดพลาด'},500);
  }
}

export default {
  async fetch(request,env){
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders()});
    if(request.method!=='POST')return json({success:false,message:'Method not allowed'},405);
    const url=new URL(request.url);
    if(url.pathname==='/manual-slip')return handleManualSlip(request,env);
    return handleEasySlip(request,env);
  }
};
