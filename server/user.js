Accounts.onLogin(function (attempt) {
  if (attempt.user) {
    Roles.addUsersToRoles(attempt.user, ['user']);
    if (UltiSite.Tournaments.findOne({ 'participants.user': attempt.user._id })) { Roles.addUsersToRoles(attempt.user, ['player']); }
    if (!attempt.user.settings) { Meteor.users.update(attempt.user._id, { $set: { settings: {} } }); }
  }
});

Meteor.publish('usersOverview', function (options) {
  check(options, Object);
  if (this.userId) {
    const fields = {};
    fields.club = 1;
    fields.profile = 1;
    fields.emails = 1;
    fields.status = 1;
    fields.username = 1;

    Meteor.Collection._publishCursor(Meteor.users.find({},
      _.extend(options, { fields })
    ), this, 'usersOverview');
  }
  this.ready();
});
Meteor.methods({
  userRemove(userId) {
    check(userId, String);
    if (UltiSite.isAdmin(this.userId)) {
      Meteor.users.remove(userId);
    } else {
      throw new Meteor.Error('access-denied');
    }
  },
  userToggleBlocked(userId) {
    check(userId, String);
    if (!UltiSite.isAdmin(this.userId)) {
      throw new Meteor.Error('access-denied');
    }
  },
  retrieveEmails(userIds) {
    if (!this.userId) { return null; }
    return userIds.map(function (uid) {
      const user = Meteor.users.findOne(uid);
      if (user) { return user.username + ' <' + user.emails[0].address + '>'; }
      return '';
    }).filter(x => x !== '').join(',');
  },
  totalUsers() {
    return Meteor.users.find().count();
  },
  userUpdateEmail(userid, oldAddress, newAddress) {
    if (!UltiSite.isAdmin(this.userId)) { throw new Meteor.Error('access-denied'); }
    Meteor.users.update({ _id: userid, 'emails.address': oldAddress }, { $set: { 'emails.$.address': newAddress, 'emails.$.verified': false } });
  },
  impersonateUser(username) {
    if (UltiSite.isAdmin(this.userId)) {
      const u = Meteor.users.findOne({ username });
      console.log('impersonating ' + u.username);
      this.setUserId(u._id);
    }
  },
  correctParticipants(userId) {
    if (this.userId !== userId && !UltiSite.isAdmin(this.userId)) { return; }
    const user = Meteor.users.findOne(userId);
    if (user) {
      UltiSite.Tournaments.update({ 'participants.user': userId }, {
        $set: {
          lastChange: new Date(),
          'participants.$.username': user.username,
          'participants.$.sex': user.profile.sex,
        },
      }, { multi: true });
      UltiSite.Tournaments.update({ 'participants.responsible': userId }, {
        $set: {
          lastChange: new Date(),
          'participants.$.responsibleName': user.username,
        },
      }, { multi: true });
      UltiSite.Tournaments.update({ responsible: userId }, {
        $set: {
          lastChange: new Date(),
          responsibleName: user.username,
        },
      }, { multi: true });
      UltiSite.Blogs.update({ author: userId }, {
        $set: {
          lastChange: new Date(),
          authorName: user.username,
        },
      }, { multi: true });
    }
  },
});

// status tracking
const activeConnections = new Meteor.Collection(null);

Meteor.onConnection(function (connection) {
  activeConnections.upsert({ _id: connection.id }, {
    $set: {
      ipAddr: connection.clientAddress,
      userAgent: connection.httpHeaders['user-agent'],
    },
  });
  connection.onClose(() => {
    activeConnections.remove(connection.id);
  });
});

Accounts.onLogin(function (attempt) {
  activeConnections.upsert({ _id: attempt.connection.id }, {
    $set: {
      userId: attempt.user._id,
      loginTime: new Date(),
    },
  });
});

activeConnections.find().observe({
  added(doc) {
    if (doc.userId) { Meteor.users.update(doc.userId, { $set: { status: { connected: true, status: 'online' } } }); }
  },
  changed(doc) {
    if (doc.userId) { Meteor.users.update(doc.userId, { $set: { status: { connected: true, status: 'online' } } }); }
  },
  removed(doc) {
    if (doc.userId) { Meteor.users.update(doc.userId, { $set: { status: { connected: false, status: 'offline' } } }); }
  },
});
