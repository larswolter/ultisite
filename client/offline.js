import localForage from 'localforage';
import { Meteor } from 'meteor/meteor';
import { Reload } from 'meteor/reload';
import { moment } from 'meteor/momentjs:moment';
import { Workbox, messageSW } from 'workbox-window';

Package.appcache = true;

UltiSite.serviceWorker = null;
UltiSite.offlineTournaments = [];
UltiSite.offlineLastChange = moment().subtract(1, 'year');
UltiSite.checkedLocalStorage = false;
UltiSite.offlineTournamentDependency = new Tracker.Dependency();
UltiSite.offlineFetchDependency = new Tracker.Dependency();

const makeOfflineCollection = function (col) {
  const _super = Meteor.connection._stores[col._collection.name].update;
  Meteor.connection._stores[col._collection.name].update = function (msg) {
    if (msg.id) {
      if (msg.msg === 'added') {
        col._collection.remove(msg.id);
      }
    }
    _super(msg);
  };
};

makeOfflineCollection(Meteor.users);
UltiSite.offlineCollections.forEach((col) => {
  makeOfflineCollection(UltiSite[col.name]);
});

Meteor.methods({
  offlineInitUser(user) {
    check(user, Object);
    Meteor.users.insert(user);
  },
  offlineInitCollections() {
    UltiSite.offlineCollections.forEach((col) => {
      if (UltiSite[col.name].find().count() > 0) return;
      localForage.getItem('ultisiteOffline' + col.name, (err, offline) => {
        if (offline && offline.data) {
          offline.data.forEach((i) =>
            UltiSite[col.name].insert({
              ...i,
              _offline: true,
            })
          );
        }
      });
    });
  },
});

Meteor.startup(function () {
  localForage.getItem('ultisiteOfflineLastSync').then((data) => {
    if (typeof data !== 'object') data = {};
    Tracker.autorun(() => {
      if (Meteor.userId()) {
        UltiSite.lastOfflineSync = data || {};
        console.log('subscribing', UltiSite.lastOfflineSync);
        Meteor.subscribe('lastChangedElements', UltiSite.lastOfflineSync, () => {
          Tracker.autorun(() => {
            UltiSite.offlineCollections.forEach((col) => {
              const elements = UltiSite[col.name].find({
                ...col.filter(),
                _offline: { $exists: false },
                lastChange: { $gte: UltiSite.lastOfflineSync[col.name] || moment().subtract(1, 'year').toDate() },
              });

              console.log('checking offline col', col.name, elements.count(), UltiSite[col.name].find().count());
              if (elements.count() > 0) {
                console.log(`Storing ${elements.count()} elements of ${col.name}`);
                localForage.setItem('ultisiteOffline' + col.name, {
                  data: UltiSite[col.name].find(col.filter()).fetch(),
                });
                UltiSite.lastOfflineSync[col.name] = new Date();
              }
            });
            console.log('Refreshing last sync time');
            localForage.setItem('ultisiteOfflineLastSync', UltiSite.lastOfflineSync);
          });
        });
      }
    });
  });
  Tracker.autorun(() => {
    if (Meteor.userId()) {
      if (Meteor.user()) {
        localForage.setItem('ultisiteUser', Meteor.user());
      }
    } else if (Meteor.status().connected) {
      UltiSite.offlineClear();
    }
  });
  Tracker.autorun((comp) => {
    if (Meteor.userId()) {
      localForage.getItem('ultisiteUser', (err, user) => {
        console.log('go user', user, Meteor.status());
        if (user && !Meteor.status().connected) {
          Meteor.apply('offlineInitUser', [user], { noRetry: true }, (err) => {});
        }
      });
      comp.stop();
    }
  });
  Meteor.apply('offlineInitCollections', [], { noRetry: true }, (err) => {});
});

UltiSite.getTournament = function (id) {
  UltiSite.offlineTournamentDependency.depend();
  const t = UltiSite.Tournaments.findOne(id);
  return t || _.findWhere(this.offlineTournaments, { _id: id });
};
UltiSite.getTournamentByTeam = function (id) {
  UltiSite.offlineTournamentDependency.depend();
  const t =
    UltiSite.Tournaments.findOne({ 'teams._id': id }) ||
    _.find(this.offlineTournaments, (tournament) => _.find(tournament.teams, (te) => te._id === id));
  return t;
};
UltiSite.getTeam = function (id) {
  UltiSite.offlineTournamentDependency.depend();
  const t =
    UltiSite.Tournaments.findOne({ 'teams._id': id }) ||
    _.find(this.offlineTournaments, (tournament) => _.find(tournament.teams, (te) => te._id === id));
  return t && _.find(t.teams, (te) => te._id === id);
};

UltiSite.offlineCheck = function () {
  if (!UltiSite.checkedLocalStorage) {
    return;
  }
  const lastSync = moment(localStorage.getItem('offlineLastSync'));
  Meteor.call('offlineCheckForNew', lastSync.toDate(), (err, info) => {
    if (info.mustSync) {
      UltiSite.offlineFetch();
    }
    if (info.tournamentCount !== this.offlineTournaments.length) {
      UltiSite.offlineFetch();
    }
  });
};

UltiSite.offlineClear = function () {
  localForage.removeItem('ultisiteUser');
  localForage.removeItem('Tournaments', () => {
    this.offlineTournaments = [];
    this.offlineFetchDependency.changed();
  });
};

UltiSite.offlineUpdateTournament = function (tournament, wait) {
  let found = false;
  for (let i = 0; i < this.offlineTournaments.length; i += 1) {
    if (this.offlineTournaments[i]._id === tournament._id) {
      this.offlineTournaments[i] = tournament;
      found = true;
      break;
    }
  }
  if (!found) {
    this.offlineTournaments.push(tournament);
  }
  if (!wait) {
    localForage.setItem('Tournaments', this.offlineTournaments);
  }
};

UltiSite.offlineRemoveTournament = function (id, wait) {
  for (let i = 0; i < this.offlineTournaments.length; i += 1) {
    if (this.offlineTournaments[i]._id === id) {
      this.offlineTournaments.splice(i, 1);
      break;
    }
  }
  if (!wait) {
    localForage.setItem('Tournaments', this.offlineTournaments);
  }
};

UltiSite.offlineFetch = _.throttle((update) => {
  if (!Meteor.user()) {
    return;
  }
  console.log('loading data from server');
  const lastSync = moment(localStorage.getItem('offlineLastSync'));
  if (!lastSync.isValid()) {
    update = false;
  }
  HTTP.get(
    '/_rest/offlineTournaments.json?accessToken=' +
      Meteor.user().profile.downloadToken +
      (update ? '&since=' + lastSync.toISOString() : ''),
    {
      beforeSend(xhr) {
        xhr.onloadend = (evt) => {
          console.log('finished fetching offline data');
        };
        xhr.onprogress = (evt) => {
          if (evt.lengthComputable) {
            console.log('fetching offline data', (evt.loaded / evt.total) * 100 + '%');
          } else {
            console.log('fetching offline data', (evt.loaded / 1000).toFixed(0) + ' kB');
          }
        };
      },
    },
    (err, res) => {
      if (!err && res.data) {
        if (update) {
          console.log('loaded update data from server', res.data.tournaments.length);
          res.data.tournaments.forEach((t) => UltiSite.offlineUpdateTournament(t, true));
          res.data.removed.forEach((removed) => {
            UltiSite['offlineRemove' + removed.type](removed._id, true);
          });
          localForage.setItem('Tournaments', UltiSite.offlineTournaments);
        } else {
          console.log('loaded full data from server:', res.data.tournaments.length);
          localForage.setItem('Tournaments', res.data.tournaments);
        }
        localStorage.setItem('offlineLastSync', moment().toISOString());
        localForage.getItem('offlineSyncHistory', (err, data) => {
          const history = data || [];
          history.push({
            date: new Date(),
            lastSync: lastSync.toISOString(),
            type: update ? 'update' : 'full',
            tournaments: res.data.tournaments.length,
          });
          localForage.setItem('offlineSyncHistory', history);
        });
        UltiSite.offlineFetchDependency.changed();
      } else if (err) {
        UltiSite.notify(err, 'error');
        localForage.getItem('offlineSyncHistory', (err, data) => {
          const history = data || [];
          history.push({
            date: new Date(),
            lastSync: lastSync.toISOString(),
            type: update ? 'update' : 'full',
            error: err,
          });
          localForage.setItem('offlineSyncHistory', history);
        });
      } else {
        UltiSite.notify('Es konnten keine Daten abgerufen werden', 'warning');
      }
    }
  );
}, 1000);

Meteor.startup(function () {
  UltiSite.Tournaments.find().observe({
    added(t) {
      UltiSite.offlineUpdateTournament(t);
    },
    changed(t) {
      UltiSite.offlineUpdateTournament(t);
    },
  });
  Meteor.call('ping');
  Meteor.setInterval(() => {
    Meteor.call('ping');
  }, 30000);

  Tracker.autorun((comp) => {
    UltiSite.offlineFetchDependency.depend();
    localForage.getItem('Tournaments', (err, tournaments) => {
      if (tournaments) {
        UltiSite.offlineTournaments = tournaments.map((t) => {
          t.date = moment(t.date).toDate();
          t.lastChange = moment(t.lastChange).toDate();
          return t;
        });
        UltiSite.offlineTournamentDependency.changed();
        console.log('retrieved tournaments from local storage');
      } else {
        UltiSite.offlineTournaments = [];
      }
      if (UltiSite.checkedLocalStorage) {
        UltiSite.offlineCheck();
      }
      UltiSite.checkedLocalStorage = true;
    });
  });
});

if (!Package.appcache) {
  Package.appcache = {};
  console.log('service-worker: faking existence of AppCache package');
}

if ('serviceWorker' in navigator) {
  console.log('service-worker: service worker available');
  if (Meteor.settings && Meteor.settings.public && Meteor.settings.public.disableGMServiceWorker) {
    // if we disable service worker, force unregistration of them
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    return;
  }

  const wb = new Workbox(Meteor.absoluteUrl('sw.js'));
  let retry;
  wb.addEventListener('statechange', (evt) => {
    console.log('service-worker: Active state:' + evt.target.state);
  });
  wb.addEventListener('waiting', (event) => {
    console.log('service-worker: Waiting service worker found');
    if (event.sw) {
      console.log('service-worker: sending command to skip');
      messageSW(event.sw, { type: 'SKIP_WAITING' });
    }
  });
  wb.addEventListener('externalwaiting', (event) => {
    console.log('service-worker: External Waiting service worker found');
    if (event.sw) {
      console.log('service-worker: sending command to skip');
      messageSW(event.sw, { type: 'SKIP_WAITING' });
    }
  });
  let canMigrate = false;
  wb.addEventListener('controlling', (event) => {
    console.log('service-worker: is controlling, retrying migration');
    canMigrate = true;
    if (retry) retry();
    else window.location.reload();
  });
  wb.addEventListener('externalactivated', (event) => {
    console.log('service-worker: is external activated, retrying migration');
    canMigrate = true;
    if (retry) retry();
    else window.location.reload();
  });
  Reload._onMigrate((r) => {
    if (canMigrate) return [canMigrate];
    console.log('service-worker: force updating service worker...');
    wb.update();
    retry = r;
    localForage.setItem('ultisiteOfflineLastSync', {});
    return false;
  });
  wb.register();
  console.log('service-worker: registered service worker');
} else {
  console.log('service-worker: service worker not available');
}
