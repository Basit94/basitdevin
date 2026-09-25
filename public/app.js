const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const state={data:null,lang:localStorage.getItem('sf_lang')||'ar',category:'all',search:'',cart:JSON.parse(localStorage.getItem('sf_cart')||'{}'),lastOrder:null,checkoutKey:null,checkoutFingerprint:null,mobileMenuExpanded:false};
const I18N={
ar:{offers:'العروض',menu:'المنيو',gallery:'الصور',contact:'تواصل',track:'تتبع',orderNow:'اطلب الآن',fresh:'طازج يومياً',restaurantConfirm:'تأكيد من المطعم',pickupDelivery:'استلام أو توصيل',menuItems:'صنف في المنيو',items:'صنف',confirmation:'تأكيد الطلب',callUs:'اتصل بنا',todayOffers:'عروض زعانف',offerSub:'عروض مشاركة وولائم مميزة',chooseMeal:'اختر وجبتك',menuSub:'اختر من المنيو الكامل، وأضف الطلب للسلة بسهولة.',noResults:'لا توجد نتائج',photoNote:'المنيو والأسعار والسعرات من ملف المطعم. نعرض صور المطعم الأصلية من ملف Excel، وأي صنف بلا صورة أصلية يظهر بصورة زعانف مؤقتة فقط.',galleryTitle:'زعانف الروبيان',gallerySub:'صورة المطعم والهوية الرسمية.',realStore:'واجهة زعانف الروبيان الحقيقية',howWorks:'كيف يعمل الطلب؟',howWorksSub:'الطلب لا يصبح مؤكداً إلا بعد موافقة المطعم.',step1:'اختر الأصناف',step2:'أرسل الطلب',step3:'المطعم يؤكد',step4:'تحضير واستلام',directions:'الاتجاهات',hours:'ساعات العمل',serviceOptions:'خيارات الخدمة',visitorInfo:'معلومات الزيارة',reservations:'الحجوزات والطلبات الكبيرة',verifiedInfo:'بيانات المطعم',todayStatus:'حالة اليوم',footer:'جميع الطلبات تحتاج تأكيد المطعم قبل التحضير.',cartTitle:'سلة الطلب',emptyCart:'السلة فارغة',subtotal:'المجموع',deliveryFee:'التوصيل',total:'الإجمالي',checkout:'متابعة الطلب',checkoutTitle:'بيانات الطلب',checkoutNote:'سيصل الطلب للمطعم كـ "بانتظار التأكيد".',pickup:'استلام',delivery:'توصيل',name:'الاسم',phone:'الجوال',address:'عنوان التوصيل',notes:'ملاحظات',payment:'طريقة الدفع',cod:'الدفع نقداً عند الاستلام',cardOnDelivery:'الدفع بالبطاقة عند الاستلام',officialPromo:'هوية وصورة زعانف الروبيان',amountDue:'الإجمالي',placeOrder:'إرسال الطلب للمطعم',terms:'الطلب ينتظر موافقة المطعم ولا يعتبر مؤكداً فور الإرسال.',trackOrder:'تتبع الطلب',showStatus:'عرض الحالة',orderSent:'تم إرسال طلبك',waitingConfirm:'طلبك الآن بانتظار تأكيد المطعم.',orderNumber:'رقم الطلب',trackNow:'تتبع الآن',done:'تم',all:'الكل',add:'إضافة',view:'عرض التفاصيل',minimum:'الحد الأدنى للطلب',open:'نستقبل الطلبات الآن',closed:'الطلبات متوقفة مؤقتاً',added:'تمت الإضافة للسلة',unavailable:'هذا الصنف غير متاح حالياً',orderFailed:'تعذر إرسال الطلب',loading:'جاري الإرسال...',pending:'بانتظار التأكيد',confirmed:'تم التأكيد',preparing:'قيد التحضير',ready:'جاهز',completed:'مكتمل',rejected:'مرفوض',cancelled:'ملغي',estimated:'الوقت المتوقع',minutes:'دقيقة',orderType:'نوع الطلب',copy:'نسخ رابط التتبع',copied:'تم نسخ رابط التتبع'},
en:{offers:'Offers',menu:'Menu',gallery:'Gallery',contact:'Contact',track:'Track',orderNow:'Order Now',fresh:'Fresh daily',restaurantConfirm:'Restaurant confirmation',pickupDelivery:'Pickup or delivery',menuItems:'menu items',items:'Items',confirmation:'order confirmation',callUs:'Call us',todayOffers:'Shrimp Fins Offers',offerSub:'Special sharing and family platter offers',chooseMeal:'Choose your meal',menuSub:'Browse the full menu and add items to your cart easily.',noResults:'No results found',photoNote:'Menu, prices and calories come from the restaurant file. Original Excel photos are used where supplied; items without a real photo use only the Shrimp Fins branded placeholder.',galleryTitle:'Shrimp Fins',gallerySub:'Official restaurant identity and storefront images.',realStore:'Real Shrimp Fins storefront',howWorks:'How ordering works',howWorksSub:'Your order is only confirmed after restaurant approval.',step1:'Choose items',step2:'Send order',step3:'Restaurant confirms',step4:'Prepare & receive',directions:'Directions',hours:'Opening hours',serviceOptions:'Service options',visitorInfo:'Visit information',reservations:'Reservations & large orders',verifiedInfo:'Restaurant information',todayStatus:'Today',footer:'Every order requires restaurant confirmation before preparation.',cartTitle:'Your cart',emptyCart:'Your cart is empty',subtotal:'Subtotal',deliveryFee:'Delivery',total:'Total',checkout:'Continue to checkout',checkoutTitle:'Order details',checkoutNote:'The order reaches the restaurant as pending confirmation.',pickup:'Pickup',delivery:'Delivery',name:'Name',phone:'Mobile',address:'Delivery address',notes:'Notes',payment:'Payment method',cod:'Cash on Delivery / Pickup',cardOnDelivery:'Card on Delivery / Pickup',officialPromo:'Shrimp Fins official restaurant image',amountDue:'Total',placeOrder:'Send order to restaurant',terms:'The order is pending restaurant approval and is not instantly confirmed.',trackOrder:'Track order',showStatus:'Show status',orderSent:'Order sent',waitingConfirm:'Your order is waiting for restaurant confirmation.',orderNumber:'Order number',trackNow:'Track now',done:'Done',all:'All',add:'Add',view:'View details',minimum:'Minimum order',open:'Accepting orders now',closed:'Orders temporarily paused',added:'Added to cart',unavailable:'This item is currently unavailable',orderFailed:'Could not place order',loading:'Sending...',pending:'Pending confirmation',confirmed:'Confirmed',preparing:'Preparing',ready:'Ready',completed:'Completed',rejected:'Rejected',cancelled:'Cancelled',estimated:'Estimated time',minutes:'minutes',orderType:'Order type',copy:'Copy tracking link',copied:'Tracking link copied'}
};
const tr=k=>I18N[state.lang][k]||k;
let lastClientErrorKey='',lastClientErrorAt=0;
function reportClientError(kind,message,stack=''){
 try{
  const key=kind+'|'+String(message).slice(0,300),now=Date.now();
  if(key===lastClientErrorKey&&now-lastClientErrorAt<30000)return;
  lastClientErrorKey=key;lastClientErrorAt=now;
  navigator.sendBeacon?.('/api/client-errors',new Blob([JSON.stringify({kind,message:String(message||'').slice(0,500),stack:String(stack||'').slice(0,2000),path:location.pathname,href:location.href,userAgent:navigator.userAgent})],{type:'application/json'}))
  ||fetch('/api/client-errors',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({kind,message:String(message||'').slice(0,500),stack:String(stack||'').slice(0,2000),path:location.pathname,href:location.href,userAgent:navigator.userAgent}),keepalive:true}).catch(()=>{});
 }catch{}
}
window.addEventListener('error',e=>reportClientError('window_error',e.message,e.error?.stack||''));
window.addEventListener('unhandledrejection',e=>reportClientError('unhandled_rejection',e.reason?.message||String(e.reason||''),e.reason?.stack||''));
const txt=(o,a,e)=>state.lang==='ar'?(o?.[a]||o?.[e]||''):(o?.[e]||o?.[a]||'');
const money=n=>new Intl.NumberFormat(state.lang==='ar'?'ar-SA':'en-US',{minimumFractionDigits:0,maximumFractionDigits:2}).format(+n||0)+' SAR';
function restaurantOpenNow(){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Riyadh',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
 const h=+(parts.find(x=>x.type==='hour')?.value||0),m=+(parts.find(x=>x.type==='minute')?.value||0),mins=(h%24)*60+m,open=mins>=720;
 return{open,text:state.lang==='ar'?(open?'مفتوح الآن · حتى 12:00 منتصف الليل':'مغلق الآن · يفتح 12:00 ظهراً'):(open?'Open now · until 12:00 AM':'Closed now · opens 12:00 PM')};
}
function toast(msg,error=false){const x=$('#toast');x.textContent=msg;x.className='toast show'+(error?' error':'');clearTimeout(toast.t);toast.t=setTimeout(()=>x.className='toast',2600)}
function saveCart(){state.checkoutKey=null;state.checkoutFingerprint=null;localStorage.setItem('sf_cart',JSON.stringify(state.cart));renderCart()}
function cartQty(){return Object.values(state.cart).reduce((a,b)=>a+(+b||0),0)}
function product(id){return state.data?.products.find(p=>p.id===id)}
function cat(id){return state.data?.categories.find(c=>c.id===id)||{}}
function totals(type=null){const sub=Object.entries(state.cart).reduce((sum,[id,q])=>{const p=product(id);return sum+(p?+p.price*(+q||0):0)},0);const orderType=type||document.querySelector('input[name="orderType"]:checked')?.value||'pickup';const fee=orderType==='delivery'?+(state.data?.settings?.deliveryFee||0):0;return{sub,fee,total:sub+fee}}
const PRODUCT_PLACEHOLDER='/assets/product-placeholder.svg';
function setImage(img,src,fallback='🦐'){if(!img)return;img.onerror=()=>{img.onerror=null;img.src=PRODUCT_PLACEHOLDER};img.src=src}
function remoteImg(src,alt='',lazy=true){const u=String(src||'');if(u.startsWith('/'))return `<img ${lazy?'loading="lazy" ':''}src="${esc(u)}" alt="${esc(alt)}">`;return `<img ${lazy?'loading="lazy" ':''}src="${PRODUCT_PLACEHOLDER}" data-remote-src="${esc(u)}" alt="${esc(alt)}">`}
function hydrateRemoteImages(root=document){root.querySelectorAll('img[data-remote-src]').forEach(img=>{const src=img.dataset.remoteSrc;img.removeAttribute('data-remote-src');if(!src)return;const probe=new Image();probe.onload=()=>{img.src=src};probe.onerror=()=>{};probe.src=src})}
function open(sel){$('#overlay').classList.remove('hidden');$(sel).classList.remove('hidden');document.body.classList.add('lock')}
function closeAll(){['#overlay','#cartDrawer','#checkoutModal','#trackModal','#successModal','#productModal'].forEach(s=>$(s)?.classList.add('hidden'));document.body.classList.remove('lock')}
function statusLabel(s){return tr(String(s||'').toLowerCase())||s}
function applyLanguage(){
 document.documentElement.lang=state.lang;document.documentElement.dir=state.lang==='ar'?'rtl':'ltr';
 $('#langBtn').textContent=state.lang==='ar'?'EN':'AR';
 $$('[data-t]').forEach(el=>{const k=el.dataset.t;if(I18N[state.lang][k])el.textContent=I18N[state.lang][k]});
 $('#searchInput').placeholder=state.lang==='ar'?'ابحث في المنيو...':'Search the menu...';
 renderSettings();renderOffers();renderCategories();renderProducts();renderCart();
}
let heroPhotoIndex=0,heroPhotoTimer=null,heroTouchX=null;
function heroPhotos(st){
 const configured=Array.isArray(st.heroPhotos)?st.heroPhotos.filter(p=>p&&p.src):[];
 const fallback=[
  {src:st.storefrontImage||'/assets/storefront.svg',ar:'واجهة مطعم زعانف الروبيان',en:'Shrimp Fins storefront',source:'OWNER'},
  {src:st.officialPromoImage||st.heroImage||'/assets/shrimp-fins-promo.webp',ar:'هوية زعانف الروبيان',en:'Shrimp Fins identity',source:'OWNER'}
 ];
 const googlePhoto=st.mapsPhotoUrl?[{src:st.mapsPhotoUrl,ar:'صورة من موقع المطعم',en:'Restaurant location photo',source:'PUBLIC_LISTING'}]:[];
 return[...(configured.length?configured:fallback),...googlePhoto].filter((x,i,a)=>x.src&&a.findIndex(y=>y.src===x.src)===i);
}
function photoOrigin(p){
 const src=String(p?.image_source||'');
 if(src==='OWNER_EXCEL')return{cls:'owner',ar:'صورة المطعم',en:'Restaurant photo'};
 if(src==='ADMIN_UPLOAD')return{cls:'owner',ar:'صورة المطعم',en:'Restaurant photo'};
 if(src==='CUSTOM')return{cls:'custom',ar:'صورة مخصصة',en:'Custom photo'};
 return{cls:'missing',ar:'الصورة الأصلية قريباً',en:'Real photo coming soon'};
}
function photoBadge(p){const o=photoOrigin(p);return `<span class="photo-origin ${o.cls}">${state.lang==='ar'?o.ar:o.en}</span>`}
function displayImage(p){const o=photoOrigin(p);return o.cls==='missing'?PRODUCT_PLACEHOLDER:(p?.image||PRODUCT_PLACEHOLDER)}
function showHeroPhoto(index,manual=false){
 if(!state.data)return;const st=state.data.settings||{},photos=heroPhotos(st);if(!photos.length)return;
 heroPhotoIndex=(index+photos.length)%photos.length;const p=photos[heroPhotoIndex],img=$('#heroFoodImage');
 if(img){img.classList.add('changing');const probe=new Image();probe.onload=()=>{img.src=p.src;img.alt=state.lang==='ar'?p.ar:p.en;requestAnimationFrame(()=>img.classList.remove('changing'))};probe.onerror=()=>{img.src=st.storefrontImage||'/assets/storefront.svg';img.classList.remove('changing')};probe.src=p.src}
 const cap=$('#heroPhotoCaption');if(cap)cap.textContent=state.lang==='ar'?p.ar:p.en;
 const dots=$('#heroPhotoDots');if(dots)dots.innerHTML=photos.map((_,i)=>`<button type="button" aria-label="Photo ${i+1}" class="${i===heroPhotoIndex?'active':''}" data-hero-dot="${i}"></button>`).join('');
 $$('[data-hero-dot]').forEach(b=>b.onclick=()=>showHeroPhoto(+b.dataset.heroDot,true));
 if(manual)restartHeroPhotos();
}
function restartHeroPhotos(){clearInterval(heroPhotoTimer);heroPhotoTimer=setInterval(()=>showHeroPhoto(heroPhotoIndex+1),6500)}
function initHeroPhotos(){
 const frame=$('.hero-photo-frame');if(!frame)return;
 $('#heroPhotoPrev').onclick=()=>showHeroPhoto(heroPhotoIndex-1,true);$('#heroPhotoNext').onclick=()=>showHeroPhoto(heroPhotoIndex+1,true);
 frame.addEventListener('touchstart',e=>{heroTouchX=e.touches[0]?.clientX??null},{passive:true});
 frame.addEventListener('touchend',e=>{if(heroTouchX==null)return;const dx=(e.changedTouches[0]?.clientX??heroTouchX)-heroTouchX;heroTouchX=null;if(Math.abs(dx)>45)showHeroPhoto(heroPhotoIndex+(dx<0?1:-1),true)},{passive:true});
 showHeroPhoto(0);restartHeroPhotos();
}
function renderSettings(){
 if(!state.data)return;const st=state.data.settings||{},pc=(state.data.products||[]).length,oc=(state.data.offers||[]).length;
 const setText=(sel,v)=>{const el=$(sel);if(el)el.textContent=v??''},setHref=(sel,v)=>{const el=$(sel);if(el)el.href=v};
 setText('#menuCount',pc+'+');setText('#heroMenuCount',pc+'+');setText('#offersCount',oc);
 setText('#heroMessage',state.lang==='ar'?(st.heroMessageAr||tr('orderNow')):(st.heroMessageEn||'Premium fresh seafood, prepared to order'));
 setText('#heroSub',state.lang==='ar'?'اختر وجبتك وأرسل الطلب. المطعم يراجع الطلب ويؤكده قبل التحضير.':'Choose your meal and send the order. The restaurant reviews and confirms it before preparation.');
 setText('#restaurantName',state.lang==='ar'?(st.restaurantNameAr||'زعانف الروبيان'):(st.restaurantNameEn||'Shrimp Fins'));
 setText('#addressText',state.lang==='ar'?(st.addressAr||''):(st.addressEn||''));
 const phone=st.phone||'0541064143';setText('#phoneText',phone);setHref('#callBtn','tel:'+phone);
 const wa=String(st.whatsapp||'966541064143').replace(/\D/g,'');setHref('#waBtn','https://wa.me/'+wa);setHref('#waHero','https://wa.me/'+wa);
 const mapUrl=st.mapUrl||('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(st.mapQuery||st.addressAr||st.addressEn||'Shrimp Fins Riyadh'));setHref('#mapBtn',mapUrl);setHref('#mapBtnSecondary',mapUrl);setHref('#bannerMapBtn',mapUrl);setHref('#googleRatingLink',mapUrl);
 setText('#hoursText',state.lang==='ar'?(st.openingHoursAr||''):(st.openingHoursEn||''));
 setText('#googleRating',st.googleRating?Number(st.googleRating).toFixed(1)+' ★':'4.8 ★');setText('#googleReviews',(st.googleReviewCount||'')+(state.lang==='ar'?' تقييم على Google':' Google reviews'));
 const modes=state.lang==='ar'?(st.serviceModesAr||'توصيل • سفري • تناول داخل المطعم'):(st.serviceModesEn||'Delivery • Takeaway • Dine-in');setText('#serviceModes',modes);setText('#serviceModesContact',modes);
 setText('#amenitiesText',state.lang==='ar'?(st.amenitiesAr||'مناسب للعائلات • مواقف مجانية'):(st.amenitiesEn||'Family-friendly • Free parking'));
 setText('#reservationText',state.lang==='ar'?(st.reservationsAr||'متاحة بالتواصل مع المطعم'):(st.reservationsEn||'Available by contacting the restaurant'));
 setText('#infoVerifiedText',state.lang==='ar'?('ملف المطعم وخرائط Google · '+(st.googleInfoCheckedAt||'2026-09-24')):('Restaurant file & Google Maps · '+(st.googleInfoCheckedAt||'2026-09-24')));
 setText('#photoSourceNote',state.lang==='ar'?'صور الطعام الأصلية من ملف Excel الذي زودنا به المطعم. الأصناف التي لم يرسل لها المطعم صورة تستخدم شعار زعانف مؤقتاً فقط.':'Original food photos come from the restaurant-supplied Excel file. Items without an owner photo use only the Shrimp Fins branded placeholder.');
 const physical=restaurantOpenNow();setText('#physicalOpenStatus',physical.text);const openIcon=$('#openNowIcon');if(openIcon)openIcon.textContent=physical.open?'🟢':'🕒';
 const badge=$('#orderBadge');if(badge){badge.classList.toggle('closed',st.acceptingOrders===false);const span=badge.querySelector('span');if(span)span.textContent=st.acceptingOrders===false?tr('closed'):tr('open')}
 if($('#heroFoodImage'))showHeroPhoto(heroPhotoIndex);
 if(st.storefrontImage&&$('#storefrontImg'))setImage($('#storefrontImg'),st.storefrontImage,'🏪');
 const codInput=document.querySelector('input[name="paymentMethod"][value="cod"]'),cardInput=document.querySelector('input[name="paymentMethod"][value="card_on_delivery"]');
 if(codInput){codInput.closest('label')?.classList.toggle('hidden',st.cashOnDelivery===false);codInput.disabled=st.cashOnDelivery===false}
 if(cardInput){cardInput.closest('label')?.classList.toggle('hidden',st.cardOnDelivery===false);cardInput.disabled=st.cardOnDelivery===false}
 if(codInput?.checked&&codInput.disabled&&cardInput&&!cardInput.disabled)cardInput.checked=true;
 if(cardInput?.checked&&cardInput.disabled&&codInput&&!codInput.disabled)codInput.checked=true;
 setText('#minimumText',(+st.minimumOrder||0)>0?tr('minimum')+': '+money(st.minimumOrder):'');
}
function renderOffers(){
 if(!state.data)return;const arr=state.data.offers||[];
 $('#offersGrid').innerHTML=arr.map(o=>`<article class="offer-card ${photoOrigin(o).cls}-photo">${remoteImg(displayImage(o),txt(o,'title_ar','title_en'))}<span class="offer-price">${money(o.price)}</span><div class="offer-copy"><h3>${esc(txt(o,'title_ar','title_en'))}</h3><p>${esc(txt(o,'description_ar','description_en')||'')}</p></div></article>`).join('');hydrateRemoteImages($('#offersGrid'));
}
function renderCategories(){
 if(!state.data)return;const all={id:'all',name_ar:'الكل',name_en:'All',icon:'✨'},arr=[all,...state.data.categories];
 $('#cats').innerHTML=arr.map(c=>`<button class="${state.category===c.id?'active':''}" data-cat="${esc(c.id)}">${esc(c.icon||'')} ${esc(txt(c,'name_ar','name_en'))}</button>`).join('');
 $$('[data-cat]').forEach(b=>b.onclick=()=>{state.category=b.dataset.cat;state.mobileMenuExpanded=false;renderCategories();renderProducts();if(innerWidth<=760)document.querySelector('#products')?.scrollIntoView({behavior:'smooth',block:'start'})});
}
function filteredProducts(){
 let arr=(state.data?.products||[]).filter(p=>state.category==='all'||(p.category_id||p.categoryId)===state.category);
 const q=state.search.trim().toLowerCase();
 if(q)arr=arr.filter(p=>(p.name_ar+' '+p.name_en+' '+(p.description_ar||'')+' '+(p.description_en||'')).toLowerCase().includes(q));
 return arr;
}
function productPrice(p){if(p.orderable===false)return state.lang==='ar'?(p.price_note_ar||'حسب سعر اليوم'):(p.price_note_en||'Market price');return money(p.price)}
function calorieTag(p){return p.calories==null?'':`<span class="calorie-badge">🔥 ${esc(p.calories)} <small>${state.lang==='ar'?'سعرة':'cal'}</small></span>`}
function renderProducts(){
 if(!state.data)return;
 const all=filteredProducts(),isMobile=innerWidth<=760,canCollapse=isMobile&&state.category==='all'&&!state.search.trim(),shown=canCollapse&&!state.mobileMenuExpanded?all.slice(0,12):all;
 $('#resultCount').textContent=(shown.length===all.length?all.length:(shown.length+' / '+all.length))+' '+tr('items');$('#noProducts').classList.toggle('hidden',!!all.length);
 const expand=$('#menuExpandBtn');if(expand){expand.classList.toggle('hidden',!canCollapse||all.length<=12);expand.textContent=state.mobileMenuExpanded?(state.lang==='ar'?'عرض أقل':'Show less'):(state.lang==='ar'?('عرض كل '+all.length+' صنف'):('Show all '+all.length+' items'))}
 $('#products').innerHTML=shown.map(p=>{const c=cat(p.category_id||p.categoryId),image=displayImage(p),canOrder=p.orderable!==false,origin=photoOrigin(p);return `<article class="product-card ${canOrder?'':'market-card'} ${origin.cls}-photo">
 <div class="product-image" data-view="${esc(p.id)}">${remoteImg(image,txt(p,'name_ar','name_en'))}${p.featured?`<span class="featured-badge">★ ${state.lang==='ar'?'مميز':'Featured'}</span>`:''}${calorieTag(p)}</div>
 <div class="product-body"><span class="product-cat">${esc(txt(c,'name_ar','name_en'))}</span><h3>${esc(txt(p,'name_ar','name_en'))}</h3><p class="product-desc">${esc(txt(p,'description_ar','description_en'))}</p>
 <div class="product-footer"><div class="price"><b class="${canOrder?'':'market-price'}">${esc(productPrice(p))}</b>${canOrder?`<small>/ ${esc(txt(p,'unit_ar','unit_en'))}</small>`:''}</div>${canOrder?`<button class="add-btn" aria-label="${tr('add')}" data-add="${esc(p.id)}">+</button>`:`<button class="call-btn" data-view="${esc(p.id)}">☎</button>`}</div><button class="view-btn" data-view="${esc(p.id)}">${tr('view')}</button></div></article>`}).join('');
 $$('[data-add]').forEach(b=>b.onclick=e=>{e.stopPropagation();addToCart(b.dataset.add)});
 $$('[data-view]').forEach(b=>b.onclick=()=>showProduct(b.dataset.view));
 hydrateRemoteImages($('#products'));
}
function showProduct(id){
 const p=product(id);if(!p)return;const c=cat(p.category_id||p.categoryId),canOrder=p.orderable!==false,image=displayImage(p);
 $('#productModalBody').innerHTML=`<div class="product-detail"><div class="product-detail-image">${remoteImg(image,txt(p,'name_ar','name_en'),false)}</div><div class="product-detail-copy"><span class="kicker">${esc(txt(c,'name_ar','name_en'))}</span><h2>${esc(txt(p,'name_ar','name_en'))}</h2>${p.calories!=null?`<div class="detail-calories">🔥 ${esc(p.calories)} ${state.lang==='ar'?'سعرة حرارية':'calories'}</div>`:''}<p>${esc(txt(p,'description_ar','description_en'))}</p><div class="price"><b>${esc(productPrice(p))}</b>${canOrder?`<small>/ ${esc(txt(p,'unit_ar','unit_en'))}</small>`:''}</div>${canOrder?`<button class="checkout add-detail" data-detail-add="${esc(p.id)}">${tr('add')}</button>`:`<a class="checkout market-contact" href="tel:${esc(state.data.settings?.phone||'0541064143')}">${state.lang==='ar'?'اتصل لمعرفة سعر اليوم':'Call for today’s price'}</a>`}</div></div>`;
 hydrateRemoteImages($('#productModalBody'));
 const add=$('[data-detail-add]');if(add)add.onclick=()=>{addToCart(id);closeAll();open('#cartDrawer')};open('#productModal');
}
function addToCart(id){const p=product(id);if(!p||p.orderable===false||+p.price<=0)return toast(state.lang==='ar'?'هذا الصنف بسعر اليوم، تواصل مع المطعم':'This item is market price. Contact the restaurant.',true);state.cart[id]=(state.cart[id]||0)+1;saveCart();toast(tr('added'))}
function renderCart(){
 if(!state.data)return;for(const id of Object.keys(state.cart)){const p=product(id);if(!p||p.orderable===false||state.cart[id]<=0)delete state.cart[id]}
 const entries=Object.entries(state.cart);const count=cartQty();$('#cartCount').textContent=count;$('#floatingCount').textContent=count;if($('#mobileCartCount'))$('#mobileCartCount').textContent=count;$('#floatingCart').classList.toggle('hidden',count===0);
 const t=totals();$('#floatingTotal').textContent=money(t.sub);
 $('#cartEmpty').classList.toggle('hidden',entries.length>0);$('#cartTotals').classList.toggle('hidden',entries.length===0);
 $('#cartItems').innerHTML=entries.map(([id,q])=>{const p=product(id),image=displayImage(p);return `<div class="cart-row">${remoteImg(image,'',false)}<div><h4>${esc(txt(p,'name_ar','name_en'))}</h4><small>${money(p.price)}</small></div><div class="qty"><button data-minus="${id}">−</button><b>${q}</b><button data-plus="${id}">+</button></div></div>`}).join('');
 hydrateRemoteImages($('#cartItems'));
 $$('[data-minus]').forEach(b=>b.onclick=()=>{state.cart[b.dataset.minus]--;if(state.cart[b.dataset.minus]<=0)delete state.cart[b.dataset.minus];saveCart()});
 $$('[data-plus]').forEach(b=>b.onclick=()=>{state.cart[b.dataset.plus]++;saveCart()});
 $('#subTotal').textContent=money(t.sub);$('#deliveryFee').textContent='—';$('#grandTotal').textContent=money(t.sub);$('#checkoutTotal').textContent=money(t.total);
}
function updateCheckoutTotal(){const type=document.querySelector('input[name="orderType"]:checked')?.value||'pickup',t=totals(type);$('#checkoutTotal').textContent=money(t.total);$('#deliveryFee').textContent=type==='delivery'?money(t.fee):'—';$('#grandTotal').textContent=money(t.total);$('#addressField').classList.toggle('hidden',type!=='delivery');$('#addressField textarea').required=type==='delivery'}
async function placeOrder(e){
 e.preventDefault();const form=new FormData(e.currentTarget),type=form.get('orderType'),t=totals(type),minimum=+(state.data.settings.minimumOrder||0);
 if(!cartQty())return toast(tr('emptyCart'),true);if(t.sub<minimum)return toast(tr('minimum')+': '+money(minimum),true);
 const draft={customerName:form.get('customerName'),phone:form.get('phone'),orderType:type,address:form.get('address')||'',notes:form.get('notes')||'',paymentMethod:form.get('paymentMethod')||'cod',items:Object.entries(state.cart).map(([productId,qty])=>({productId,qty}))},fingerprint=JSON.stringify(draft);if(!state.checkoutKey||state.checkoutFingerprint!==fingerprint){state.checkoutKey=crypto.randomUUID?crypto.randomUUID():(Date.now()+'-'+Math.random().toString(36).slice(2));state.checkoutFingerprint=fingerprint}const payload={...draft,clientRequestId:state.checkoutKey};
 const btn=$('#placeOrderBtn'),old=btn.textContent;btn.disabled=true;btn.textContent=tr('loading');
 try{const r=await fetch('/api/orders',{method:'POST',headers:{'content-type':'application/json','idempotency-key':state.checkoutKey},body:JSON.stringify(payload)}),j=await r.json();if(!r.ok)throw Error(j.error||tr('orderFailed'));
 state.lastOrder={...j.order,phone:payload.phone};localStorage.setItem('sf_last_order',JSON.stringify(state.lastOrder));state.cart={};state.checkoutKey=null;state.checkoutFingerprint=null;saveCart();$('#successNo').textContent=j.order.orderNumber;closeAll();open('#successModal');
 }catch(err){toast(err.message,true)}finally{btn.disabled=false;btn.textContent=old}
}
function trackingLink(){if(!state.lastOrder)return'';return location.origin+'/?track='+encodeURIComponent(state.lastOrder.trackingToken)+'&phone='+encodeURIComponent(state.lastOrder.phone)}
async function trackOrder(token,phone){
 const r=await fetch('/api/orders/track/'+encodeURIComponent(token)+'?phone='+encodeURIComponent(phone)),j=await r.json();if(!r.ok)throw Error(j.error||'Not found');renderTracking(j.order);return j.order
}
function renderTracking(o){
 const statuses=['PENDING','CONFIRMED','PREPARING','READY','COMPLETED'],terminal=['REJECTED','CANCELLED'].includes(o.status),current=statuses.indexOf(o.status);
 const timeline=terminal?`<div class="timeline-row done"><i></i><div><b>${statusLabel(o.status)}</b>${o.statusNote?`<small> · ${esc(o.statusNote)}</small>`:''}</div></div>`:statuses.map((s,i)=>`<div class="timeline-row ${i<=current?'done':''}"><i></i><div><b>${statusLabel(s)}</b></div></div>`).join('');
 $('#trackResult').innerHTML=`<div class="track-card"><span class="status-pill">${statusLabel(o.status)}</span><h3>${esc(o.orderNumber)}</h3><p>${tr('total')}: <b>${money(o.total)}</b></p>${o.estimatedMinutes?`<p>${tr('estimated')}: <b>${o.estimatedMinutes} ${tr('minutes')}</b></p>`:''}${o.statusNote?`<p>${esc(o.statusNote)}</p>`:''}<div class="timeline">${timeline}</div></div>`;
}
async function load(){
 $('#loadError')?.classList.add('hidden');$('#loading')?.classList.remove('hide');
 try{const r=await fetch('/api/public',{headers:{accept:'application/json'},cache:'no-store'});if(!r.ok)throw Error('Menu unavailable');state.data=await r.json();applyLanguage();renderCart();const qs=new URLSearchParams(location.search);if(qs.get('track')){open('#trackModal');$('#trackToken').value=qs.get('track');$('#trackPhone').value=qs.get('phone')||'';if(qs.get('phone'))$('#trackForm').requestSubmit()}}
 catch(e){console.error('MENU_LOAD_FAILED',e);reportClientError('menu_load_failed',e?.message||String(e),e?.stack||'');toast(e.message,true);$('#loadError')?.classList.remove('hidden')}finally{setTimeout(()=>$('#loading')?.classList.add('hide'),180)}
}
$('#langBtn').onclick=()=>{state.lang=state.lang==='ar'?'en':'ar';localStorage.setItem('sf_lang',state.lang);applyLanguage()};if($('#retryBtn'))$('#retryBtn').onclick=load;
$('#searchInput').oninput=e=>{state.search=e.target.value;state.mobileMenuExpanded=true;renderProducts()};if($('#menuExpandBtn'))$('#menuExpandBtn').onclick=()=>{state.mobileMenuExpanded=!state.mobileMenuExpanded;renderProducts();if(!state.mobileMenuExpanded)document.querySelector('#menu')?.scrollIntoView({behavior:'smooth',block:'start'})};window.addEventListener('resize',()=>renderProducts());
$('#cartBtn').onclick=()=>open('#cartDrawer');$('#floatingCart').onclick=()=>open('#cartDrawer');$('#trackBtn').onclick=()=>open('#trackModal');if($('#mobileCartBtn'))$('#mobileCartBtn').onclick=()=>open('#cartDrawer');if($('#mobileTrackBtn'))$('#mobileTrackBtn').onclick=()=>open('#trackModal');
$$('[data-close]').forEach(x=>x.onclick=closeAll);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll()});
$('#checkoutBtn').onclick=()=>{if(!cartQty())return toast(tr('emptyCart'),true);if(state.data.settings.acceptingOrders===false)return toast(tr('closed'),true);state.checkoutKey=state.checkoutKey||(crypto.randomUUID?crypto.randomUUID():(Date.now()+'-'+Math.random().toString(36).slice(2)));closeAll();open('#checkoutModal');updateCheckoutTotal()};
$$('input[name="orderType"]').forEach(x=>x.onchange=updateCheckoutTotal);$('#checkoutForm').onsubmit=placeOrder;
$('#trackForm').onsubmit=async e=>{e.preventDefault();try{await trackOrder($('#trackToken').value,$('#trackPhone').value)}catch(err){toast(err.message,true)}};
$('#trackNow').onclick=()=>{const o=state.lastOrder;if(!o)return;closeAll();open('#trackModal');$('#trackToken').value=o.trackingToken;$('#trackPhone').value=o.phone;$('#trackForm').requestSubmit()};
$('#offerPrev').onclick=()=>$('#offersGrid').scrollBy({left:-320,behavior:'smooth'});$('#offerNext').onclick=()=>$('#offersGrid').scrollBy({left:320,behavior:'smooth'});
if('serviceWorker'in navigator)window.addEventListener('load',async()=>{try{if('caches'in window){const ks=await caches.keys();await Promise.all(ks.filter(k=>k.startsWith('shrimp-fins-')&&k!=='shrimp-fins-v19').map(k=>caches.delete(k)))}await navigator.serviceWorker.register('/sw.js?v=19',{updateViaCache:'none'})}catch{}});
let loadedBuild='';
async function checkForNewBuild(){
 try{
  const r=await fetch('/api/version',{cache:'no-store',headers:{accept:'application/json'}});
  if(!r.ok)return;
  const j=await r.json(),next=String(j.build||'');
  if(!next)return;
  if(!loadedBuild){loadedBuild=next;return}
  if(next!==loadedBuild){
   try{const reg=await navigator.serviceWorker?.getRegistration();await reg?.update()}catch{}
   location.reload();
  }
 }catch{}
}
checkForNewBuild();
setInterval(checkForNewBuild,300000);

state.lastOrder=JSON.parse(localStorage.getItem('sf_last_order')||'null');
initHeroPhotos();
load();