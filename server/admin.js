/* global __meteor_runtime_config__ */

UltiSite.Settings = new Meteor.Collection("Settings");

function syncSettings() {
  _.extend(Meteor.settings, UltiSite.Settings.findOne() || {});
  Object.keys(Meteor.settings).forEach((key) => {
    if (key === 'public') {

    } else if (key === 'mailingListConfigs') {
      __meteor_runtime_config__.PUBLIC_SETTINGS[key] = Meteor.settings[key].map(config => _.omit(config, 'password'));
    } else if (key.toLowerCase().indexOf('password') < 0) {
      __meteor_runtime_config__.PUBLIC_SETTINGS[key] = Meteor.settings[key];
    }
  });
  __meteor_runtime_config__.PUBLIC_SETTINGS.rootFolderId = (UltiSite.Folders.findOne({
    name: "/",
  }) || {})._id;
  WebAppInternals.generateBoilerplate();
  console.log('synced settings');
  return __meteor_runtime_config__.PUBLIC_SETTINGS;
}
Meteor.startup(function () {
  syncSettings();
});

Meteor.methods({
  updateSettings(modifier) {
    if (!UltiSite.isAdmin(this.userId)) { throw new Meteor.error('access-denied', 'Zugriff nur für Admins'); }
    UltiSite.Settings.update({}, modifier);
    return syncSettings();
  },
  recreateCollections() {
    Meteor.call('cleanDatabases');
    Meteor.call('createDatabases');
    Accounts.setPassword(Meteor.users.findOne({
      'emails.address': "lars@larswolter.de",
    })._id, "blubs");
  },
  queryCollectionStatus() {
    return [
      {
        name: "Settings",
        count: UltiSite.Settings.find().count(),
      },
      {
        name: "Users",
        count: Meteor.users.find().count(),
      },
      {
        name: "Tournaments",
        count: UltiSite.Tournaments.find().count(),
      },
      {
        name: "Files",
        count: UltiSite.Images.find().count() + UltiSite.Documents.find().count(),
      },
      {
        name: "Practices",
        count: UltiSite.Practices.find().count(),
      },
      {
        name: "Events",
        count: UltiSite.Events.find().count(),
      },
      {
        name: "WikiPages",
        count: UltiSite.WikiPages.find().count(),
      },
    ];
  },
});
