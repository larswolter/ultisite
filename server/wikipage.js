import { WikiPageDiscussions, WikiPages } from '../common/lib/ultisite';

Meteor.startup(function () {
  // UserStatus.events.on("connectionLogout", function (fields) {
  //     WikiPages.update({
  //         locked: fields.userId
  //     }, {
  //         $set: {
  //             locked: null
  //         }
  //     });
  // });
});

Meteor.methods({
  getWikiPageNames: async function() {
    return await WikiPages.find(
      {},
      {
        fields: {
          name: 1,
          _id: 1,
        },
      }
    ).mapAsync(function (e) {
      return e;
    });
  },
  addWikiPageDiscussion: async function(pageId, text) {
    await WikiPageDiscussions.insertAsync({
      content: text,
      editor: this.userId,
      editorName: (await Meteor.users.findOneAsync(this.userId)).username,
      date: new Date(),
      pageId: pageId,
    });
    await Meteor.callAsync('addEvent', {
      type: 'wiki',
      _id: pageId,
      text: 'Neuer Diskussionsbeitrag',
    });
  },
});
