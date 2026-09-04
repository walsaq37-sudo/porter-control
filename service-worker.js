const CACHE='porter-control-v23';
const ASSETS=['./','index.html','manifest.json','milk-semi.svg','milk-oat.svg','shared-inspections.js','shared-missing.js','shared-containers.js','team-shifts.js'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',e=>{
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(async r=>{
      const ct=r.headers.get('content-type')||'';
      if(!ct.includes('text/html'))return r;
      let html=await r.text();
      if(!html.includes('shared-inspections.js'))html=html.replace('</body>','<script src="shared-inspections.js?v=1"></script></body>');
      if(!html.includes('shared-missing.js'))html=html.replace('</body>','<script src="shared-missing.js?v=1"></script></body>');
      if(!html.includes('shared-containers.js'))html=html.replace('</body>','<script src="shared-containers.js?v=1"></script></body>');
      if(!html.includes('team-shifts.js'))html=html.replace('</body>','<script src="team-shifts.js?v=2"></script></body>');
      return new Response(html,{status:r.status,statusText:r.statusText,headers:{'content-type':'text/html; charset=utf-8'}});
    }).catch(()=>caches.match('./')));
    return;
  }
  e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match(e.request)));
});
