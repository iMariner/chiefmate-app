// Offline cache for Chief Mate Study. Bump CACHE when content or code changes.
var CACHE = "chiefmate-app-v3";
var FILES = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "content.js",
  "manifest.json",
  "icon.svg"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) { return cache.addAll(FILES); }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function (hit) {
      return hit || fetch(event.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(event.request, copy); });
        return res;
      }).catch(function () { return caches.match("index.html"); });
    })
  );
});
