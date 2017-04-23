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
    userUpdateEmail(userid, oldAddress, newAddress) {
        if(!UltiSite.isAdmin(this.userId))
            throw new Meteor.Error('access-denied');
        Meteor.users.update({_id:userid,'emails.address':oldAddress},{$set:{'emails.$.address':newAddress,'emails.$.verified':false}})
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
                    lastChange:new Date(),
                    'participants.$.username': user.username,
                    'participants.$.sex': user.profile.sex
                }
            }, { multi: true });
            UltiSite.Teams.update({ 'participants.responsible': userId }, {
                $set: {
                    lastChange:new Date(),
                    'participants.$.responsibleName': user.username
                }
            }, { multi: true });
            UltiSite.Teams.update({ responsible: userId }, {
                $set: {
                    lastChange:new Date(),
                    responsibleName: user.username
                }
            }, { multi: true });
            UltiSite.Blogs.update({ author: userId }, {
                $set: {
                    lastChange:new Date(),
                    authorName: user.username
                }
            }, { multi: true });
        }
    }
});

// status tracking
const activeConnections = new Meteor.Collection(null);

Meteor.onConnection(function(connection) {
    activeConnections.upsert({_id: connection.id},{$set:{      
        ipAddr: connection.clientAddress,
        userAgent: connection.httpHeaders['user-agent']
    }});
    connection.onClose(()=>{
        activeConnections.remove(connection.id);
    })
});

Accounts.onLogin(function(attempt) {
    activeConnections.upsert({_id: attempt.connection.id},{$set:{      
        userId:attempt.user._id,
        loginTime: new Date(),
    }});
});

activeConnections.find().observe({
    added(doc) {
        if(doc.userId)
            Meteor.users.update(doc.userId,{$set:{status:{connected:true, status:'online'}}});
    },
    changed(doc) {
        if(doc.userId)
            Meteor.users.update(doc.userId,{$set:{status:{connected:true, status:'online'}}});
    },
    removed(doc) {
        if(doc.userId)
            Meteor.users.update(doc.userId,{$set:{status:{connected:false, status:'offline'}}});
    }
});
