// Desi Dokan service worker v9
// Fixes Safari error: "response served by service worker has redirection"
const C = "desidokan-v9";

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(C)
      .then(c => c.addAll(["index.html", "manifest.json"]))
      .catch(() => {})
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Safari refuses any response with redirected=true. Re-wrap it into a fresh Response.
function clean(r) {
  if (!r || !r.redirected) return r;
  return r.blob().then(b => new Response(b, {
    status: r.status,
    statusText: r.statusText,
    headers: r.headers
  }));
}

// Only store good, same-origin, non-redirected responses.
function put(req, r) {
  if (r && r.ok && !r.redirected && r.type === "basic") {
    const copy = r.clone();
    caches.open(C).then(c => c.put(req, copy)).catch(() => {});
  }
  return r;
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (u.origin !== location.origin) return;
  if (/admin\.html$/.test(u.pathname)) return;
  if (req.referrer && /admin\.html/.test(req.referrer)) return;

  // Pages: network first, cache only if offline
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(clean)
        .catch(() => caches.match("index.html").then(clean))
    );
    return;
  }

  // Images: cache first
  if (u.pathname.indexOf("/img/") > -1) {
    e.respondWith(
      caches.match(req).then(m => m || fetch(req).then(r => put(req, r)))
    );
    return;
  }

  // Everything else: cache first, refresh in background
  e.respondWith(
    caches.match(req).then(m => {
      const net = fetch(req).then(r => put(req, r)).catch(() => m);
      return m || net;
    })
  );
});
