Accounts.onLogin(function (attempt) {
    if (attempt.user) {
        if (!attempt.user.settings || !attempt.user.settings.email) {
            Meteor.users.update(attempt.user._id, {
                $set: {
                    'settings.email.wiki': 'daily',
                    'settings.email.tournament': 'daily',
                    'settings.email.team': 'daily',
                    'settings.email.files': 'daily',
                    'settings.email.blog': 'daily'
                }
            })
        }
    }
});

Meteor.startup(function () {
    UltiSite.getEvents = function (limitCount) {
        let search = { 'detail.time': { $gte: moment().subtract(1, 'day').toDate() } };
        if (limitCount)
            search = {};
        let events = {};
        UltiSite.Events.find(search, {
            sort: {
                'detail.time': -1
            },
            limit: limitCount
        }).forEach(function (event) {
            event.url = FlowRouter.url(event.route, { _id: event.groupBy });
            event.detail.timeFormatted = moment(event.detail.time).format('DD.MM. HH:mm');
            if (events[event.groupBy])
                events[event.groupBy].detail.push(event.detail);
            else {
                events[event.groupBy] = event;
                events[event.groupBy].detail = [event.detail];
            }
        });
        return eventList = Object.keys(events).map(function (key) {
            return events[key];
        });
    };

    SyncedCron.add({
        name: 'Daily E-mail digest',
        schedule: function (parser) {
            // parser is a later.parse object
            return parser.text('at 15:09');
        },
        job: function () {
            var result = 0;
            console.log('sending digests');
            let eventList = UltiSite.getEvents();
            Meteor.users.find().forEach(function (user) {
                if (UltiSite.sendEventDigest(user, eventList))
                    result++;
            });
            return eventList.length + " Digest events send to " + result + " users";
        }
    });
    if(Meteor.absoluteUrl('').indexOf('localhost') === -1)
        SyncedCron.start();
});


UltiSite.sendEventDigest = function (user, eventList) {
    if (eventList.length === 0)
        return false;
    if (user.settings.noDigestMail)
        return false;
    var template = Assets.getText('mail-templates/events.html');
    var layout = Assets.getText('mail-templates/layout.html');

    UltiSite.Mail.send([user._id], 'Tägliche Zusammenfassung',
        UltiSite.renderMailTemplate(layout, template, {
            user: user,
            profilUrl: FlowRouter.url('user', { _id: user._id }),
            events: eventList,
        }));
    return true;
};

var sendEvent = function (user, event) {
    var template = Assets.getText('mail-templates/event.html');
    var layout = Assets.getText('mail-templates/layout.html');

    UltiSite.Mail.send([user._id], event.name,
        UltiSite.renderMailTemplate(layout, template, {
            user: user,
            profilUrl: FlowRouter.url('user', { _id: user._id }),
            event: event,
        }));
    return true;
};

Meteor.methods({
    /**
    info.type
    info.text
    info._id
    */
    addEvent: function (info) {
        info.time = new Date();
        UltiSite.LastChanges.upsert({
            type: info.type
        }, {
                $set: {
                    type: info.type,
                    date: new Date()
                }
            });
        if (!UltiSite.isAdmin(this.userId) || !info.userId)
            info.userId = this.userId
        info.alias = UltiSite.getAlias(info.userId);
        if (info.type === 'files' && info.images) {
            var ev = UltiSite.Events.findOne({
                groupBy: info._id,
                'detail.userId': info.userId,
                'detail.time': {
                    $gt: moment().subtract(5, 'minutes').toDate()
                },
                'detail.text': info.text
            });
            if (ev)
                UltiSite.Events.update(ev._id, {
                    $push: {
                        images: info.images[0]
                    },
                });
        }
        var route, name, additional, group;
        if (info.type === "team" || info.type === "tournament") {
            group = info.type == "team" ? UltiSite.Teams.findOne(info._id || info.group).tournamentId : info._id;
            var tourney = UltiSite.Tournaments.findOne(group);
            route = "tournament";
            name = tourney.name;
            additional = moment(tourney.date).format("DD.MM.YY") + " in " + tourney.address.city;
        } else if (info.type == "wiki") {
            var page = UltiSite.WikiPages.findOne(info._id);
            group = info._id;
            route = "wikipage";
            name = page.name;
            additional = moment(page.created).format("DD.MM.YY");
        } else if (info.type == "blog") {
            var page = UltiSite.Blogs.findOne(info._id);
            group = info._id;
            route = "blog";
            name = page.title;
            additional = moment(page.created).format("DD.MM.YY");
        } else {
            group = info._id,
                route = info.type,
                name = info.name,
                additional = info.additional
        }
        UltiSite.Events.insert({
            route: route,
            groupBy: group,
            name: name,
            additional: additional,
            detail: info,
        }, function (err, res) {
            console.log('inserted event:', err, res);
            var search = {};
            search['settings.email.' + route] = 'immediate';
            Meteor.users.find(search).forEach(function (user) {
                sendEvent(user, UltiSite.Events.findOne(res));
            });
        });
    },
    removeEvent: function (id) {
        UltiSite.Events.remove({
            $or: [
                { groupBy: id },
                { 'detail._id': id }
            ]
        });
        UltiSite.Events.udate({
            $pull: { images: id }
        });
    }
});