const deleteCache = async (key) => {
  await caches.delete(key);
};

const deleteOldCaches = async () => {
  const keyList = await caches.keys();
  await Promise.all(keyList.map(deleteCache));
};
self.addEventListener('install', (event) => {
  console.log('installed dummy service-worker');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(deleteOldCaches());
});
