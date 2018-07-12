

var offlineFetch = function () {
  const lastSync = localStorage.getItem('offlineLastSync');

  HTTP.get('/_rest/offlineTournaments.json?accessToken=' + Meteor.user().profile.downloadToken + (update ? '&since=' + lastSync.toISOString() : ''), {
    beforeSend(xhr) {
      xhr.onloadend = (evt) => {
        console.log('finished fetching offline data');
      };
      xhr.onprogress = (evt) => {
        if (evt.lengthComputable) {
          console.log('fetching offline data', ((evt.loaded / evt.total) * 100) + '%');
        } else { console.log('fetching offline data', (evt.loaded / 1000).toFixed(0) + ' kB'); }
      };
    },
  }, (err, res) => {
    if (!err && res.data) {
      if (update) {
        console.log('loaded update data from server', res.data.tournaments.length);
        res.data.tournaments.forEach(t => UltiSite.offlineUpdateTournament(t, true));
        res.data.teams.forEach(t => UltiSite.offlineUpdateTeam(t, true));
        res.data.removed.forEach((removed) => {
          UltiSite['offlineRemove' + removed.type](removed._id, true);
        });
        localForage.setItem('Tournaments', UltiSite.offlineTournaments);
        localForage.setItem('Teams', UltiSite.offlineTeams);
      } else {
        console.log('loaded full data from server:', res.data.tournaments.length, res.data.teams.length);
        localForage.setItem('Tournaments', res.data.tournaments);
        localForage.setItem('Teams', res.data.teams);
      }
      localStorage.setItem('offlineLastSync', moment().toISOString());
      localForage.getItem('offlineSyncHistory', (err, data) => {
        const history = (data || []);
        history.push({
          date: new Date(),
          lastSync: lastSync.toISOString(),
          type: update ? 'update' : 'full',
          tournaments: res.data.tournaments.length,
          teams: res.data.teams.length,
        });
        localForage.setItem('offlineSyncHistory', history);
      });
      UltiSite.offlineFetchDependency.changed();
    } else if (err) {
      UltiSite.notify(err, 'error');
      localForage.getItem('offlineSyncHistory', (err, data) => {
        const history = (data || []);
        history.push({
          date: new Date(),
          lastSync: lastSync.toISOString(),
          type: update ? 'update' : 'full',
          error: err,
        });
        localForage.setItem('offlineSyncHistory', history);
      });
    } else { UltiSite.notify('Es konnten keine Daten abgerufen werden', 'warning'); }
  });
};


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
