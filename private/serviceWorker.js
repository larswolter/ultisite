
const CACHE_NAME = 'CURRENT_CACHE_NAME';

self.addEventListener('install', function (event) {
  console.log('installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.add('/').then(function () {
        console.log('installed service worker');
      });
    }));
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (resp) {
      return resp || fetch(event.request).then(function (response) {
        return caches.open(CACHE_NAME).then(function (cache) {
          if (event.request.method === 'GET') {
            console.log('SW-AddToCache:', event.request.method, event.request.url);
            cache.put(event.request, response.clone());
          }
          return response;
        });
      });
    }).catch(function () {
      return caches.match('/sw-test/gallery/myLittleVader.jpg');
    })
  );
});
self.addEventListener('sync', function (event) {
  console.log('syncing....');
});
self.addEventListener('activate', function (event) {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(keyList.map(function (key) {
        if (cacheWhitelist.indexOf(key) === -1) {
          return caches.delete(key);
        }
      }));
    })
  );
});
