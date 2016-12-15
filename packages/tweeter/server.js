
Meteor.startup(function(){
    UltiSite.Tweets = new Meteor.Collection("Tweets");
    UltiSite.Tweets.allow({
        update: function (userId,doc,fields) {
            if (userId)
                return true;
            return false;
        },
        remove: function (userId,doc) {
            if (userId)
                return true;
            return false;
        },
        insert: function (userId,doc) {
            if (userId)
                return true;
            return false;
        }
    });
});

Meteor.publish("Tweets", function () {
    return UltiSite.Tweets.find({}, {
        sort: {
            date: -1
        },
        limit: 50
    });
});

