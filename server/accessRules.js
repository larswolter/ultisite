import {
  Blogs,
  Documents,
  Folders,
  Images,
  isAdmin,
  Participants,
  Practices,
  Tournaments,
  userIsInRoleAsync,
  WikiPageDiscussions,
  WikiPages,
} from '../common/lib/ultisite';

let allowByUser = {
  update(userId, doc, fields) {
    if (userId) return true;
    return false;
  },
  remove(userId, doc) {
    if (userId) return true;
    return false;
  },
  insert(userId, doc) {
    if (userId) return true;
    return false;
  },
};

Blogs.allow(allowByUser);
Folders.allow(allowByUser);
Documents.allow(allowByUser);
Images.allow(allowByUser);

Folders.deny({
  async remove(userId, doc) {
    if (userId) {
      var anzahl = await Images.find({
        associated: doc._id,
      }).countAsync();
      anzahl += await Documents.find({
        associated: doc._id,
      }).countAsync();
      if (anzahl === 0) return false;
    }
    return true;
  },
});

Participants.allow({
  update(userId, part) {
    return false;
  },
  remove(userId, doc) {
    return false;
  },
  insert(userId, part) {
    return false;
  },
});

Tournaments.allow({
  insert(userId) {
    if (!userId) return false;
    return true;
  },
  update(userId, doc, fields) {
    if (!userId) return false;
    if (fields.length === 1 && fields[0] === 'description') {
      return true;
    }
    if (fields.length === 1 && fields[0] === 'reports') {
      return true;
    }
    return true;
  },
  remove(userId, doc) {
    if (!userId) return false;
    if (doc.teams && doc.teams.length > 0) return false;
    return true;
  },
});

WikiPageDiscussions.allow({
  update(userId, doc) {
    return false;
  },
  insert(userId) {
    return false;
  },
  remove() {
    return false;
  },
});
WikiPages.allow({
  async update(userId, doc, fieldNames, modifier) {
    if (await isAdmin(userId)) return true;
    if (fieldNames.length === 1 && fieldNames[0] === 'locked' && (!doc.locked || doc.locked === userId)) return true;
    if (doc.editor !== userId) return false;
    if (userId) return true;
    return false;
  },
  async insert(userId, doc) {
    if (await isAdmin(userId)) return true;
    if (doc.editor !== userId) return false;
    if (doc.owner !== userId) return false;
    if (userId) return true;
    return false;
  },
  async remove(userId, doc) {
    if (await isAdmin(userId)) return true;
    if (userId === doc.owner) return true;
    return false;
  },
});
Practices.allow({
  update(userId, doc) {
    if (userId) return true;
    return false;
  },
  remove(userId, doc) {
    if (userId) return true;
    return false;
  },
  insert(userId, doc) {
    if (userId) return true;
    return false;
  },
});

Meteor.users.allow({
  async update(userId, doc, fieldNames, modifier) {
    if (await userIsInRoleAsync(userId, ['admin'])) return true;
    if (fieldNames.length > 1) return false;
    console.log('user update', fieldNames, modifier);
    if (fieldNames[0] === 'profile' || fieldNames[0] === 'settings' || fieldNames[0] === 'username') {
      if (userId === doc._id) return true;
      if (await userIsInRoleAsync(userId, [doc._id])) return true;
    }
    var allowed = false;
    for (const key of Object.keys(modifier.$set)) {
      var area = key.split('.')[0];
      console.log('checking role:', userId, area);

      if (await userIsInRoleAsync(userId, [area])) allowed = true;
    }
    return allowed;
  },
});
