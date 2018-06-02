/*eslint-disable */

; (function (self) {
  'use strict';
  var CACHE_NAME = 'ultisitefiles';
  var origin = self.location.origin;

  self.addEventListener('install', function (event) {
    self.skipWaiting();
    console.log('installing service worker');
    caches.open(CACHE_NAME).then(function (cache) {
      cache.add('/').then(function () {
        console.log('cached main route');
      });;
    });
  });


  self.addEventListener('fetch', function (event) {
    if (event.request.url.indexOf('_image') >= 0) {
      event.respondWith(fetch(event.request));
    } else if (event.request.method !== 'GET') {
      event.respondWith(fetch(event.request));
    } else if (event.request.url.indexOf('_rest') >= 0) {
      event.respondWith(fetch(event.request));
    } else {
      event.respondWith(
        caches.match(event.request).then(function (cacheResponse) {
          if (cacheResponse) {
            return cacheResponse;
          } else {
            return fetch(event.request).then(function (response) {
              if (event.request.url.indexOf('.') > 0) {
                console.log('fetched and storing to cache', event.request.url);
                const cacheResponse = response.clone();
                caches.open(CACHE_NAME).then(function (cache) {
                  cache.put(event.request, cacheResponse);
                });
              }
              return response;
            }).catch(function (err) {
              if (event.request.url.indexOf('.') < 0) {
                return caches.match('/').then(function (root) {
                  return root;
                });
              }
            });
          }
        })
      );
    }
  });
  self.addEventListener('sync', function (event) {
    console.log('syncing....');
  });
  self.addEventListener('activate', function (event) {
    event.waitUntil(caches.keys().then(function (cacheNames) {
      return Promise.all(cacheNames.map(function (cacheName) {
        if (cacheName === CACHE_NAME) {
          return;
        }
        return caches.delete(cacheName).catch(function () {
          return;
        });
      }));
    }));
  });
})(this);