/* global __meteor_runtime_config__ */

import {
  Documents,
  Events,
  Folders,
  Images,
  isAdmin,
  Practices,
  Tournaments,
  WikiPages,
  Settings,
} from '../common/lib/ultisite';

function syncSettings() {
  _.extend(Meteor.settings, Settings.findOne() || {});

  Object.keys(Meteor.settings).forEach((key) => {
    if (key === 'mailingListConfigs') {
      __meteor_runtime_config__.PUBLIC_SETTINGS[key] = Meteor.settings[key].map((config) => _.omit(config, 'password'));
    } else if (key === 'public') {
    } else if (key.toLowerCase().indexOf('password') < 0) {
      __meteor_runtime_config__.PUBLIC_SETTINGS[key] = Meteor.settings[key];
    }
  });

  __meteor_runtime_config__.PUBLIC_SETTINGS.rootFolderId = (
    Folders.findOne({
      name: '/',
    }) || {}
  )._id;
  WebAppInternals.generateBoilerplate();
  console.log('synced settings');
  return __meteor_runtime_config__.PUBLIC_SETTINGS;
}
Meteor.startup(function () {
  if (!Settings.findOne()) {
    Settings.insert({});
  }
  syncSettings();
});

Meteor.methods({
  updateSettings(modifier) {
    if (!isAdmin(this.userId)) {
      throw new Meteor.error('access-denied', 'Zugriff nur für Admins');
    }
    console.log('updating settings', modifier);
    Settings.update({}, modifier);
    return syncSettings();
  },
  recreateCollections() {
    Meteor.call('cleanDatabases');
    Meteor.call('createDatabases');
    Accounts.setPassword(
      Meteor.users.findOne({
        'emails.address': 'lars@larswolter.de',
      })._id,
      'blubs'
    );
  },
  queryCollectionStatus() {
    return [
      {
        name: 'Settings',
        count: Settings.find().count(),
      },
      {
        name: 'Users',
        count: Meteor.users.find().count(),
      },
      {
        name: 'Tournaments',
        count: Tournaments.find().count(),
      },
      {
        name: 'Files',
        count: Images.find().count() + Documents.find().count(),
      },
      {
        name: 'Practices',
        count: Practices.find().count(),
      },
      {
        name: 'Events',
        count: Events.find().count(),
      },
      {
        name: 'WikiPages',
        count: WikiPages.find().count(),
      },
    ];
  },
});
