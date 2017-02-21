import localForage from 'localforage';

UltiSite.offlineTournaments = [];
UltiSite.offlineDependency = new Tracker.Dependency();

UltiSite.getTournament = function (id) {
    const t = UltiSite.Tournaments.findOne(id);
    return t || _.findWhere(this.offlineTournaments, { _id: id });
};
UltiSite.offlineClear = function () {
    localForage.removeItem('Tournaments', ()=>{
        this.offlineTournaments = [];
        this.offlineDependency.changed();
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
UltiSite.offlineFetch = _.throttle((update) => {
    console.log('loading data from server');
    const lastSync = moment(localStorage.getItem('offlineLastSync')).subtract(1, 'minute');
    HTTP.get('/_rest/offlineTournaments.json?accessToken='+Meteor.user().downloadToken + (update ? '&since=' + lastSync.toISOString() : ''), {
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
                res.data.removed.forEach((removed) => {
                    UltiSite['offlineRemove' + removed.type](removed._id, true);
                });
                localForage.setItem('Tournaments', UltiSite.offlineTournaments);
            } else {
                console.log('loaded full data from server:', res.data.tournaments.length);
                localForage.setItem('Tournaments', res.data.tournaments);
                UltiSite.offlineTournaments = res.data.tournaments;
            }
            localStorage.setItem('offlineLastSync', new Date());
            UltiSite.offlineDependency.changed();
        } else if (err)
            UltiSite.notify(err, 'error');
        else
            UltiSite.notify('Es konnten keine Daten abgerufen werden', 'warning');
    });
}, 1000);

Meteor.startup(function () {
    Tracker.autorun((comp) => {
        if(Meteor.user()) {
            localForage.getItem('Tournaments', (err, tournaments) => {
                UltiSite.offlineTournaments = tournaments||[];
                UltiSite.offlineDependency.changed();
                if(err || !tournaments)
                    UltiSite.offlineFetch();
            });
            comp.stop();
        }
    });
});