/* ShuTongBuddy 在线书 Service Worker：缓存页面，支持离线阅读 */
var CACHE = 'stb-book-v1';

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (k) {
            return k !== CACHE;
          })
          .map(function (k) {
            return caches.delete(k);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  // 网络优先，成功则回填缓存；失败则回落到缓存（离线阅读）
  e.respondWith(
    fetch(req)
      .then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var clone = res.clone();
          caches.open(CACHE).then(function (c) {
            c.put(req, clone);
          });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match(new URL('./', self.location.href).href);
        });
      })
  );
});
