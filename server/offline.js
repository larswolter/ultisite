import { moment } from 'meteor/momentjs:moment';

const getOfflineSyncDate = function () {
  return { $gte: moment().subtract(3, 'month').startOf('year').toDate() };
};

const offlineForce = moment();

const refreshDownloadToken = function (userId) {
  Meteor.users.update(userId, {
    $set: {
      'profile.downloadToken': Random.id(40),
    },
  });
};

Accounts.onLogin(function (attempt) {
  refreshDownloadToken(attempt.user && attempt.user._id);
});
Accounts.onLogout(function (attempt) {
  refreshDownloadToken(attempt.user && attempt.user._id);
});
Meteor.publish('lastChangedElements', function (modifiedAfter) {
  check(modifiedAfter, Match.Maybe(Date));
  check(this.userId, String);

  return UltiSite.offlineCollections.map((col) => {
    if (modifiedAfter) {
      return UltiSite[col.name].find({ ...col.filter(), lastChanged: { $gt: modifiedAfter } });
    } else {
      return UltiSite[col.name].find(col.filter());
    }
  });
});

Meteor.methods({
  ping() {
    if (this.connection.httpHeaders && this.connection.httpHeaders['save-data'] === 'on') {
      Meteor.users.update({
        _id: this.userId,
        $or: [{ 'connection.saveData': { $exists: false } },
        { 'connection.saveData': false }],
      }, { $set: { 'connection.saveData': true } });
    } else {
      Meteor.users.update({
        _id: this.userId,
        $or: [{ 'connection.saveData': { $exists: false } },
        { 'connection.saveData': true }],
      }, { $set: { 'connection.saveData': false } });
    }
  },
  offlineCheckForNew(since) {
    check(since, Date);
    const info = {
      tournamentCount: UltiSite.Tournaments.find({ date: getOfflineSyncDate() }, { sort: { date: -1 } }).count(),
    };
    if (offlineForce.isAfter(moment(since))) {
      info.mustSync = true;
    } else {
      const tChange = UltiSite.Tournaments.find({ lastChange: { $gte: since } }).count();
      if (tChange > 3) { info.mustSync = true; }
    }
    return info;
  },
});

WebApp.connectHandlers.use('/_rest/offlineTournaments.json', (req, response) => {
  if (!req.query.accessToken) {
    response.writeHead(403);
    response.end('Missing accessToken');
    return;
  }
  const user = Meteor.users.findOne({ 'profile.downloadToken': req.query.accessToken });
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
    removed: [],
  };

  console.log('LOAD tournaments as *.json');
  const content = JSON.stringify(offline);
  response.end(content);
});

WebApp.connectHandlers.use('/sw.js', (req, response) => {
  const sworker = Assets.getText('serviceWorker.js');
  response.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  response.writeHead(200);
  response.end(sworker);
});
