

const getOfflineSyncDate = function() {
  return { $gte: moment().subtract(1, 'month').startOf('year').toDate() };
};

const refreshDownloadToken = _.throttle(Meteor.bindEnvironment((userId) => {
    Meteor.users.update(userId, {
        $set: {
            downloadToken: Random.id(40)
        }
    });
}), 10000);

Meteor.startup(function () {
    Meteor.users.find().observe({
        changed(_id, fields) {
            if (fields.status)
                refreshDownloadToken(_id);
        }
    });
});

Meteor.methods({
    ping() {
        if (this.connection.httpHeaders && this.connection.httpHeaders['save-data'] === 'on')
            Meteor.users.update({
                _id: this.userId,
                $or: [{ 'connection.saveData': { $exists: false } },
                { 'connection.saveData': false }]
            }, { $set: { 'connection.saveData': true } });
        else
            Meteor.users.update({
                _id: this.userId,
                $or: [{ 'connection.saveData': { $exists: false } },
                { 'connection.saveData': true }]
            }, { $set: { 'connection.saveData': false } });
    },
    offlineCheckForNew(since) {
        check(since, Date);
        const info = {
            tournamentCount: UltiSite.Tournaments.find({ date: getOfflineSyncDate() }, { sort: { date: -1 } }).count(),
            teamCount: UltiSite.Teams.find({ tournamentDate: getOfflineSyncDate() }).count(),
        };
        const tChange = UltiSite.Tournaments.find({ lastChange: { $gte: since } }).count();
        const teChange = UltiSite.Teams.find({ lastChange: { $gte: since } }).count();
        if (tChange > 3)
            info.mustSync = true;
        if (teChange > 3)
            info.mustSync = true;
        console.log('checked offline:', info, since, tChange, teChange);
        return info;
    }
});

WebApp.connectHandlers.use('/_rest/offlineTournaments.json', (req, response) => {
    if (!req.query.accessToken) {
        response.writeHead(403);
        response.end('Missing accessToken');
        return;
    }
    const user = Meteor.users.findOne({ downloadToken: req.query.accessToken });
    if (!user) {
        response.writeHead(403);
        response.end('Invalid accessToken');
        return;
    }
    response.setHeader('Content-Type', 'application/json');
    response.writeHead(200);
    const tournamentSearch = { date: getOfflineSyncDate() };
    const teamSearch = { tournamentDate: getOfflineSyncDate() };
    if (req.query.since) {
        tournamentSearch._lastChange = { $gte: moment(req.query.since).toDate() };
        teamSearch._lastChange = { $gte: moment(req.query.since).toDate() };
    }
    const offline = {
        tournaments: UltiSite.Tournaments.find(tournamentSearch, { sort: { date: -1 } }).fetch(),
        teams: UltiSite.Teams.find(teamSearch).fetch(),
        removed: []
    };

    console.log('LOAD tournaments as *.json');
    const content = JSON.stringify(offline);
    response.end(content);
});    
