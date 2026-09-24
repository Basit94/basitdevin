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
async function main(){
 server=spawn(process.execPath,['server.js'],{env,stdio:'inherit'});await wait();
 let x=await call('/api/health');check('health',x.r.status===200&&x.body.ok);
 x=await call('/');check('customer HTML',x.r.status===200&&x.body.includes('Shrimp Fins'));
 x=await call('/admin');check('admin HTML',x.r.status===200&&x.body.includes('Restaurant Control'));
 x=await call('/manifest.webmanifest');check('PWA manifest',x.r.status===200);
 x=await call('/sw.js');check('service worker',x.r.status===200);
 x=await call('/api/public');const pub=x.body;check('public API',x.r.status===200);check('5 categories',pub.categories.length===5,String(pub.categories.length));check('49 products',pub.products.length===49,String(pub.products.length));check('7 offers',pub.offers.length===7,String(pub.offers.length));check('49 product images',pub.products.every(p=>p.image));check('7 offer images',pub.offers.every(o=>o.image));check('phone setting',pub.settings.phone==='0541064143');
 x=await call('/api/orders',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({customerName:'X',phone:'1',items:[]})});check('bad order validation',x.r.status===400);
 x=await call('/api/orders',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({customerName:'QA Customer',phone:'0555555555',orderType:'pickup',notes:'QA',paymentMethod:'cash',items:[{productId:pub.products[0].id,qty:2},{productId:pub.products[1].id,qty:1}]})});check('create order PENDING',x.r.status===201&&x.body.order.status==='PENDING');const order=x.body.order;
 x=await call('/api/orders/track/'+encodeURIComponent(order.trackingToken)+'?phone=55555555');check('track order',x.r.status===200&&x.body.order.orderNumber===order.orderNumber);
 x=await call('/api/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password:credential})});check('admin login',x.r.status===200&&x.body.ok);cookie=(x.r.headers.get('set-cookie')||'').split(';')[0];check('auth cookie',cookie.startsWith('sf_admin='));
 x=await call('/api/admin/me');check('admin session',x.r.status===200&&x.body.admin.email===email);
 x=await call('/api/admin/dashboard');check('dashboard',x.r.status===200&&x.body.products===49&&x.body.pending>=1);
 x=await call('/api/admin/orders?status=PENDING&q='+encodeURIComponent(order.orderNumber));const o=x.body.orders.find(v=>v.order_no===order.orderNumber);check('order filters',x.r.status===200&&!!o);
 x=await call('/api/admin/orders/'+o.id);check('order details/history',x.r.status===200&&x.body.items.length===2&&x.body.history.length>=1);
 x=await call('/api/admin/orders/'+o.id+'/status',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status:'READY'})});check('reject invalid transition',x.r.status===409);
 for(const status of ['CONFIRMED','PREPARING','READY','COMPLETED']){x=await call('/api/admin/orders/'+o.id+'/status',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status,estimatedMinutes:status==='CONFIRMED'?30:undefined})});check('status '+status,x.r.status===200&&x.body.order.status===status)}
 x=await call('/api/orders/track/'+encodeURIComponent(order.trackingToken)+'?phone=55555555');check('tracking completed',x.r.status===200&&x.body.order.status==='COMPLETED');
 x=await call('/api/admin/categories',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:'qa-category',name_ar:'تجربة',name_en:'QA Category',icon:'🧪',active:true,sort_order:999})});check('category create',x.r.status===201);x=await call('/api/admin/categories/qa-category',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({active:false,name_en:'QA Updated'})});check('category update',x.r.status===200&&!x.body.category.active);
 x=await call('/api/admin/products',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({category_id:'qa-category',name_ar:'منتج اختبار',name_en:'QA Product',price:19.5,unit_ar:'طبق',unit_en:'item',available:true})});check('product create',x.r.status===201);const pid=x.body.product.id;
 x=await call('/api/admin/products/'+pid,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({price:21,featured:true,available:false})});check('product edit/soldout',x.r.status===200&&Number(x.body.product.price)===21&&x.body.product.featured&&!x.body.product.available);
 const fd=new FormData(),png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=','base64');fd.append('image',new Blob([png],{type:'image/png'}),'qa.png');x=await call('/api/admin/images',{method:'POST',body:fd});check('image upload',x.r.status===201&&x.body.url.startsWith('/api/images/'));const image=x.body.url;x=await call(image);check('image delivery',x.r.status===200&&x.r.headers.get('content-type')==='image/png');
 x=await call('/api/admin/products/'+pid,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({image,available:true})});check('assign product image',x.r.status===200&&x.body.product.image===image);
 x=await call('/api/admin/offers',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title_ar:'عرض اختبار',title_en:'QA Offer',price:99,image,active:true})});check('offer create',x.r.status===201);const oid=x.body.offer.id;x=await call('/api/admin/offers/'+oid,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({price:89,active:false})});check('offer edit/hide',x.r.status===200&&Number(x.body.offer.price)===89&&!x.body.offer.active);x=await call('/api/admin/offers/'+oid,{method:'DELETE'});check('offer delete',x.r.status===200&&x.body.ok);
 x=await call('/api/admin/settings',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({deliveryFee:12,minimumOrder:25,acceptingOrders:true,openingHoursEn:'QA Hours'})});check('settings update',x.r.status===200&&Number(x.body.settings.deliveryFee)===12);
 x=await call('/api/admin/export');check('backup export',x.r.status===200&&Array.isArray(x.body.products)&&Array.isArray(x.body.orders));
 x=await call('/api/admin/products/'+pid,{method:'DELETE'});check('product delete',x.r.status===200&&x.body.ok);
 console.log('\nSHRIMP FINS QA');for(const r of rows)console.log(r.join(' | '));console.log('RESULT',pass,'passed',fail,'failed');
}
main().then(()=>{server.kill();process.exit(0)}).catch(e=>{console.error(e);for(const r of rows)console.log(r.join(' | '));server?.kill();process.exit(1)});