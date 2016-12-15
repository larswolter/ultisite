Meteor.methods({
    storeContentVersion: function (id, content) {
        var lastEntry = UltiSite.ContentVersions.findOne({
            associated: id
        }, {
            order: {
                date: -1
            }
        });

        if (lastEntry && (lastEntry.author === Meteor.userId()))
            if (moment().diff(lastEntry.date, "minutes") < 60) {
                console.log("ignoring this version, " + lastEntry.author + " saved " + moment().diff(lastEntry.date, "minutes") + " ago");
                return;
            }
        UltiSite.ContentVersions.insert({
            associated: id,
            author: Meteor.userId(),
            date: new Date(),
            content: content
        });
    }
});