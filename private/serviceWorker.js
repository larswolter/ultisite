/* eslint-env worker */

const CACHE_NAME = 'CURRENT_CACHE_NAME';

self.addEventListener('install', function (event) {
  console.log('SW-installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(
        'FILES_TO_CACHE'
      ).then(() => {
        console.log('SW-installed service worker', CACHE_NAME);
        return Promise.resolve();
      });
    }));
});

self.addEventListener('fetch', function (event) {
  if ((event.request.method === 'POST') || (event.request.url.indexOf('/sockjs') > 0)) {
    return fetch(event.request).catch(function () {
      return new Response('no network', { status: 404 });
    });
  }
  event.respondWith(
    caches.match(event.request).then(function (resp) {
      return resp || fetch(event.request);
    }).catch(function () {
      return caches.match('/');
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
          console.log('SW-removing old cache:', key);
          return caches.delete(key);
        }
        return Promise.resolve();
      }));
    })
  );
});
