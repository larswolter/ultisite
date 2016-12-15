Meteor.startup(function () {
    Meteor.publishComposite("Blogs", function (id) {
        var search = {};
        if (!this.userId)
            search.public = true;
        if (id)
            search._id = id;
        return {
            find: function () {
                return UltiSite.Blogs.find(search, id ? {} : {
                    fields: {
                        content: 0
                    }
                });
            },
            children: [{
                find: function (blog) {
                    return Meteor.users.find(blog.author);
                }
            }, {
                find: function (blog) {
                    return UltiSite.Documents.find({ associated: blog._id });
                }
            },
            ]
        }
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
    Meteor.publish("AdminNotifications", function () {
        var self = this;
        if (UltiSite.isAdmin(this.userId, this.connection)) {
            Meteor.users.find({
                'profile.unverified': {
                    $exists: true
                },
            }).observeChanges({
                added: function (id, fields) {
                    self.added("AdminNotifications", id, {
                        text: "Der Nutzer " + fields.username + " verlangt nach Zugriff auf die Webseite",
                        link: FlowRouter.path("user", {
                            _id: id
                        }),
                        _id: id,
                        method: "userVerification"
                    });
                },
                removed: function (id, fields) {
                    self.removed('AdminNotifications', id);
                }
            });
        }
        self.ready();
    });


    Meteor.publish("Settings", function () {
        var settings = UltiSite.settings();
        return [UltiSite.Settings.find({}, {
            fields: {
                sitePassword: 0,
                'mailingListConfigs.password': 0,
                emailPassword: 0
            }
        }), UltiSite.Images.find({
            _id: {
                $in: [
                    settings.imageLogo,
                    settings.imageTitleImage,
                    settings.imageMobileLogo,
                    settings.imageIcon,
                    settings.imageBackground,
                    settings.imageUserGroup,
                    settings.imageUserW,
                    settings.imageUserM,
                ]
            }
        },{fields:{base64:0}})
        ];
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
        },{fields:{base64:0}}), UltiSite.Documents.find({
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
        return [Meteor.users.find({
            _id: { $in: [userId, this.userId] }
        }), UltiSite.Images.find({
            associated: userId
        },{fields:{base64:0}})];
    });
    Meteor.publish("Events", function () {
        if (!this.userId)
            return undefined;
        return UltiSite.Events.find({}, {
            limit: 40,
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
                    return UltiSite.Images.find({
                        associated: team._id
                    },{fields:{base64:0}});
                }
            }, {
                find: function (team) {
                    return UltiSite.Tournaments.find({
                        _id: {
                            $in: [tournamentId, team.tournamentId]
                        }
                    });
                }
                /*, {
                        find: function (tournament) {
                            return UltiSite.Images.find({
                                associated: tournament._id
                            });
                        }
                    }, {
                        find: function (tournament) {
                            return UltiSite.Documents.find({
                                associated: tournament._id
                            });
                        }
                    }*/
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

    Meteor.publishComposite("WikiPage", function (id) {
        return {
            find: function () {
                return UltiSite.WikiPages.find({
                    $or: [{
                        _id: id
                    }, {
                        name: id
                    }]
                });
            },
            children: [{
                find: function (page) {
                    return UltiSite.Images.find({
                        associated: page._id
                    });
                }

            }, {
                find: function (page) {
                    return UltiSite.WikiPageDiscussions.find({
                        pageId: page._id
                    });
                },
                children: [{
                    find: function (discussion) {
                        return Meteor.users.find({
                            _id: discussion.editor
                        }, { fields: { username: 1 } });
                    }
                }]
            }, {
                find: function (page) {
                    return UltiSite.ContentVersions.find({
                        associated: page._id
                    }, { fields: { content: 0 } });
                },
                children: [{
                    find: function (version) {
                        return Meteor.users.find({
                            _id: version.author
                        }, { fields: { username: 1 } });
                    }
                }]
            }, {
                find: function (page) {
                    return Meteor.users.find({
                        _id: page.editor
                    }, { fields: { username: 1 } });
                }
            }]
        };
    });

    Meteor.publish("ContentVersion", function (id) {
        if (this.userId)
            return UltiSite.ContentVersions.find({ _id: id });
        this.ready();
    });

    Meteor.publish("Practices", function () {
        var practices = UltiSite.Practices.find({
            end: {
                $gt: new Date()
            }
        });
        var pracIds = practices.map(function (p) {
            return p._id;
        });
        return [practices, UltiSite.Images.find({
            associated: {
                $in: pracIds
            }
        },{fields:{base64:0}})];
    });
    Meteor.publish("Places", function (country) {
        return UltiSite.Countries.find();
    });
    /*
        FastRender.onAllRoutes(function () {
            this.subscribe('Settings');
        });*/
});