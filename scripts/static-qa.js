const fs=require('fs');
const files=['public/app.js','public/admin.js','public/index.html','public/admin.html'];
let failed=false;
for(const file of files){
 const s=fs.readFileSync(file,'utf8');
 const checks=[
  {name:'single-selector forEach',re:/(^|[^$])\$\((['"`])[^'"`\n]*\2\)\.forEach/g},
  {name:'debugger statement',re:/\bdebugger\s*;/g},
  {name:'embedded data audio',re:/data:audio\//g},
  {name:'localhost customer URL',re:/https?:\/\/(?:localhost|127\.0\.0\.1)/g}
 ];
 for(const c of checks){const hits=[...s.matchAll(c.re)];if(hits.length){failed=true;console.error(file,c.name,hits.map(x=>x.index))}}
}
const adminJs=fs.readFileSync('public/admin.js','utf8');
if(adminJs.includes('data-order-view')&&!adminJs.includes('dataset.orderView')){
 failed=true;console.error('public/admin.js admin order-view dataset binding missing dataset.orderView');
}
if(/\[data-order-view\][^\n]{0,220}dataset\.order(?:\W|$)/.test(adminJs)){
 failed=true;console.error('public/admin.js admin order-view is incorrectly bound to dataset.order');
}
if(failed)process.exit(1);
console.log('STATIC_QA_PASS');
