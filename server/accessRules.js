
var allowByUser = {
    update: function (userId,doc,fields) {
        if (userId)
            return true;
        return false;
    },
    remove: function (userId,doc) {
        if (userId)
            return true;
        return false;
    },
    insert: function (userId,doc) {
        if (userId)
            return true;
        return false;
    }
};

UltiSite.Blogs.allow(allowByUser);
UltiSite.Folders.allow(allowByUser);
UltiSite.Documents.allow(allowByUser);
UltiSite.Images.allow(allowByUser);

UltiSite.Settings.allow({
    update: function (userId, doc, fields) {
        console.log("Settings:", fields);
        if (userId)
            return true;
        return false;
    },
});
UltiSite.Folders.deny({
    remove: function (userId, doc) {
        if (userId) {
            var anzahl = UltiSite.Images.find({
                associated: doc._id
            }).count();
            anzahl += UltiSite.Documents.find({
                associated: doc._id
            }).count();
            if (anzahl === 0)
                return false;
        }
        return true;
    }
});


UltiSite.Teams.allow({
    update: function (userId, team) {
        if(UltiSite.isAdmin(userId))
            return true;
        if(team.responsible===userId)
            return true;
        if (_.find(team.participants,(p)=>{return p.user===userId;}))
            return true;
        return false;
    },
    remove: function (userId, doc) {
        if(UltiSite.isAdmin(userId))
            return true;
        if (!userId)
            return false;
        if(_.find(doc.participants,(p)=>{return p.state === 100;}))
            return false;
        return true;
    },
    insert: function (userId,doc) {
        if (userId)
            return true;
        return false;
    }

});

UltiSite.Participants.allow({
    update: function (userId, part) {
        return false;
    },
    remove: function (userId, doc) {
        return false;
    },
    insert: function (userId,part) {
        return false;
    }

});

UltiSite.Tournaments.allow({
    insert: function (userId) {
        if (!userId)
            return false;
        return true;
    },
    update: function (userId, doc, fields) {
        if (!userId)
            return false;
        if (fields.length === 1 && fields[0] === "description") {
            
            return true;
        }
        if (fields.length === 1 && fields[0] === "reports") {
            return true;
        }
        return true;
    },
    remove: function(userId,doc) {
        if (!userId)
            return false;
        var teams = UltiSite.Teams.findOne({tournamentId:doc._id});
        if(teams)
            return false;
        return true;
    }
});

UltiSite.WikiPageDiscussions.allow({
    update: function(userId,doc) {
        return false;
    },
    insert: function(userId) {
        return false;
    },
    remove: function() {
        return false;
    }
});
UltiSite.WikiPages.allow({
    update: function (userId,doc,fieldNames,modifier) {
        if(UltiSite.isAdmin(userId))
            return true;
        if((fieldNames.length===1) && (fieldNames[0]==="locked") && (!doc.locked || doc.locked === userId))
            return true;
        if(modifier['$set'].editor!==userId)
            return false;
        if (userId)
            return true;
        return false;
    },
    insert: function (userId,doc) {
        if(UltiSite.isAdmin(userId))
            return true;
        if(doc.editor!==userId)
            return false;
        if(doc.owner!==userId)
            return false;
        if (userId)
            return true;
        return false;
    },
    remove: function (userId,doc) {
        if(UltiSite.isAdmin(userId))
            return true;
        if (userId === doc.owner)
            return true;
        return false;
    }
});
UltiSite.Practices.allow({
    update: function (userId,doc) {
        if (userId)
            return true;
        return false;
    },
    remove: function (userId, doc) {
        if (userId)
            return true;
        return false;
    },
    insert: function (userId,doc) {

        if (userId)
            return true;
        return false;
    }
});

Meteor.users.allow({
    update: function (userId,doc,fieldNames,modifier) {
        if(Roles.userIsInRole(userId,['admin']))
            return true;
        if(fieldNames.length > 1)
            return false;
        console.log("user update",fieldNames,modifier);
        if(fieldNames[0]==="profile" || fieldNames[0]==="settings" || fieldNames[0]==="username") {
            if (userId === doc._id)
                return true;
            if(Roles.userIsInRole(userId,[doc._id]))
                return true;
        }
        var allowed=false;
        Object.keys(modifier.$set).forEach(function(key){
            var area = key.split('.')[0];
            var setting = key.split('.')[1];
            console.log("checking role:",userId,area);

            if(Roles.userIsInRole(userId,[area]))
                allowed = true;
        });
        return allowed;
    }
});
