/* eslint-env worker */

importScripts('/workbox-v4.0.0/workbox-sw.js');

workbox.setConfig({ modulePathPrefix: '/workbox-v4.0.0' });

const { core } = workbox;

workbox.precaching.precacheAndRoute(
  'FILES_TO_CACHE',
  {
    ignoreURLParametersMatching: [/.*/],
    directoryIndex: null,
    cleanUrls: false,
  }
);

workbox.routing.registerRoute(
  /\.(?:png|gif|jpg|jpeg|svg)$/,
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

workbox.routing.registerRoute(
  /\/dynamicAppIcon/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'images',
  })
);

workbox.routing.registerRoute(
  new RegExp('/sockjs/'),
  new workbox.strategies.NetworkOnly()
);

addEventListener('message', (event) => {
  console.log('got message', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('doing skip waiting');
    core.skipWaiting();
  }
});

/*
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
  if (!(event.request.method === 'POST') && !(event.request.url.indexOf('/sockjs') > 0)) {
    event.respondWith(
      caches.match(event.request).then(function (resp) {
        return resp || fetch(event.request);
      }).catch(function () {
        return caches.match('/');
      })
    );
  }
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
*/
