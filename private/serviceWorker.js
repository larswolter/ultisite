/* eslint-disable no-restricted-globals */
/* eslint-env serviceworker */
/* global workbox, localforage */

importScripts('/workbox/workbox-sw.js');

workbox.setConfig({ modulePathPrefix: '/workbox', debug: true });
workbox.loadModule('workbox-expiration');

const { core } = workbox;

workbox.precaching.precacheAndRoute('FILES_TO_CACHE', {
  ignoreURLParametersMatching: [/.*/],
  directoryIndex: null,
  cleanUrls: false,
});

workbox.routing.registerRoute('/', new workbox.strategies.StaleWhileRevalidate());

workbox.routing.setCatchHandler(({ event }) => {
  console.log('MyCatch:', event.request.destination, event.request.mode);
  if (event.request.mode === 'navigation' || event.request.mode === 'navigate') {
    console.log('Delivering /');
    return caches.match(workbox.precaching.getCacheKeyForURL('/'));
  }

  return Response.error();
});


workbox.routing.registerRoute(
  new RegExp('/dynamicAppIcon'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'images',
  })
);

workbox.routing.registerRoute(new RegExp('/sockjs/'), new workbox.strategies.NetworkOnly());

workbox.routing.registerRoute(
  /\.(?:png|gif|jpg|jpeg|svg)$/,
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

workbox.routing.setDefaultHandler(new workbox.strategies.NetworkOnly());
workbox.routing.setDefaultHandler(new workbox.strategies.NetworkOnly(), 'POST');

addEventListener('message', (event) => {
  console.log('got message', event.data, event.clientId);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('doing skip waiting');
    this.skipWaiting();
  }
});
