const C="desidokan-v7";
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(["./","index.html","manifest.json"]).catch(()=>{})))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
const put=(q,r)=>{if(r&&r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(q,cp))}return r};
self.addEventListener("fetch",e=>{
const q=e.request;if(q.method!=="GET")return;
const u=new URL(q.url);if(u.origin!==location.origin)return;
if(/admin\.html$/.test(u.pathname)||(q.referrer&&/admin\.html/.test(q.referrer)))return;
// images are hashed/immutable: cache first = instant, works offline
if(u.pathname.indexOf("/img/")>-1){e.respondWith(caches.match(q).then(m=>m||fetch(q).then(r=>put(q,r))));return}
// page + other files: show cached copy instantly, refresh in background
e.respondWith(caches.match(q).then(m=>{const n=fetch(q).then(r=>put(q,r)).catch(()=>m||caches.match("index.html"));return m||n}))});
