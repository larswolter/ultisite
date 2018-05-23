/*eslint-disable */

; (function (self) {
  'use strict';
  var CACHE_NAME = 'meteorfiles_v3';
  var pages = ['/', '/man.webmanifest'];
  var origin = self.location.origin;
  var RE = {
    method: /GET/i,
    static: /\.(?:png|jpe?g|css|js|gif|webm|webp|eot|svg|ttf|woff|woff2)(?:\?[a-zA-Z0-9-._~:/#\[\]@!$&'()*+,;=]*)?$|(?:fonts\.googleapis\.com|gstatic\.com)/i,
    sockjs: /\/sockjs\//
  };

  self.addEventListener('install', function (event) {
    self.skipWaiting();
    event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
      cache.addAll(pages);
    }));
  });


  self.addEventListener('fetch', function(event) {
    event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || fetch(event.request);
      })
    );
  });/*  
  self.addEventListener('fetch', function (event) {
    self.clients.claim();

    if (RE.method.test(event.request.method) && !RE.sockjs.test(event.request.url) && !event.request.headers.get('Range')) {
      var req = event.request.clone();
      var uri = event.request.url.replace(origin, '');

      event.respondWith(fetch(req).then(function (response) {
        if ((!!~pages.indexOf(uri) || RE.static.test(event.request.url)) && response.status === 200) {
          var resp = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(req, resp);
          });
        }
        return response;
      }).catch(function () {
        return caches.match(req).then(function (cached) {
          return cached || caches.match('/').catch(function () {
            return fetch(req);
          });
        }).catch(function () {
          return caches.match('/').catch(function () {
            return fetch(req);
          });
        });
      }));
    }
  });
  */
  self.addEventListener('sync', function (event) {
    console.log('syncing....');
  });
  self.addEventListener('activate', function (event) {
    event.waitUntil(caches.keys().then(function (cacheNames) {
      return Promise.all(cacheNames.map(function (cacheName) {
        return caches.delete(cacheName).catch(function () {
          return;
        });
      }));
    }));
  });
})(this);