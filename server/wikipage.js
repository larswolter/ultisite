const { default: UltiSite } = require('../imports/Ultisite');

Meteor.methods({
  async updateWikiPage(name, content) {
    check(name, String);
    check(content, String);
    if (this.userId) {
      const user = await Meteor.users.findOneAsync({ _id: this.userId });
      UltiSite.WikiPages.upsertAsync(
        { name },
        { $set: { content, lastChange: new Date(), editor: this.userId, editorName: user.username } }
      );
    }
  },
});
