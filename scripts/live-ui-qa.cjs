const { chromium } = require('playwright');
const fs = require('fs');

const base = process.env.BASE_URL || 'https://shrimp-fins-app-production.up.railway.app';
const out = process.env.QA_OUT || 'qa-artifacts';
fs.mkdirSync(out,{recursive:true});

const report={
  base,
  startedAt:new Date().toISOString(),
  version:null,
  desktop:{},
  mobile:{},
  admin:{},
  network:{badResponses:[],failedRequests:[]},
  consoleErrors:[],
  pageErrors:[],
  assertions:[]
};

function check(name,ok,detail=''){
  report.assertions.push({name,ok:!!ok,detail});
  if(!ok) throw new Error(name+(detail?' | '+detail:''));
}
function recordPage(page,label){
  page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push({label,text:m.text()})});
  page.on('pageerror',e=>report.pageErrors.push({label,message:e.message}));
  page.on('requestfailed',r=>report.network.failedRequests.push({label,url:r.url(),error:r.failure()?.errorText||''}));
  page.on('response',r=>{
    const status=r.status(),url=r.url();
    if(status>=400&&!url.includes('/api/orders/track/'))report.network.badResponses.push({label,status,url});
  });
}
async function waitForApp(page,label){
  const r=await page.goto(base+'/',{waitUntil:'networkidle',timeout:60000});
  check(label+' homepage HTTP 200',r&&r.ok(),String(r?.status()));
  try{
    await page.waitForFunction(()=>{
      const products=document.querySelectorAll('#products .product-card').length;
      const err=document.querySelector('#loadError');
      return products>=60 || (err && !err.classList.contains('hidden'));
    },null,{timeout:30000});
  }catch(e){
    const diag=await page.evaluate(()=>({
      products:document.querySelectorAll('#products .product-card').length,
      loadingClass:document.querySelector('#loading')?.className||'',
      loadErrorClass:document.querySelector('#loadError')?.className||'',
      loadErrorText:document.querySelector('#loadError')?.innerText||'',
      bodyText:(document.body?.innerText||'').slice(0,1200)
    })).catch(()=>({}));
    await page.screenshot({path:out+'/'+label+'-load-failure.png',fullPage:true}).catch(()=>{});
    throw new Error(label+' app did not render: '+JSON.stringify(diag)+' | '+e.message);
  }
  const errVisible=await page.locator('#loadError').isVisible().catch(()=>false);
  check(label+' menu load did not show error panel',!errVisible,errVisible?await page.locator('#loadError').innerText():'');
  const count=await page.locator('#products .product-card').count();
  check(label+' menu rendered at least 60 items',count>=60,String(count));
}
async function imageHealth(page,scope){
  return await page.locator(scope+' img:visible').evaluateAll(imgs=>imgs.map(i=>({src:i.currentSrc||i.src,ok:i.complete&&i.naturalWidth>0,w:i.naturalWidth,h:i.naturalHeight})));
}
async function main(){
  const vr=await fetch(base+'/api/version',{headers:{accept:'application/json'}});
  check('version endpoint',vr.ok,String(vr.status));
  report.version=await vr.json();

  const hr=await fetch(base+'/api/health',{headers:{accept:'application/json'}});
  const health=await hr.json();
  check('health endpoint',hr.ok&&health.ok,JSON.stringify(health));

  const browser=await chromium.launch({headless:true});
  try{
    const desktopContext=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,locale:'ar-SA'});
    const page=await desktopContext.newPage();recordPage(page,'desktop');await waitForApp(page,'desktop');

    report.desktop.title=await page.title();
    report.desktop.productCount=await page.locator('#products .product-card').count();
    report.desktop.offerCount=await page.locator('#offersGrid .offer-card').count();
    report.desktop.categoryCount=await page.locator('#cats button').count();
    report.desktop.dir=await page.locator('html').getAttribute('dir');
    check('desktop 63 products',report.desktop.productCount===63,String(report.desktop.productCount));
    check('desktop 8 offers',report.desktop.offerCount===8,String(report.desktop.offerCount));
    check('desktop 14 category buttons including All',report.desktop.categoryCount===14,String(report.desktop.categoryCount));
    check('Arabic RTL default',report.desktop.dir==='rtl',String(report.desktop.dir));
    check('desktop hero visible',await page.locator('#heroFoodImage').isVisible());
    check('map href rendered',String(await page.locator('#mapBtn').getAttribute('href')).includes('google.com/maps'));
    check('phone link rendered',String(await page.locator('#callBtn').getAttribute('href')).startsWith('tel:'));
    check('WhatsApp link rendered',String(await page.locator('#waBtn').getAttribute('href')).includes('wa.me/'));

    const ids=await page.locator('[id]').evaluateAll(els=>els.map(e=>e.id));
    const duplicates=ids.filter((id,i,a)=>id&&a.indexOf(id)!==i);
    check('no duplicate element IDs',duplicates.length===0,JSON.stringify([...new Set(duplicates)]));

    const images=await imageHealth(page,'body');
    const broken=images.filter(x=>!x.ok);
    report.desktop.visibleImages=images.length;
    report.desktop.brokenImages=broken;
    check('all visible desktop images loaded',broken.length===0,JSON.stringify(broken.slice(0,5)));

    await page.locator('#searchInput').fill('روبيان');
    await page.waitForTimeout(150);
    const searched=await page.locator('#products .product-card').count();
    check('menu search filters results',searched>0&&searched<63,String(searched));
    await page.locator('#searchInput').fill('');
    await page.locator('#cats button').nth(1).click();
    await page.waitForTimeout(100);
    const categoryCount=await page.locator('#products .product-card').count();
    check('category filter works',categoryCount>0&&categoryCount<63,String(categoryCount));
    await page.locator('#cats button').first().click();

    const firstAdd=page.locator('[data-add]').first();
    check('orderable add button exists',await firstAdd.count()===1);
    await firstAdd.click();
    check('cart count increments',(await page.locator('#cartCount').textContent()).trim()==='1',String(await page.locator('#cartCount').textContent()));
    await page.locator('#cartBtn').click();
    check('cart drawer opens',await page.locator('#cartDrawer').isVisible());
    check('cart has item',await page.locator('#cartItems .cart-row').count()===1);
    await page.locator('#checkoutBtn').click();
    check('checkout modal opens',await page.locator('#checkoutModal').isVisible());
    const codInput=page.locator('input[name="paymentMethod"][value="cod"]'),cardInput=page.locator('input[name="paymentMethod"][value="card_on_delivery"]');
    check('cash payment control enabled',await codInput.isEnabled());
    check('cash payment option visible',await codInput.locator('xpath=..').isVisible());
    check('card-on-delivery control enabled',await cardInput.isEnabled());
    check('card-on-delivery option visible',await cardInput.locator('xpath=..').isVisible());

    const deliveryRadio=page.locator('input[name="orderType"][value="delivery"]'),pickupRadio=page.locator('input[name="orderType"][value="pickup"]');
    await deliveryRadio.locator('xpath=..').click();
    check('delivery radio selected',await deliveryRadio.isChecked());
    check('delivery address appears',await page.locator('#addressField').isVisible());
    check('delivery address required',await page.locator('#addressField textarea').getAttribute('required')!==null);
    await pickupRadio.locator('xpath=..').click();
    check('pickup radio selected',await pickupRadio.isChecked());
    check('pickup hides delivery address',!(await page.locator('#addressField').isVisible()));

    await page.screenshot({path:out+'/desktop-checkout.png',fullPage:false});
    await page.locator('#checkoutModal [data-close]').click();
    await page.locator('#langBtn').click();
    check('English language switches LTR',(await page.locator('html').getAttribute('dir'))==='ltr');
    check('English search placeholder',(await page.locator('#searchInput').getAttribute('placeholder')||'').toLowerCase().includes('search'));
    await page.screenshot({path:out+'/desktop-home.png',fullPage:true});
    await desktopContext.close();

    const mobileContext=await browser.newContext({
      viewport:{width:390,height:844},
      deviceScaleFactor:2,
      isMobile:true,
      hasTouch:true,
      locale:'ar-SA',
      userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'
    });
    const mobile=await mobileContext.newPage();recordPage(mobile,'mobile');await waitForApp(mobile,'mobile');
    report.mobile.productCount=await mobile.locator('#products .product-card').count();
    report.mobile.scrollWidth=await mobile.evaluate(()=>document.documentElement.scrollWidth);
    report.mobile.clientWidth=await mobile.evaluate(()=>document.documentElement.clientWidth);
    check('mobile 63 products',report.mobile.productCount===63,String(report.mobile.productCount));
    check('mobile bottom nav visible',await mobile.locator('.mobile-nav').isVisible());
    check('mobile hero visible',await mobile.locator('#heroFoodImage').isVisible());
    check('mobile no horizontal overflow',report.mobile.scrollWidth<=report.mobile.clientWidth+1,JSON.stringify({scrollWidth:report.mobile.scrollWidth,clientWidth:report.mobile.clientWidth}));
    const mimgs=await imageHealth(mobile,'body');
    const mbroken=mimgs.filter(x=>!x.ok);
    report.mobile.visibleImages=mimgs.length;report.mobile.brokenImages=mbroken;
    check('all visible mobile images loaded',mbroken.length===0,JSON.stringify(mbroken.slice(0,5)));
    await mobile.locator('[data-add]').first().click();
    await mobile.locator('#mobileCartBtn').click();
    check('mobile cart opens',await mobile.locator('#cartDrawer').isVisible());
    await mobile.screenshot({path:out+'/mobile-cart.png',fullPage:false});
    await mobile.locator('[data-close]').first().click();
    await mobile.screenshot({path:out+'/mobile-home.png',fullPage:true});
    await mobileContext.close();

    const adminContext=await browser.newContext({viewport:{width:1280,height:900}});
    const admin=await adminContext.newPage();recordPage(admin,'admin');
    const ar=await admin.goto(base+'/admin',{waitUntil:'networkidle',timeout:60000});
    check('admin route HTTP 200',ar&&ar.ok(),String(ar?.status()));
    check('admin login form visible',await admin.locator('#loginForm').isVisible());
    const adminIds=await admin.locator('[id]').evaluateAll(els=>els.map(e=>e.id));
    const adminDup=adminIds.filter((id,i,a)=>id&&a.indexOf(id)!==i);
    check('admin no duplicate IDs',adminDup.length===0,JSON.stringify([...new Set(adminDup)]));
    report.admin.loginVisible=true;
    await admin.screenshot({path:out+'/admin-login.png',fullPage:true});
    await adminContext.close();

    check('no browser page errors',report.pageErrors.length===0,JSON.stringify(report.pageErrors));
    check('no browser console errors',report.consoleErrors.length===0,JSON.stringify(report.consoleErrors));
    check('no failed browser requests',report.network.failedRequests.length===0,JSON.stringify(report.network.failedRequests.slice(0,10)));
    check('no unexpected HTTP 4xx/5xx in browser',report.network.badResponses.length===0,JSON.stringify(report.network.badResponses.slice(0,10)));
  } finally {
    await browser.close();
  }

  report.finishedAt=new Date().toISOString();
  fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
  console.log('LIVE_UI_QA_PASS '+JSON.stringify({
    build:report.version?.build,
    desktopProducts:report.desktop.productCount,
    mobileProducts:report.mobile.productCount,
    offers:report.desktop.offerCount,
    visibleDesktopImages:report.desktop.visibleImages,
    visibleMobileImages:report.mobile.visibleImages,
    assertions:report.assertions.length
  }));
}
main().catch(e=>{
  report.finishedAt=new Date().toISOString();
  report.failure={message:e.message,stack:e.stack};
  try{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2))}catch{}
  console.error('LIVE_UI_QA_FAIL',e);
  process.exit(1);
});
