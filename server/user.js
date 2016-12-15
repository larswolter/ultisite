Accounts.onLogin(function (attempt) {
    if (attempt.user) {
        Roles.addUsersToRoles(attempt.user, ['user']);
        if (UltiSite.Teams.findOne({ 'participants.user': attempt.user._id }))
            Roles.addUsersToRoles(attempt.user, ['player']);
        if(!attempt.user.settings)
            Meteor.users.update(attempt.user._id,{$set:{settings:{}}});
    }
});

Meteor.publish("usersOverview", function (options) {
    if (this.userId) {
        var fields = {};
        fields.club = 1;
        fields.profile = 1;
        fields.emails = 1;
        fields.status = 1;
        fields.username = 1;

        Meteor.Collection._publishCursor(Meteor.users.find({},
            _.extend(options, { fields: fields })
        ), this, "usersOverview");
    }
    this.ready();
});
Meteor.methods({
    retrieveEmails: function (userIds) {
        if (!this.userId)
            return null;
        return userIds.map(function (uid) {
            var user = Meteor.users.findOne(uid);
            if (user)
                return user.username + ' <' + user.emails[0].address + '>';
            return '';
        }).filter(x => x !== '').join(',');
    },
    totalUsers: function () {
        return Meteor.users.find().count();
    },
    impersonateUser: function (username) {
        if (UltiSite.isAdmin(this.userId)) {
            var u = Meteor.users.findOne({ username: username });
            console.log('impersonating ' + u.username);
            this.setUserId(u._id);
        }
    },
    correctParticipants: function (userId) {
        if (this.userId !== userId && !UltiSite.isAdmin(this.userId))
            return;
        let user = Meteor.users.findOne(userId);
        if (user) {
            UltiSite.Teams.update({ 'participants.user': userId }, {
                $set: {
                    'participants.$.username': user.username,
                    'participants.$.sex': user.profile.sex
                }
            }, { multi: true });
            UltiSite.Teams.update({ 'participants.responsible': userId }, {
                $set: {
                    'participants.$.responsibleName': user.username
                }
            }, { multi: true });
            UltiSite.Teams.update({ responsible: userId }, {
                $set: {
                    responsibleName: user.username
                }
            }, { multi: true });
        }
    }
});

