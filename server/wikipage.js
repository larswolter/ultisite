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
  getWikiPageNames: function () {
    return WikiPages.find(
      {},
      {
        fields: {
          name: 1,
          _id: 1,
        },
      }
    ).map(function (e) {
      return e;
    });
  },
  addWikiPageDiscussion: function (pageId, text) {
    WikiPageDiscussions.insert({
      content: text,
      editor: this.userId,
      editorName: Meteor.users.findOne(this.userId).username,
      date: new Date(),
      pageId: pageId,
    });
    Meteor.call('addEvent', {
      type: 'wiki',
      _id: pageId,
      text: 'Neuer Diskussionsbeitrag',
    });
  },
});
