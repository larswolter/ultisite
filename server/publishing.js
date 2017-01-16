Meteor.startup(function () {
    Meteor.publish("Blogs", function (limit) {
        const search = {};
        if (!this.userId)
            search.public = true;

        return UltiSite.Blogs.find(search, {
            limit,
            sort: {
                date: -1
            },
            fields: {
                content: 0
            }
        });
    });
    Meteor.publish("Blog", function (_id) {
        return UltiSite.Blogs.find({_id});
    });
    Meteor.publish(null, function () {

        if (UltiSite.isAdmin(this.userId))
            return Roles.getAllRoles();
        this.ready();
    });
    Meteor.publish('LastChanges', function (types) {
        if (types)
            return UltiSite.LastChanges.find({
                type: {
                    $in: types
                }
            });
        return UltiSite.LastChanges.find();
    });
    Meteor.publish("Statistics", function (target) {
        const res = UltiSite.Statistics.find({
            target
        });
        if (res.count() === 0)
            Meteor.call('computeStatistics', target);
        return res;
    });
    Meteor.publish("Files", function (associatedIds, others) {
        if (!Array.isArray(associatedIds))
            associatedIds = [associatedIds];
        return [UltiSite.Images.find({
            $or: [{
                associated: {
                    $in: associatedIds
                }
            }, {
                _id: {
                    $in: associatedIds
                }
            }]
        },{fields:{base64:0,thumb:0}}), UltiSite.Documents.find({
            $or: [{
                associated: {
                    $in: associatedIds
                }
            }, {
                _id: {
                    $in: associatedIds
                }
            }]
        }), UltiSite.Folders.find()
        ];
    });
    Meteor.publish("UserDetails", function (userId) {
        if (!this.userId)
            return this.ready();
        return Meteor.users.find({
            _id: { $in: [userId, this.userId] }
        },{
            fields:{
                profile:1,
                status:1,
                settings:1,
                club:1,
                username:1,
                roles:1,
                emails:1,
                downloadToken:1
            }});
    });
    Meteor.publish("Events", function () {
        if (!this.userId)
            return undefined;
        return UltiSite.Events.find({
        }, {
            limit: 30,
            sort: { 'detail.time': -1 }
        });
    });
    Meteor.publishComposite("tournamentDetails", function (tournamentId) {
        if (!this.userId)
            return undefined;
        var userId = this.userId;
        return {
            find: function () {
                return UltiSite.Teams.find({
                    $or: [{
                        tournamentDate: {
                            $gte: moment().startOf('day').toDate()
                        },
                        state: { $ne: 'abgesagt' },
                        clubTeam: true
                    }, {
                        tournamentDate: {
                            $gte: moment().subtract(3, 'month').toDate()
                        },
                        state: 'dabei',
                        clubTeam: true
                    }, {
                        tournamentDate: {
                            $gte: moment().startOf('day').toDate()
                        },
                        'participants.user': userId
                    }, {
                        tournamentDate: {
                            $gte: moment().subtract(3, 'month').toDate()
                        },
                        state: 'dabei',
                        'participants.state': 100,
                        'participants.user': userId
                    }, {
                        tournamentId: tournamentId
                    }]
                });
            },
            children: [{
                find: function (team) {
                    return UltiSite.Tournaments.find({
                        _id: {
                            $in: [tournamentId, team.tournamentId]
                        }
                    });
                }
            }]
        };
    });

    Meteor.publish("Tournaments", function (query, skip, limit) {
        var options = {
            fields: {
                _id: 1,
                date: 1,
                name: 1,
                teams: 1,
                address: 1,
                divisions: 1,
                category: 1,
                ffindr: 1
            },
            sort: {
                date: 1,
                name: 1,
            },
            skip: skip,
            limit: limit
        };

        Meteor.Collection._publishCursor(UltiSite.Tournaments.find(query, options), this, "tournamentList");
    });

    Meteor.publish("WikiPageDiscussions", function (id) {
        return UltiSite.WikiPageDiscussions.find({pageId: id});
    });
    Meteor.publish("ContentVersions", function (id) {
        return UltiSite.ContentVersions.find({associated: id}, { fields: { content: 0 } });
    });
    Meteor.publish("WikiPage", function (id) {
        return UltiSite.WikiPages.find({
            $or: [{
                _id: id
            }, {
                name: id
            }]
        });
    });

    Meteor.publish("ContentVersion", function (id) {
        if (this.userId)
            return UltiSite.ContentVersions.find({ _id: id });
        this.ready();
    });

    Meteor.publish("Practices", function () {
        return UltiSite.Practices.find({
            end: {
                $gt: new Date()
            }
        });
    });
    Meteor.publish("Places", function (country) {
        return UltiSite.Countries.find();
    });
});