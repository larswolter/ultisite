/* eslint-env worker */

importScripts('/workbox-v4.0.0/workbox-sw.js');

workbox.setConfig({ modulePathPrefix: '/workbox-v4.0.0' });

const { core } = workbox;
const FALLBACK_IMAGE_URL = '/placeholder/404.png';

workbox.precaching.precacheAndRoute(
  'FILES_TO_CACHE',
  {
    ignoreURLParametersMatching: [/.*/],
    directoryIndex: null,
    cleanUrls: false,
  }
);

workbox.routing.registerRoute(
  '/',
  new workbox.strategies.StaleWhileRevalidate()
);

workbox.routing.setCatchHandler(({ event }) => {
  console.log('MyCatch:', event.request.destination, event.request.mode);
  if ((event.request.mode === 'navigation') || (event.request.mode === 'navigate')) {
    return caches.match('/');
  }
  switch (event.request.destination) {
  case 'image':
    return caches.match(workbox.precaching.getCacheKeyForURL(FALLBACK_IMAGE_URL));
  default:
      // If we don't have a fallback, just return an error response.
    return Response.error();
  }
});
workbox.routing.registerRoute(
  /\.(?:png|gif|jpg|jpeg|svg|_image)$/,
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 60,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

workbox.routing.registerRoute(
  '/chrome-manifest',
  new workbox.strategies.StaleWhileRevalidate()
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

workbox.routing.setDefaultHandler(new workbox.strategies.NetworkOnly());

addEventListener('message', (event) => {
  console.log('got message', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('doing skip waiting');
    core.skipWaiting();
  }
});

