const CACHE='porter-control-v37';
const ASSETS=['./','index.html','manifest.json','milk-semi.svg','milk-oat.svg','connection-bootstrap.js','shared-inventory-fix.js','shared-inspections.js','shared-missing.js','shared-containers.js','team-shifts.js','supervisory-view.js','team-messages.js','team-login.js'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',e=>{
 if(e.request.mode==='navigate'){
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(async r=>{
   const ct=r.headers.get('content-type')||'';if(!ct.includes('text/html'))return r;
   let html=await r.text();
   const scripts=['connection-bootstrap.js?v=2','shared-inventory-fix.js?v=2','shared-inspections.js?v=2','shared-missing.js?v=3','shared-containers.js?v=5','team-shifts.js?v=4','supervisory-view.js?v=8','team-messages.js?v=2','team-login.js?v=2'];
   scripts.forEach(src=>{const file=src.split('?')[0];const re=new RegExp('<script[^>]+src=["\\\'][^"\\\']*'+file.replace('.','\\.')+'[^"\\\']*["\\\'][^>]*><\\/script>','gi');html=html.replace(re,'');html=html.replace('</body>','<script src="'+src+'"></script></body>')});
   return new Response(html,{status:r.status,statusText:r.statusText,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store, no-cache, must-revalidate'}});
  }).catch(()=>caches.match('./')));return;
 }
 e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match(e.request)));
});