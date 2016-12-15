var tweetLength = new ReactiveVar(0);

Meteor.startup(function() {
    UltiSite.Tweets = new Meteor.Collection("Tweets");

    FlowRouter.route('/tweets', {
        name: "tweets",
        action: function () {
            BlazeLayout.render("baseLayout", {
                content: "tweets"
            });

        }
    });
    
    UltiSite.Tweets.find({}, {
        sort: {
            date: -1
        }
    }).observe({
        added: function(tweet) {
            //notifyUser(tweet.content);
        }
    });
    Meteor.subscribe("Tweets");    
});
Template.tweets.helpers({
    viewAll: function () {
        return (FlowRouter.getRouteName() === "tweets");
    },
    tweets: function() {
        if (FlowRouter.getRouteName() === "tweets")
            return UltiSite.Tweets.find({}, {
                sort: {
                    date: -1
                },
                limit: 30
            });
        else
            return UltiSite.Tweets.find({}, {
                sort: {
                    date: -1
                },
                limit: 3
            });
    },
    tweetLength: function() {
        return tweetLength.get();
    }
});
Template.tweets.events({
    'click .btn-reply': function(e, t) {
        t.$('.modal').modal('show');
        t.$('.tweet-type').html("Antworte");
        t.$('.tweeter-form .tweet-content').val("");
        t.$('.tweet-reference').val(this._id);
        tweetLength.set(0);
        Tracker.afterFlush(function() {
            t.$('.tweeter-form .tweet-content').focus();
        });
    },
    'click .btn-say': function(e, t) {
        t.$('.modal').modal('show');
        t.$('.tweet-type').html("Sprich");
        t.$('.tweet-reference').val("");
        t.$('.tweeter-form .tweet-content').val("");
        tweetLength.set(0);
        Tracker.afterFlush(function() {
            t.$('.tweeter-form .tweet-content').focus();
        });
    },
    'keyup .tweeter-form .tweet-content': function(e, t) {
        tweetLength.set(t.$('.tweeter-form .tweet-content').val().length);
    },
    'click .btn-all-tweets': function(e, t) {
        FlowRouter.go("tweets");
    },

    'submit .tweeter-form': function(e, t) {
        e.preventDefault();
        if (t.$('.tweeter-form .tweet-content').val().length > 160)
            t.$('.tweeter-form .tweet-content').addClass("bg-danger");
        var replyTo = (UltiSite.Tweets.findOne(t.$('.tweet-reference').val()) || {}).content;
        UltiSite.Tweets.insert({
            content: t.$('.tweeter-form .tweet-content').val().substr(0, 160),
            date: new Date(),
            replyTo: replyTo
        });
        t.$('.modal').modal('hide');
    }
});
