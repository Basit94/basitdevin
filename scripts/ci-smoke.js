const {spawn}=require('child_process');
const crypto=require('crypto');
const bcrypt=require('bcryptjs');

const PORT=3099,BASE='http://127.0.0.1:'+PORT;
const email='qa@shrimpfins.test',credential=crypto.randomBytes(18).toString('base64url');
const env={...process.env,PORT:String(PORT),NODE_ENV:'test',DATABASE_URL:process.env.DATABASE_URL||'postgres://postgres:postgres@127.0.0.1:5432/shrimpfins_test',DATABASE_SSL:'false',JWT_SECRET:crypto.randomBytes(48).toString('hex'),ADMIN_EMAIL:email,ADMIN_NAME:'QA Admin',ADMIN_PASSWORD_HASH:bcrypt.hashSync(credential,10)};
let server,cookie='',pass=0,fail=0;const rows=[];
function check(name,v,detail=''){rows.push([v?'PASS':'FAIL',name,detail]);if(v)pass++;else{fail++;throw Error(name+' '+detail)}}
async function call(path,opt={}){const headers={...(opt.headers||{})};if(cookie)headers.cookie=cookie;const r=await fetch(BASE+path,{...opt,headers});const ct=r.headers.get('content-type')||'';let body;try{body=ct.includes('json')?await r.json():await r.text()}catch{body=null}return{r,body}}
async function wait(){for(let i=0;i<80;i++){try{if((await call('/api/health')).r.ok)return}catch{}await new Promise(r=>setTimeout(r,250))}throw Error('server health timeout')}
function orderableProduct(pub){return pub.products.find(p=>p.orderable!==false&&Number(p.price)>0)}
function orderQty(product,minimum){return Math.max(1,Math.ceil(Number(minimum||0)/Number(product.price||1)))}
async function main(){
 server=spawn(process.execPath,['server.js'],{env,stdio:'inherit'});await wait();

 let x=await call('/api/health');check('health',x.r.status===200&&x.body.ok&&x.body.build,JSON.stringify(x.body));
 x=await call('/api/version');check('version endpoint',x.r.status===200&&x.body.build&&x.body.node,JSON.stringify(x.body));
 x=await call('/api/does-not-exist');check('unknown API is JSON 404',x.r.status===404&&x.body.error==='API endpoint not found'&&x.body.requestId,String(x.r.status));
 x=await call('/api/orders',{method:'POST',headers:{'content-type':'application/json'},body:'{"broken":'});check('malformed JSON handled',x.r.status===400&&x.body.requestId,String(x.r.status));
 x=await call('/');check('customer HTML',x.r.status===200&&x.body.includes('Shrimp Fins')&&x.body.includes('heroFoodImage'));
 x=await call('/admin');check('admin HTML',x.r.status===200&&x.body.includes('Restaurant Control')&&x.body.includes('sCashOnDelivery')&&x.body.includes('sCardOnDelivery'));
 x=await call('/manifest.webmanifest');check('PWA manifest',x.r.status===200&&((typeof x.body==='object'&&x.body?.name?.includes('Shrimp Fins'))||String(x.body).includes('Shrimp Fins')));
 x=await call('/sw.js');check('service worker',x.r.status===200);
 x=await call('/favicon.svg');check('favicon SVG',x.r.status===200&&(x.r.headers.get('content-type')||'').includes('image/svg+xml'));

 x=await call('/api/public');const pub=x.body;check('public API',x.r.status===200);
 check('13 categories',pub.categories.length===13,String(pub.categories.length));
 check('63 products',pub.products.length===63,String(pub.products.length));
 check('8 offers',pub.offers.length===8,String(pub.offers.length));
 check('63 product images',pub.products.every(p=>p.image),String(pub.products.filter(p=>!p.image).length));
 check('8 offer images',pub.offers.every(o=>o.image),String(pub.offers.filter(o=>!o.image).length));
 check('calories populated',pub.products.filter(p=>p.calories!=null).length>=52,String(pub.products.filter(p=>p.calories!=null).length));
 check('market price protection data',pub.products.filter(p=>p.orderable===false).length===1,String(pub.products.filter(p=>p.orderable===false).length));
 check('phone setting',pub.settings.phone==='0541064143',String(pub.settings.phone));
 check('COD enabled',pub.settings.cashOnDelivery===true,String(pub.settings.cashOnDelivery));
 check('card on delivery enabled',pub.settings.cardOnDelivery===true,String(pub.settings.cardOnDelivery));
 check('Google rating',Number(pub.settings.googleRating)===4.8,String(pub.settings.googleRating));
 check('Maps URL',String(pub.settings.mapUrl||'').includes('google.com/maps'),String(pub.settings.mapUrl||''));
 check('opening hours',pub.settings.openingHoursEn==='Daily 12:00 PM – 12:00 AM',String(pub.settings.openingHoursEn));

 x=await call('/api/orders',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({customerName:'X',phone:'1',items:[]})});check('bad order validation',x.r.status===400,String(x.r.status));

 const prod=orderableProduct(pub),qty=orderQty(prod,pub.settings.minimumOrder);
 const codKey='qa-'+crypto.randomUUID(),codPayload={customerName:'QA COD',phone:'0555555555',orderType:'pickup',notes:'QA COD',paymentMethod:'cod',clientRequestId:codKey,items:[{productId:prod.id,qty}]};
 x=await call('/api/orders',{method:'POST',headers:{'content-type':'application/json','idempotency-key':codKey},body:JSON.stringify(codPayload)});
 check('create COD pickup order',x.r.status===201&&x.body.order.status==='PENDING',String(x.r.status));const codOrder=x.body.order;
 x=await call('/api/orders',{method:'POST',headers:{'content-type':'application/json','idempotency-key':codKey},body:JSON.stringify(codPayload)});check('idempotent checkout retry',x.r.status===200&&x.body.reused===true&&x.body.order.orderNumber===codOrder.orderNumber,String(x.r.status));
 x=await call('/api/orders/track/'+encodeURIComponent(codOrder.trackingToken)+'?phone=55555555');check('track COD order',x.r.status===200&&x.body.order.orderNumber===codOrder.orderNumber);

 x=await call('/api/orders',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({customerName:'QA CARD',phone:'0555555566',orderType:'delivery',address:'Riyadh QA Address',notes:'QA CARD',paymentMethod:'card_on_delivery',items:[{productId:prod.id,qty}]})});
 check('create card delivery order',x.r.status===201&&x.body.order.status==='PENDING',String(x.r.status));const cardOrder=x.body.order;
 check('delivery total includes fee',Number(cardOrder.total)>=Number(prod.price)*qty+Number(pub.settings.deliveryFee||0)-0.01,String(cardOrder.total));

 const market=pub.products.find(p=>p.orderable===false);
 if(market){x=await call('/api/orders',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({customerName:'QA Market',phone:'0555555577',orderType:'pickup',paymentMethod:'cod',items:[{productId:market.id,qty:1}]})});check('reject market-price online order',x.r.status===409,String(x.r.status))}

 x=await call('/api/admin/me');check('unauthenticated admin blocked',x.r.status===401,String(x.r.status));
 x=await call('/api/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password:credential})});check('admin login',x.r.status===200&&x.body.ok);cookie=(x.r.headers.get('set-cookie')||'').split(';')[0];check('auth cookie',cookie.startsWith('sf_admin='));
 x=await call('/api/admin/me');check('admin session',x.r.status===200&&x.body.admin.email===email);
 x=await call('/api/admin/dashboard');check('dashboard',x.r.status===200&&Number(x.body.products)>=pub.products.length&&Number(x.body.pending)>=2,JSON.stringify({allProducts:x.body.products,publicProducts:pub.products.length,pending:x.body.pending}));

 x=await call('/api/admin/orders?status=PENDING&q='+encodeURIComponent(codOrder.orderNumber));const o=x.body.orders.find(v=>v.order_no===codOrder.orderNumber);check('order filters',x.r.status===200&&!!o);
 x=await call('/api/admin/orders/'+o.id);check('COD order details/history',x.r.status===200&&x.body.items.length===1&&x.body.history.length>=1&&x.body.order.payment==='cod',x.body.order?.payment||'');
 x=await call('/api/admin/orders?status=PENDING&q='+encodeURIComponent(cardOrder.orderNumber));const co=x.body.orders.find(v=>v.order_no===cardOrder.orderNumber);check('card order filters',x.r.status===200&&!!co);
 x=await call('/api/admin/orders/'+co.id);check('card order persisted',x.r.status===200&&x.body.order.payment==='card_on_delivery'&&x.body.order.order_type==='delivery',JSON.stringify({payment:x.body.order?.payment,type:x.body.order?.order_type}));

 x=await call('/api/admin/orders/'+o.id+'/status',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status:'READY'})});check('reject invalid transition',x.r.status===409,String(x.r.status));
 for(const status of ['CONFIRMED','PREPARING','READY','COMPLETED']){x=await call('/api/admin/orders/'+o.id+'/status',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status,estimatedMinutes:status==='CONFIRMED'?30:undefined})});check('status '+status,x.r.status===200&&x.body.order.status===status)}
 x=await call('/api/orders/track/'+encodeURIComponent(codOrder.trackingToken)+'?phone=55555555');check('tracking completed',x.r.status===200&&x.body.order.status==='COMPLETED');

 x=await call('/api/admin/categories',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:'qa-category',name_ar:'تجربة',name_en:'QA Category',icon:'🧪',active:true,sort_order:999})});check('category create',x.r.status===201);
 x=await call('/api/admin/categories/qa-category',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({active:false,name_en:'QA Updated'})});check('category update',x.r.status===200&&!x.body.category.active);

 x=await call('/api/admin/products',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({category_id:'qa-category',name_ar:'منتج اختبار',name_en:'QA Product',price:19.5,unit_ar:'طبق',unit_en:'item',available:true})});check('product create',x.r.status===201);const pid=x.body.product.id;
 x=await call('/api/admin/products/'+pid,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({price:21,featured:true,available:false})});check('product edit/soldout',x.r.status===200&&Number(x.body.product.price)===21&&x.body.product.featured&&!x.body.product.available);

 const fd=new FormData(),png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=','base64');fd.append('image',new Blob([png],{type:'image/png'}),'qa.png');
 x=await call('/api/admin/images',{method:'POST',body:fd});check('image upload',x.r.status===201&&x.body.url.startsWith('/api/images/'));const image=x.body.url;
 x=await call(image);check('image delivery',x.r.status===200&&x.r.headers.get('content-type')==='image/png');

 x=await call('/api/admin/products/'+pid,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({image,available:true})});check('assign product image',x.r.status===200&&x.body.product.image===image);
 x=await call('/api/admin/offers',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title_ar:'عرض اختبار',title_en:'QA Offer',price:99,image,active:true})});check('offer create',x.r.status===201);const oid=x.body.offer.id;
 x=await call('/api/admin/offers/'+oid,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({price:89,active:false})});check('offer edit/hide',x.r.status===200&&Number(x.body.offer.price)===89&&!x.body.offer.active);
 x=await call('/api/admin/offers/'+oid,{method:'DELETE'});check('offer delete',x.r.status===200&&x.body.ok);

 x=await call('/api/admin/settings',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({cashOnDelivery:false,cardOnDelivery:false})});check('prevent disabling all payments',x.r.status===400,String(x.r.status));
 x=await call('/api/admin/settings',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({deliveryFee:12,minimumOrder:25,acceptingOrders:true,cashOnDelivery:true,cardOnDelivery:true,openingHoursEn:'Daily 12:00 PM – 12:00 AM'})});check('settings update',x.r.status===200&&Number(x.body.settings.deliveryFee)===12&&x.body.settings.cashOnDelivery&&x.body.settings.cardOnDelivery);

 x=await call('/api/admin/export');check('backup export',x.r.status===200&&Array.isArray(x.body.products)&&Array.isArray(x.body.orders));
 await new Promise(r=>setTimeout(r,80));x=await call('/api/admin/audit?limit=200');check('admin audit log',x.r.status===200&&Array.isArray(x.body.audit)&&x.body.audit.length>=5&&x.body.audit.some(a=>a.actor===email&&['POST','PUT','PATCH','DELETE'].includes(a.action)),JSON.stringify({rows:x.body.audit?.length}));
 x=await call('/api/admin/products/'+pid,{method:'DELETE'});check('product delete',x.r.status===200&&x.body.ok);

 console.log('\nSHRIMP FINS QA');for(const r of rows)console.log(r.join(' | '));console.log('RESULT',pass,'passed',fail,'failed');
}
main().then(()=>{server.kill();process.exit(0)}).catch(e=>{console.error(e);for(const r of rows)console.log(r.join(' | '));server?.kill();process.exit(1)});
