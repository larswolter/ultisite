var collectionLookup = new Meteor.Collection(null);

UltiSite = {};

moment.locale("de", {
    relativeTime: {
        future: "%s noch",
        past: "%s her",
        s: "Sekunden",
        m: "eine Minute",
        mm: "%d Minuten",
        h: "eine Stunde",
        hh: "%d Stunden",
        d: "ein Tag",
        dd: "%d Tage",
        M: "ein Monat",
        MM: "%d Monate",
        y: "ein Jahr",
        yy: "%d Jahre"
    }
});

Ground.Collection(Meteor.users, {
    
});
if(Meteor.isServer) {
    const appCacheConfig = {
        onlineOnly: ['/icons/countries/']
    };
    if(Meteor.absoluteUrl('').indexOf('localhost') > -1) {
        appCacheConfig.chrome = false;
        appCacheConfig.firefox = false;
        appCacheConfig.ie = false;
    }
    Meteor.AppCache.config(appCacheConfig);
}

var subCallbacks = {
    onReady: function () {
        console.log("Subscription ready", this.name);
    },
    onStop: function (err) {
        if (err)
            console.log("Subscription stopped on error", this.name, ":", err);
        else
            console.log("Subscription stopped", this.name);
        //UltiSite.permSubscriptions.pop(this);
    }
};

_.extend(UltiSite, {
    subscribeTournament: function (id) {
        if (!id)
            return;
        var arr = this.subscribedTournaments.get();
        if (typeof (id) !== 'string') {
            var neu = _.union(arr, id);
            if (neu.length === arr.length)
                return;
            arr = neu;
        } else {
            if (_.contains(arr, id))
                return;
            arr.push(id);
        }
        this.subscribedTournaments.set(_.compact(arr));
    },
    subscribeFiles: function (id) {
        if (!id)
            return;
        var arr = this.subscribedFiles.get();
        if (typeof (id) !== 'string') {
            var neu = _.union(arr, id);
            if (neu.length === arr.length)
                return;
            arr = neu;
        } else {
            if (_.contains(arr, id))
                return;
            arr.push(id);
        }
        this.subscribedFiles.set(_.compact(arr));
    },
    subscribeBlogs: function (id) {
        if (!id)
            return;
        var arr = this.subscribedBlogs.get();
        if (typeof (id) !== 'string') {
            var neu = _.union(arr, id);
            if (neu.length === arr.length)
                return;
            arr = neu;
        } else {
            if (_.contains(arr, id))
                return;
            arr.push(id);
        }
        this.subscribedBlogs.set(_.compact(arr));
    },
    subscribeUser: function (id) {
        if (!id)
            return;
        var arr = this.subscribedUsers.get();
        if (typeof (id) !== 'string') {
            var neu = _.union(arr, id);
            if (neu.length === arr.length)
                return;
            arr = neu;
        } else {
            if (_.contains(arr, id))
                return;
            arr.push(id);
        }
        this.subscribedUsers.set(_.compact(arr));
    },
    subscribedUsers: new ReactiveVar([]),
    subscribedTournaments: new ReactiveVar([]),
    subscribedFiles: new ReactiveVar([]),
    subscribedBlogs: new ReactiveVar([]),
    tournamentsReady: new ReactiveVar(false),
    wikiPagesReady: new ReactiveVar(false),
    blogsReady: new ReactiveVar(false),
    filesReady: new ReactiveVar(false),
    usersReady: new ReactiveVar(false),
    myTeamIds: new ReactiveVar([]),
    schemas: {
        links: new ReactiveVar(null),
        team: new ReactiveVar(null),
        tournament: new ReactiveVar(null),
        user: new ReactiveVar(null),
        userRegister: new ReactiveVar(null),
        blog: new ReactiveVar(null),
        emailServerSchema: new ReactiveVar(null)
    },
    initialSubsReady: new ReactiveVar(false),
    LookupId: new Ground.Collection(null),
    LastChanges: new Meteor.Collection('LastChanges'),
    WikiPages: new Meteor.Collection("WikiPages"),
    WikiPageDiscussions: new Meteor.Collection("WikiPagDiscussiones"),
    Blogs: new Meteor.Collection("Blogs"),
    Statistics: new Meteor.Collection("Statistics"),
    Practices: new Ground.Collection("Practices"),
    Tournaments: new Meteor.Collection("Tournaments", {
        transform: function (doc) {
            return _.extend(doc, {
                teams: UltiSite.Teams.find({
                    tournamentId: doc._id
                }).map(function (team) {
                    return team._id;
                })
            });
        }
    }),
    TournamentList: new Meteor.Collection("tournamentList", {
        transform: function (doc) {
            return _.extend(doc, {
                teams: UltiSite.Teams.find({
                    tournamentId: doc._id
                }).map(function (team) {
                    return team._id;
                })
            });
        }
    }),
    Teams: new Ground.Collection("Teams", {
    }),
    Participants: new Ground.Collection("Participants", {
    }),
    Events: new Meteor.Collection("Events"),
    Ffindr: new Meteor.Collection("Ffindr"),
    Countries: new Ground.Collection("Countries"),
    Cities: new Meteor.Collection("Cities"),
    ContentVersions: new Meteor.Collection("ContentVersions"),
    Images: new Meteor.Collection("photos", {
        transform: function (doc) {
            return _.extend(doc, {
                isImage() {
                    return true;
                },
                url(size) {
                    if(size)
                        return '/_image?imageId='+doc._id+'&size='+size;
                    return '/_image?imageId='+doc._id;
                }
            });
        }
    }),
    Documents: new Meteor.Collection("documents", {
        transform: function (doc) {
            return _.extend(doc, {
                isImage() {
                    return false;
                },
                url(size) {
                    if(size)
                        return false;
                    return '/_document?docId='+doc._id;
                }
            });
        }
    }),
    Folders: new Ground.Collection("Folders", {
    }),
});

_.extend(UltiSite, {
    getAlias: function (userOrId) {
        if (typeof (userOrId) === "undefined")
            return "Unbekannt";
        if (userOrId === null)
            return "Unbekannt";
        var user = Meteor.users.findOne(userOrId);
        if (user)
            return user.username;
        if (userOrId.username)
            return userOrId.username;
    },
    getAnyById: function (ids) {
        if (!ids)
            return [];
        var self = this;
        var idArray = ids;
        if (!idArray.length)
            return undefined;
        if (typeof (idArray) === "string")
            idArray = [ids];
        let res;
        if (typeof (ids) === "string") {
            res = UltiSite.LookupId.findOne(ids);
            if(res)
                return res;
        }
        else {
            res = UltiSite.LookupId.find({
                _id: {
                    $in: ids
                }
            });
            if(res.count() === idArray.length)
                return res;
        }
        Meteor.call("getAnyObjectByIds", idArray, function (err, res) {
            if (err)
                console.log(err);
            else
                res.forEach(function (o) {
                    var elem = o;
                    if (elem.type === 'team')
                        elem = _.extend({
                            link: FlowRouter.path("tournament", {
                                _id: elem.tournamentId
                            })
                        }, elem);
                    else if (elem.type === 'folder')
                        elem = _.extend({
                            link: FlowRouter.path("files", {
                                _id: elem._id
                            })
                        }, elem);
                    else
                        elem = _.extend({
                            link: FlowRouter.path(elem.type, {
                                _id: elem._id
                            })
                        }, elem);
                    let existing = UltiSite.LookupId.findOne(elem._id);
                    if(!existing)
                        UltiSite.LookupId.insert(elem);
                    else if(!existing.link && elem.link)
                        UltiSite.LookupId.update(elem._id,{$set:{link:elem.link}});
                });
        });
        return res;
    },
    hostname: function () {
        var host = Meteor.absoluteUrl("");
        if (host[host.length - 1] === "/")
            host = host.substr(0, host.length - 1);
        return host;
    },
    settings: function () {
        if(Meteor.isClient)
            return Meteor.settings.public;
        else
            return UltiSite.Settings.findOne() || {};
    },
    isAdmin: function (userid, con) {
        if (!userid && Meteor.isServer)
            userid = this.userId;
        if (!userid && Meteor.isClient)
            userid = Meteor.userId();
        return Roles.userIsInRole(userid, ['admin']);
    },

    userByAlias: function (alias, con) {
        return Meteor.users.findOne({
            username: alias
        });
    },
    textState: function (state) {
        if (state === 100)
            return "Sicher";
        else if (state >= 50)
            return "Vielleicht";
        else if (state >= 10)
            return "Interesse";
        else
            return "Kann nicht";
    },

});


Meteor.methods({
    getAnyObjectById: function (id) {
        var res = this.getAnyObjectByIds([id]);
        if (res.length === 1) {
            if (res[0].count() === 1)
                return res[0].fetch()[0];
        }
    },
    getAnyObjectByIds: function (ids) {
        if (!ids)
            return [];
        var res = [];

        res = res.concat(
            UltiSite.Folders.find({
                _id: {
                    $in: ids
                }
            }).map(function (elem) {
                return {
                    _id: elem._id,
                    name: elem.name,
                    type: "folder"
                };
            }));
        res = res.concat(
            UltiSite.WikiPages.find({
                _id: {
                    $in: ids
                }
            }).map(function (elem) {
                return {
                    _id: elem._id,
                    name: elem.name,
                    type: "wikipage"
                };
            }));
        res = res.concat(
            UltiSite.Tournaments.find({
                _id: {
                    $in: ids
                }
            }).map(function (elem) {
                return {
                    _id: elem._id,
                    name: elem.name,
                    type: "tournament"
                };
            }));
        res = res.concat(
            UltiSite.Teams.find({
                _id: {
                    $in: ids
                }
            }).map(function (elem) {
                return {
                    _id: elem._id,
                    tournamentId: elem.tournamentId,
                    name: elem.name,
                    type: "team"
                };
            }));
        res = res.concat(
            Meteor.users.find({
                _id: {
                    $in: ids
                }
            }).map(function (elem) {
                return {
                    _id: elem._id,
                    name: elem.username,
                    type: "user"
                };
            }));
        res = res.concat(
            UltiSite.Blogs.find({
                _id: {
                    $in: ids
                }
            }).map(function (elem) {
                return {
                    _id: elem._id,
                    name: elem.title,
                    type: "blog"
                };
            }));
        if(this.isSimulation)
            res.forEach(function(obj){
               UltiSite.LookupId.upsert(obj._id, obj); 
            });
        return res;
    }
});

String.prototype.toCamelCase = function () {
    var str = this;
    // Replace special characters with a space
    str = str.replace(/[^a-zA-Z0-9 ]/g, " ");
    // put a space before an uppercase letter
    str = str.replace(/([a-z](?=[A-Z]))/g, '$1 ');
    // Lower case first character and some other stuff that I don't understand
    str = str.replace(/([^a-zA-Z0-9 ])|^[0-9]+/g, '').trim().toLowerCase();
    // uppercase characters preceded by a space or number
    str = str.replace(/([ 0-9]+)([a-zA-Z])/g, function (a, b, c) {
        return b.trim() + c.toUpperCase();
    });
    return str;
};