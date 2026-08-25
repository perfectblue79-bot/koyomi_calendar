const CACHE_NAME = "kanshi-goyomi-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// HTML/マニフェストは「まずネット経由で最新を取りに行き、失敗したらキャッシュ」にする。
// これで更新のたびに古い表示のまま固定されてしまう問題を防ぐ。
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const isPage = req.mode === "navigate" || req.url.endsWith(".html") || req.url.endsWith("manifest.json");

  if (isPage) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
  } else {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
  }
});
