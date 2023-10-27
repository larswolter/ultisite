import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import './tweeter.html';

const tweetLength = new ReactiveVar(0);

Meteor.startup(function () {
  console.log('startup tweets');
  UltiSite.Tweets = new Meteor.Collection('Tweets');

  FlowRouter.route('/tweets', {
    name: 'tweets',
    action() {
      UltiSite.baseLayoutData.set({
        content: 'tweets',
      });
    },
  });

  UltiSite.Tweets.find(
    {},
    {
      sort: {
        date: -1,
      },
    }
  ).observe({
    added(tweet) {
      // notifyUser(tweet.content);
    },
  });
  Meteor.subscribe('Tweets');
});
Template.tweets.helpers({
  viewAll() {
    return FlowRouter.getRouteName() === 'tweets';
  },
  tweets() {
    if (FlowRouter.getRouteName() === 'tweets') {
      return UltiSite.Tweets.find(
        {},
        {
          sort: {
            date: -1,
          },
          limit: 30,
        }
      );
    } else {
      return UltiSite.Tweets.find(
        {},
        {
          sort: {
            date: -1,
          },
          limit: 3,
        }
      );
    }
  },
  tweetLength() {
    return tweetLength.get();
  },
});
Template.tweets.events({
  'click .btn-reply': function (e, t) {
    t.$('.modal').modal('show');
    t.$('.tweet-type').html('Antworte');
    t.$('.tweeter-form .tweet-content').val('');
    t.$('.tweet-reference').val(this._id);
    tweetLength.set(0);
    Tracker.afterFlush(function () {
      t.$('.tweeter-form .tweet-content').focus();
    });
  },
  'click .btn-say': function (e, t) {
    t.$('.modal').modal('show');
    t.$('.tweet-type').html('Sprich');
    t.$('.tweet-reference').val('');
    t.$('.tweeter-form .tweet-content').val('');
    tweetLength.set(0);
    Tracker.afterFlush(function () {
      t.$('.tweeter-form .tweet-content').focus();
    });
  },
  'keyup .tweeter-form .tweet-content': function (e, t) {
    tweetLength.set(t.$('.tweeter-form .tweet-content').val().length);
  },
  'click .btn-all-tweets': function (e, t) {
    FlowRouter.go('tweets');
  },

  'submit .tweeter-form': function (e, t) {
    e.preventDefault();
    if (t.$('.tweeter-form .tweet-content').val().length > 160) {
      t.$('.tweeter-form .tweet-content').addClass('bg-danger');
    }
    const replyTo = (UltiSite.Tweets.findOne(t.$('.tweet-reference').val()) || {}).content;
    UltiSite.Tweets.insert({
      content: t.$('.tweeter-form .tweet-content').val().substr(0, 160),
      date: new Date(),
      replyTo,
    });
    t.$('.modal').modal('hide');
  },
});
