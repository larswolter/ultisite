import localForage from 'localforage';

UltiSite.offlineTournaments = [];
UltiSite.offlineTeams = [];
UltiSite.offlineTeamDependency = new Tracker.Dependency();
UltiSite.offlineTournamentDependency = new Tracker.Dependency();
UltiSite.offlineFetchDependency = new Tracker.Dependency();

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
    const lastSync = moment(localStorage.getItem('offlineLastSync')).subtract(1, 'minute');
    Meteor.call('offlineCheckForNew', lastSync.toDate(), (err, needsSync) => {
        if (needsSync)
            UltiSite.offlineFetch();
    });
};

UltiSite.offlineClear = function () {
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
    if (!found)
        this.offlineTournaments.push(tournament);
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
    if (!found)
        this.offlineTeams.push(team);
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
    if (!Meteor.user())
        return;
    console.log('loading data from server');
    const lastSync = moment(localStorage.getItem('offlineLastSync')).subtract(1, 'minute');
    if (!lastSync.isValid())
        update = false;
    HTTP.get('/_rest/offlineTournaments.json?accessToken=' + Meteor.user().downloadToken + (update ? '&since=' + lastSync.toISOString() : ''), {
        beforeSend: function (xhr) {
            xhr.onloadend = (evt) => {
                console.log('finished fetching offline data');
            };
            xhr.onprogress = (evt) => {
                if (evt.lengthComputable) {
                    console.log('fetching offline data', ((evt.loaded / evt.total) * 100) + '%');
                } else
                    console.log('fetching offline data', (evt.loaded / 1000).toFixed(0) + ' kB');
            };
        }
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
        } else
            UltiSite.notify('Es konnten keine Daten abgerufen werden', 'warning');
    });
}, 1000);

Meteor.startup(function () {
    UltiSite.Tournaments.find().observe({
        added(t) {
            if (!t.teams)
                UltiSite.offlineUpdateTournament(t);
        },
        changed(t) {
            if (!t.teams)
                UltiSite.offlineUpdateTournament(t);
        }
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
            } else
                UltiSite.offlineTeams = [];
            if (err || !tournaments)
                UltiSite.offlineFetch();
        });
        localForage.getItem('Teams', (err, teams) => {
            if (teams) {
                UltiSite.offlineTeams = teams.map((t) => {
                    t.tournamentDate = moment(t.tournamentDate).toDate();
                    t.lastChange = moment(t.lastChange).toDate();
                    return t;
                });
                UltiSite.offlineTeamDependency.changed();
                console.log('retrieved teams from local storage');
            } else
                UltiSite.offlineTeams = [];
            if (err || !teams)
                UltiSite.offlineFetch();
        });
    });
});