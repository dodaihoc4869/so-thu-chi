const PREFIX = "so-thu-chi-hh-";
const CACHE = PREFIX + "v9";
const ASSETS = ["./", "./index.html", "./manifest.json",
                "./icon-192.png?v=2", "./icon-512.png?v=2", "./icon-maskable-512.png?v=2"];

self.addEventListener("install", e => {
  // cache:"reload" -> luon lay ban moi tu mang, khong dinh ban cu trong HTTP cache
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  // chi xoa cache cu CUA CHINH APP NAY, khong dung vao cache cua app khac cung origin
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIX) && k !== CACHE)
                              .map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const isNav = e.request.mode === "navigate";
  if (isNav) {
    // network-first cho trang: co mang thi luon thay ban moi nhat
    e.respondWith(fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put("./index.html", copy));
      return res;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      try {
        if (res && res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
      } catch (err) {}
      return res;
    }).catch(() => Response.error()))
  );
});
