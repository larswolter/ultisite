/*eslint-disable */

; (function (self) {
  'use strict';
  var CACHE_NAME = 'ultisitefiles';
  var pages = ['/', '/man.webmanifest'];
  var origin = self.location.origin;

  self.addEventListener('install', function (event) {
    self.skipWaiting();
    console.log('installing service worker');
  });


  self.addEventListener('fetch', function (event) {
    if (event.request.url.indexOf('_image') >= 0) {
      event.respondWith(fetch(event.request));
    } else if (event.request.url.indexOf('_rest') >= 0) {
      event.respondWith(fetch(event.request));
    } else {
      const cacheRequest = event.request.clone();
      event.respondWith(
        caches.match(event.request).then(function (cacheResponse) {
          if (cacheResponse) {
            /*            if(rootUrl) {
                          fetch(event.request).then(function (response) {
                            console.log('fetched and storing to cache', event.request.url);
                            const cacheResponse = response.clone();
                            caches.open(CACHE_NAME).then(function (cache) {
                              cache.put(cacheRequest, cacheResponse);
                            });              
                        }*/
            return cacheResponse;
          } else {
            return fetch(event.request).then(function (response) {
              console.log('fetched and storing to cache', event.request.url);
              const cacheResponse = response.clone();
              caches.open(CACHE_NAME).then(function (cache) {
                cache.put(cacheRequest, cacheResponse);
              });
              return response;
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
        return caches.delete(cacheName).catch(function () {
          return;
        });
      }));
    }));
  });
})(this);