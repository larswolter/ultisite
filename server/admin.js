UltiSite.Settings = new Meteor.Collection("Settings");

function syncSettings() {
    Meteor.settings = UltiSite.Settings.findOne();
    __meteor_runtime_config__.PUBLIC_SETTINGS = _.omit(Meteor.settings, (value, key) => {
        return key.toLowerCase().indexOf('password') >= 0;
    });
    __meteor_runtime_config__.PUBLIC_SETTINGS.rootFolderId = (UltiSite.Folders.findOne({
        name: "/"
    })||{})._id;
    WebAppInternals.generateBoilerplate();
    console.log('synced settings');
}
Meteor.startup(function(){
    syncSettings();
});

Meteor.methods({
    updateSettings: function(modifier) {
        if(!UltiSite.isAdmin(this.userId))
            throw new Meteor.error('access-denied','Zugriff nur für Admins');
        UltiSite.Settings.update({},modifier);
        syncSettings();
    },
    recreateCollections: function () {
        Meteor.call('cleanDatabases');
        Meteor.call('createDatabases');
        Accounts.setPassword(Meteor.users.findOne({
            'emails.address': "lars@larswolter.de"
        })._id, "blubs");


    },
    queryCollectionStatus: function () {
        return [
            {
                name: "Settings",
                count: UltiSite.Settings.find().count()
            },
            {
                name: "Users",
                count: Meteor.users.find().count()
            },
            {
                name: "Tournaments",
                count: UltiSite.Tournaments.find().count()
            },
            {
                name: "Teams",
                count: UltiSite.Teams.find().count()
            },
            {
                name: "Files",
                count: UltiSite.Images.find().count() + UltiSite.Documents.find().count()
            },
            {
                name: "Practices",
                count: UltiSite.Practices.find().count()
            },
            {
                name: "Events",
                count: UltiSite.Events.find().count()
            },
            {
                name: "WikiPages",
                count: UltiSite.WikiPages.find().count()
            }
        ];

    }
});
