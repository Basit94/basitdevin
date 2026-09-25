const CACHE='shrimp-fins-v17';
const CORE=['/','/styles.css?v=17','/app.js?v=17','/manifest.webmanifest','/admin','/admin.css','/admin.js','/assets/storefront.svg?v=17','/assets/shrimp-fins-promo.webp?v=17','/favicon.svg?v=17'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{
 const keys=await caches.keys();
 const old=keys.filter(k=>k.startsWith('shrimp-fins-')&&k!==CACHE);
 await Promise.all(old.map(k=>caches.delete(k)));
 await self.clients.claim();
 if(old.length){
   const wins=await self.clients.matchAll({type:'window',includeUncontrolled:true});
   for(const c of wins){
     try{const u=new URL(c.url);if(u.origin===self.location.origin&&(u.pathname==='/'||u.pathname==='/index.html'))await c.navigate(c.url)}catch{}
   }
 }
})())});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const u=new URL(e.request.url);
 if(u.origin!==location.origin||u.pathname.startsWith('/api/'))return;
 e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('/'))));
});