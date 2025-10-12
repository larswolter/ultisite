import { addUserToRoleAsync, Blogs, isAdmin, Tournaments } from '../common/lib/ultisite';

Accounts.onLogin(async function (attempt) {
  if (attempt.user) {
    await addUserToRoleAsync(attempt.user, 'user');
    if (await Tournaments.findOneAsync({ 'participants.user': attempt.user._id })) {
      await addUserToRoleAsync(attempt.user, 'player');
    }
    if (!attempt.user.settings) {
      await Meteor.users.updateAsync(attempt.user._id, { $set: { settings: {} } });
    }
  }
});

Meteor.publish('usersOverview', async function (options) {
  check(options, Object);
  if (this.userId) {
    const fields = {};
    fields.club = 1;
    fields.profile = 1;
    fields.emails = 1;
    fields.status = 1;
    fields.username = 1;

    Meteor.Collection._publishCursor(Meteor.users.find({}, _.extend(options, { fields })), this, 'usersOverview');
  }
  this.ready();
});
Meteor.methods({
  async userRemove(userId) {
    check(userId, String);
    if (await isAdmin(this.userId)) {
      await Meteor.users.removeAsync(userId);
    } else {
      throw new Meteor.Error('access-denied');
    }
  },
  async userToggleBlocked(userId) {
    check(userId, String);
    if (!(await isAdmin(this.userId))) {
      throw new Meteor.Error('access-denied');
    }
  },
  async retrieveEmails(userIds) {
    if (!this.userId) {
      return null;
    }
    return userIds
      .map(async function (uid) {
        const user = await Meteor.users.findOneAsync(uid);
        if (user) {
          return user.username + ' <' + user.emails[0].address + '>';
        }
        return '';
      })
      .filter((x) => x !== '')
      .join(',');
  },
  async totalUsers() {
    return Meteor.users.find().countAsync();
  },
  async userUpdateEmail(userid, oldAddress, newAddress) {
    if (!(await isAdmin(this.userId))) {
      throw new Meteor.Error('access-denied');
    }
    await Meteor.users.updateAsync(
      { _id: userid, 'emails.address': oldAddress },
      { $set: { 'emails.$.address': newAddress, 'emails.$.verified': false } }
    );
  },
  async impersonateUser(username) {
    if (await isAdmin(this.userId)) {
      const u = await Meteor.users.findOneAsync({ username });
      console.log('impersonating ' + u.username);
      this.setUserId(u._id);
    }
  },
  async correctParticipants(userId) {
    if (this.userId !== userId && !(await isAdmin(this.userId))) {
      return;
    }
    const user = await Meteor.users.findOneAsync(userId);
    if (user) {
      await Tournaments.updateAsync(
        { 'participants.user': userId },
        {
          $set: {
            lastChange: new Date(),
            'participants.$.username': user.username,
            'participants.$.sex': user.profile.sex,
          },
        },
        { multi: true }
      );
      await Tournaments.updateAsync(
        { 'participants.responsible': userId },
        {
          $set: {
            lastChange: new Date(),
            'participants.$.responsibleName': user.username,
          },
        },
        { multi: true }
      );
      await Tournaments.updateAsync(
        { responsible: userId },
        {
          $set: {
            lastChange: new Date(),
            responsibleName: user.username,
          },
        },
        { multi: true }
      );
      await Blogs.updateAsync(
        { author: userId },
        {
          $set: {
            lastChange: new Date(),
            authorName: user.username,
          },
        },
        { multi: true }
      );
    }
  },
});

// status tracking
const activeConnections = new Meteor.Collection(null);

Meteor.onConnection(function (connection) {
  activeConnections.upsert(
    { _id: connection.id },
    {
      $set: {
        ipAddr: connection.clientAddress,
        userAgent: connection.httpHeaders['user-agent'],
      },
    }
  );
  connection.onClose(() => {
    activeConnections.removeAsync(connection.id);
  });
});

Accounts.onLogin(function (attempt) {
  activeConnections.upsert(
    { _id: attempt.connection.id },
    {
      $set: {
        userId: attempt.user._id,
        loginTime: new Date(),
      },
    }
  );
});

activeConnections.find().observe({
  async added(doc) {
    if (doc.userId) {
      await Meteor.users.updateAsync(doc.userId, { $set: { status: { connected: true, status: 'online' } } });
    }
  },
  async changed(doc) {
    if (doc.userId) {
      await Meteor.users.updateAsync(doc.userId, { $set: { status: { connected: true, status: 'online' } } });
    }
  },
  async removed(doc) {
    if (doc.userId) {
      await Meteor.users.updateAsync(doc.userId, { $set: { status: { connected: false, status: 'offline' } } });
    }
  },
});
