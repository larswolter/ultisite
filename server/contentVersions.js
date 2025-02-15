import { moment } from 'meteor/momentjs:moment';
import { ContentVersions } from '../common/lib/ultisite';

Meteor.methods({
  storeContentVersion: function (id, content) {
    var lastEntry = ContentVersions.findOne(
      {
        associated: id,
      },
      {
        order: {
          date: -1,
        },
      }
    );

    if (lastEntry && lastEntry.author === Meteor.userId())
      if (moment().diff(lastEntry.date, 'minutes') < 60) {
        console.log(
          'ignoring this version, ' + lastEntry.author + ' saved ' + moment().diff(lastEntry.date, 'minutes') + ' ago'
        );
        return;
      }
    ContentVersions.insert({
      associated: id,
      author: Meteor.userId(),
      date: new Date(),
      content: content,
    });
  },
});
