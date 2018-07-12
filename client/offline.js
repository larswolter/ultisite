import localForage from 'localforage';
import { Meteor } from 'meteor/meteor';
import { Reload } from 'meteor/reload';
import { moment } from 'meteor/momentjs:moment';

UltiSite.serviceWorker = null;
UltiSite.offlineTournaments = [];
UltiSite.offlineTeams = [];
UltiSite.offlineLastChange = moment().subtract(1, 'year');
UltiSite.checkedLocalStorage = false;
UltiSite.offlineTeamDependency = new Tracker.Dependency();
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
          offline.data.forEach(i => UltiSite[col.name].insert({
            ...i,
            _offline: true,
          }));
          UltiSite[col.name].lastOfflineSync = offline.lastSync;
        }
      });
    });
  },
});

Meteor.startup(function () {
  localForage.getItem('ultisiteOfflineLastSync', (err, res) => {
    UltiSite.lastOfflineSync = res;
    Meteor.subscribe('lastChangedElements', res || null);
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
          Meteor.apply('offlineInitUser', [user], { noRetry: true }, (err) => { });
        }
      });
      comp.stop();
    }
  });
  UltiSite.offlineCollections.forEach((col) => {
    Tracker.autorun(() => {
      const elements = UltiSite[col.name].find({
        ...col.filter(),
        _offline: { $exists: false },
        lastChanged: UltiSite.lastOfflineSync,
      });
      if (elements.count() > 0) {
        console.log(`Storing ${elements.count()} elements of ${col.name}`);
        localForage.setItem('ultisiteOffline' + col.name, {
          lastSync: new Date(), data: UltiSite[col.name].find(col.filter()).fetch(),
        });
      }
    });
  });
  Meteor.apply('offlineInitCollections', [], { noRetry: true }, (err) => { });
});

UltiSite.getTournament = function (id) {
  UltiSite.offlineTournamentDependency.depend();
  const t = UltiSite.Tournaments.findOne(id);
  return t || _.findWhere(this.offlineTournaments, { _id: id });
};
UltiSite.getTeam = function (id) {
  UltiSite.offlineTeamDependency.depend();
  const t = UltiSite.Teams.findOne(id);
  return t || _.findWhere(this.offlineTeams, { _id: id });
};

UltiSite.offlineCheck = function () {
  if (!UltiSite.checkedLocalStorage) { return; }
  const lastSync = moment(localStorage.getItem('offlineLastSync'));
  Meteor.call('offlineCheckForNew', lastSync.toDate(), (err, info) => {
    if (info.mustSync) { UltiSite.offlineFetch(); }
    if (info.tournamentCount !== this.offlineTournaments.length) { UltiSite.offlineFetch(); }
    if (info.teamCount !== this.offlineTeams.length) { UltiSite.offlineFetch(); }
  });
};

UltiSite.offlineClear = function () {
  localForage.removeItem('ultisiteUser');
  localForage.removeItem('Tournaments', () => {
    this.offlineTournaments = [];
    this.offlineFetchDependency.changed();
  });
  localForage.removeItem('Teams', () => {
    this.offlineTeams = [];
    this.offlineFetchDependency.changed();
  });
};

UltiSite.offlineUpdateTournament = function (tournament, wait) {
  let found = false;
  for (let i = 0; i < this.offlineTournaments.length; i++) {
    if (this.offlineTournaments[i]._id === tournament._id) {
      this.offlineTournaments[i] = tournament;
      found = true;
      break;
    }
  }
  if (!found) { this.offlineTournaments.push(tournament); }
  if (!wait) {
    localForage.setItem('Tournaments', this.offlineTournaments);
  }
};

UltiSite.offlineUpdateTeam = function (team, wait) {
  let found = false;
  for (let i = 0; i < this.offlineTeams.length; i++) {
    if (this.offlineTeams[i]._id === team._id) {
      this.offlineTeams[i] = team;
      found = true;
      break;
    }
  }
  if (!found) { this.offlineTeams.push(team); }
  if (!wait) {
    localForage.setItem('Teams', this.offlineTeams);
  }
};


UltiSite.offlineRemoveTournament = function (id, wait) {
  for (let i = 0; i < this.offlineTournaments.length; i++) {
    if (this.offlineTournaments[i]._id === id) {
      this.offlineTournaments.splice(i, 1);
      break;
    }
  }
  if (!wait) {
    localForage.setItem('Tournaments', this.offlineTournaments);
  }
};
UltiSite.offlineRemoveTeam = function (id, wait) {
  for (let i = 0; i < this.offlineTeams.length; i++) {
    if (this.offlineTeams[i]._id === id) {
      this.offlineTeams.splice(i, 1);
      break;
    }
  }
  if (!wait) {
    localForage.setItem('Teams', this.offlineTeams);
  }
};

UltiSite.offlineFetch = _.throttle((update) => {
  if (!Meteor.user()) { return; }
  console.log('loading data from server');
  const lastSync = moment(localStorage.getItem('offlineLastSync'));
  if (!lastSync.isValid()) { update = false; }
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
}, 1000);

Meteor.startup(function () {
  UltiSite.Tournaments.find().observe({
    added(t) {
      if (!t.teams) { UltiSite.offlineUpdateTournament(t); }
    },
    changed(t) {
      if (!t.teams) { UltiSite.offlineUpdateTournament(t); }
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
      } else { UltiSite.offlineTeams = []; }
      if (UltiSite.checkedLocalStorage) { UltiSite.offlineCheck(); }
      UltiSite.checkedLocalStorage = true;
    });
    localForage.getItem('Teams', (err, teams) => {
      UltiSite.offlineLastChange = moment().subtract(1, 'year');
      if (teams) {
        UltiSite.offlineTeams = teams.map((t) => {
          t.tournamentDate = moment(t.tournamentDate).toDate();
          if (t.lastChange) {
            const lastChange = moment(t.lastChange);
            if (lastChange.isAfter(UltiSite.offlineLastChange)) {
              UltiSite.offlineLastChange = lastChange.clone();
            }
            t.lastChange = lastChange.toDate();
          }
          t.lastChange = moment().subtract(1, 'year').toDate();
          return t;
        });
        UltiSite.offlineTeamDependency.changed();
        console.log('retrieved teams from local storage, lastChange:', UltiSite.offlineLastChange.format('DD.MM.YYYY HH:mm'));
      } else { UltiSite.offlineTeams = []; }
      if (UltiSite.checkedLocalStorage) { UltiSite.offlineCheck(); }
      UltiSite.checkedLocalStorage = true;
    });
  });
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(Meteor.absoluteUrl('sw.js')).then((registration) => {
    UltiSite.serviceWorker = registration;
  }).catch(error => console.log('Failed to register SW:', error));

  try {
    Reload._onMigrate(function (func, opts) {
      if (!opts.immediateMigration) {
        try {
          window.caches.keys().then((keys) => {
            keys.forEach((name) => {
              window.caches.delete(name);
            });
          }).catch((err) => {
            console.error('window.caches.delete', err);
          });
        } catch (_error) {
          // We good here...
        }

        if (UltiSite.serviceWorker) {
          try {
            UltiSite.serviceWorker.unregister().catch((e) => {
              console.warn('[SW UNREGISTER] [CATCH IN PROMISE] [ERROR:]', e);
            });
            UltiSite.serviceWorker = null;
          } catch (e) {
            console.warn('[SW UNREGISTER] [ERROR:]', e);
          }
        }

        setTimeout(() => {
          if (window.location.hash || window.location.href.endsWith('#')) {
            window.location.reload();
          } else {
            window.location.replace(window.location.href);
          }
        }, 128);


        return [false];
      }
      return [true];
    });
  } catch (e) {
    // We're good here
  }
}
