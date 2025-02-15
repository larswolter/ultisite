import { moment } from 'meteor/momentjs:moment';
import { ContentVersions } from '../common/lib/ultisite';

Meteor.methods({
  storeContentVersion: async function(id, content) {
    var lastEntry = await ContentVersions.findOneAsync(
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
    await ContentVersions.insertAsync({
      associated: id,
      author: Meteor.userId(),
      date: new Date(),
      content: content,
    });
  },
});
