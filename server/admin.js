Meteor.methods({
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
