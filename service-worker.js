const CACHE='porter-control-v12';
const ASSETS=['./','index.html','manifest.json','milk-semi.svg','milk-oat.svg'];

const OLD_DEF="'17':{title:'🍽️ Store 17',subtitle:'Dishwasher & kitchen supplies',items:['Dishwasher salt','Dishwasher tablets','Dishwasher cleaner','Magic sponge','Green scourer','Green sponge with foam']}";
const NEW_DEF="'17':{title:'🍽️ Store 17',subtitle:'10 cleaning & kitchen products',items:['Magic sponge','Green scourer','Green sponge with foam','Crystal','Finish','Finish lavado','Viakal','Crystal & metal','Foaming descaler','Spot light']}";

const OLD_GET="function getStore(id){const saved=getJSON(storeKey(id),null),def=storeDefs[id];if(saved)return saved;const data={items:def.items.map(name=>({name,qty:0}))};setJSON(storeKey(id),data);return data}";
const NEW_GET="function getStore(id){const saved=getJSON(storeKey(id),null),def=storeDefs[id];if(id==='17'){const initial={'Magic sponge':70,'Green scourer':30,'Green sponge with foam':40,'Crystal':5,'Finish':8,'Finish lavado':19,'Viakal':5,'Crystal & metal':1,'Foaming descaler':3,'Spot light':3};const old=Object.fromEntries(((saved&&saved.items)||[]).map(x=>[x.name,x.qty]));const valid=def.items.map(name=>({name,qty:Object.prototype.hasOwnProperty.call(old,name)?old[name]:initial[name]}));const needs=!saved||saved.items.length!==valid.length||saved.items.some((x,i)=>!valid[i]||x.name!==valid[i].name);if(needs){const data={items:valid};setJSON(storeKey(id),data);return data}return saved}if(saved)return saved;const data={items:def.items.map(name=>({name,qty:0}))};setJSON(storeKey(id),data);return data}";

function patchIndex(text){
  return text.replace(OLD_DEF,NEW_DEF).replace(OLD_GET,NEW_GET);
}

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener('activate',e=>e.waitUntil(Promise.all([
  self.clients.claim(),
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
])));

self.addEventListener('fetch',e=>{
  if(e.request.mode==='navigate'){
    e.respondWith((async()=>{
      try{
        const r=await fetch(e.request,{cache:'no-store'});
        const text=patchIndex(await r.text());
        return new Response(text,{status:r.status,statusText:r.statusText,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
      }catch(err){
        const cached=await caches.match('index.html')||await caches.match('./');
        if(!cached)throw err;
        return new Response(patchIndex(await cached.text()),{headers:{'Content-Type':'text/html; charset=utf-8'}});
      }
    })());
    return;
  }
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});
