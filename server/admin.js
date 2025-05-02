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

async function syncSettings() {
  _.extend(Meteor.settings, (await Settings.findOneAsync()) || {});

  Object.keys(Meteor.settings).forEach((key) => {
    if (key === 'mailingListConfigs') {
      __meteor_runtime_config__.PUBLIC_SETTINGS[key] = Meteor.settings[key].map((config) => _.omit(config, 'password'));
    } else if (key === 'public') {
      // noop
    } else if (key.toLowerCase().indexOf('password') < 0) {
      __meteor_runtime_config__.PUBLIC_SETTINGS[key] = Meteor.settings[key];
    }
  });

  __meteor_runtime_config__.PUBLIC_SETTINGS.rootFolderId = (
    (await Folders.findOneAsync({
      name: '/',
    })) || {}
  )._id;
  WebAppInternals.generateBoilerplate();
  console.log('synced settings');
  return __meteor_runtime_config__.PUBLIC_SETTINGS;
}
Meteor.startup(async function () {
  if (!(await Settings.findOneAsync())) {
    await Settings.insertAsync({});
  }
  await syncSettings();
});

Meteor.methods({
  async updateSettings(modifier) {
    if (!(await isAdmin(this.userId))) {
      throw new Meteor.error('access-denied', 'Zugriff nur für Admins');
    }
    console.log('updating settings', modifier);
    await Settings.updateAsync({}, modifier);
    return await syncSettings();
  },
  async recreateCollections() {
    await Meteor.callAsync('cleanDatabases');
    await Meteor.callAsync('createDatabases');
    Accounts.setPassword(
      (
        await Meteor.users.findOneAsync({
          'emails.address': 'lars@larswolter.de',
        })
      )._id,
      'blubs'
    );
  },
  async queryCollectionStatus() {
    return [
      {
        name: 'Settings',
        count: await Settings.find().countAsync(),
      },
      {
        name: 'Users',
        count: await Meteor.users.find().countAsync(),
      },
      {
        name: 'Tournaments',
        count: await Tournaments.find().countAsync(),
      },
      {
        name: 'Files',
        count: (await Images.find().countAsync()) + (await Documents.find().countAsync()),
      },
      {
        name: 'Practices',
        count: await Practices.find().countAsync(),
      },
      {
        name: 'Events',
        count: await Events.find().countAsync(),
      },
      {
        name: 'WikiPages',
        count: await WikiPages.find().countAsync(),
      },
    ];
  },
});
