import { Meteor } from 'meteor/meteor';
import { isModern } from 'meteor/modern-browsers';
import { WebApp } from 'meteor/webapp';

import { moment } from 'meteor/momentjs:moment';
import crypto from 'crypto';

const sha256 = crypto.createHash('sha256');

// Store for each client-device a list of stored document _id/hashes
// On subscription observe documents and clientHashes - disable mergebox
// When subscribed with clientId check each document if is in there,
//   if yes and same hash dont add to the client
//   if yes and diff hash add to the client (update no possible without mergebox)
//   if no add to the client
//   send remove for removed documents in he clientHash collection
// Client stores subscribed documents and commits their
// storage/removal to the server, which
// adds it to the clientHashes and mark a client as lastUsed
// observe documents on server, on change remove all obsolete hashes
// on remove mark tournament as removed

// check if offline storage is valid by checking the hashes
// of the client side and server side on login
// load documents on the client from localstorage when subscribing

// super offline mode, do this in a service worker on sync

const clientHashes = new Mongo.Collection(null);
/*
Meteor.startup(function () {
  Tournaments.find().observe({
    changed(doc) {
      clientHashes.update({ 'docs.i': doc._id }, { $set: { 'docs.$.h': null } }, { multi: true });
    },
    removed(docId) {
      clientHashes.update({ 'docs.i': docId }, { $set: { 'docs.$.r': true } }, { multi: true });
    },
  });
});
*/
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
  if (!this.userId) return this.ready();

  return offlineCollections.map((col) => {
    if (modifiedAfter && modifiedAfter[col.name]) {
      return UltiSite[col.name].find(
        {
          ...col.filter(),
          lastChange: { $gt: modifiedAfter[col.name] },
        },
        col.options()
      );
    } else {
      return UltiSite[col.name].find(col.filter(), col.options());
    }
  });
});

Meteor.methods({
  ping() {
    if (this.connection.httpHeaders && this.connection.httpHeaders['save-data'] === 'on') {
      Meteor.users.update(
        {
          _id: this.userId,
          $or: [{ 'connection.saveData': { $exists: false } }, { 'connection.saveData': false }],
        },
        { $set: { 'connection.saveData': true } }
      );
    } else {
      Meteor.users.update(
        {
          _id: this.userId,
          $or: [{ 'connection.saveData': { $exists: false } }, { 'connection.saveData': true }],
        },
        { $set: { 'connection.saveData': false } }
      );
    }
  },
  offlineCheckForNew(since) {
    check(since, Date);
    const info = {
      tournamentCount: Tournaments.find({ date: getOfflineSyncDate() }, { sort: { date: -1 } }).count(),
    };
    if (offlineForce.isAfter(moment(since))) {
      info.mustSync = true;
    } else {
      const tChange = Tournaments.find({ lastChange: { $gte: since } }).count();
      if (tChange > 3) {
        info.mustSync = true;
      }
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
    tournaments: Tournaments.find(tournamentSearch, { sort: { date: -1 } }).fetch(),
    removed: [],
  };

  console.log('LOAD tournaments as *.json');
  const content = JSON.stringify(offline);
  response.end(content);
});
Meteor.methods({
  clientData() {
    return WebApp.clientPrograms;
  },
});

WebApp.connectHandlers.use('/sw.js', (req, response) => {
  // set Timeout to ensure that the manifest ist build
  Meteor.setTimeout(() => {
    const cr = WebApp.categorizeRequest(req);

    let serviceWorker = Assets.getText('serviceWorker.js');
    const arch = isModern(cr.browser) ? 'web.browser' : 'web.browser.legacy';

    const clientHash = WebApp.clientPrograms[arch].version;
    const urls = WebApp.clientPrograms[arch].manifest
      .filter((f) => f.type !== 'dynamic js' && f.type !== 'json')
      .filter((f) => f.url)
      .map((f) => f.url)
      .map((url) => ({ url, revision: clientHash }));
    urls.push({ url: '/', revision: clientHash });
    urls.push({ url: '/chrome-manifest', revision: clientHash });
    serviceWorker = serviceWorker.replace(/CURRENT_CACHE_NAME/g, clientHash);
    serviceWorker = serviceWorker.replace("'FILES_TO_CACHE'", JSON.stringify(urls, null, 2));
    if (Meteor.isProduction) {
      serviceWorker = serviceWorker.replace(', debug: true', '');
    }
    response.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    response.writeHead(200);
    response.end(serviceWorker);
  }, 3000);
});
