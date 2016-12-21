var months = new Meteor.Collection(null);
var integratedTournamentList = new Meteor.Collection(null);
var prefillData = new ReactiveVar(undefined);
var tournamentQuery = new ReactiveVar({});
var currentMonth = new ReactiveVar(moment().startOf('month'));
var tabSelection = new ReactiveVar([]);

Meteor.startup(function () {

    UltiSite.integratedTournamentList = integratedTournamentList;
    Session.setDefault("tournament.surface", "Alle");
    Session.setDefault("tournament.category", "Alle");
    Session.setDefault("tournament.division", "Alle");
    Session.setDefault("tournament.type", "Alle");
    Session.setDefault("tournament.teams", false);
    Session.setDefault("tournament.year", "Kommende");
    Tracker.autorun(function () {
        Meteor.subscribe('tournamentDetails', FlowRouter.getRouteName() === 'tournament' ? FlowRouter.getParam('_id') : null, (err) => {
        });
    });
    Tracker.autorun(function () {
        var query = {};
        if (Session.get("tournament.surface") != "Alle")
            query['divisions.surface'] = Session.get("tournament.surface");
        if (Session.get("tournament.division") != "Alle")
            query['divisions.division'] = Session.get("tournament.division");
        if (Session.get("tournament.type") != "Alle")
            query['category'] = Session.get("tournament.type");
        if (Session.get("tournament.year") != "Kommende")
            query['date'] = {
                $gte: moment().year(Session.get("tournament.year")).startOf('year').toDate(),
                $lte: moment().year(Session.get("tournament.year")).endOf('year').toDate()
            };
        else
            query['date'] = {
                $gte: moment().subtract(1, 'day').toDate()
            };
        if (Session.get("tournament.teams"))
            query.teams = { // TODO: change to teams array not empty
                $in: UltiSite.myTeamIds.get()
            };
        tournamentQuery.set(query);
    });
    Tracker.autorun(function () {
        if (UltiSite.screenSize.get() > 767) {
            if (tabSelection.get().length !== 3)
                tabSelection.set(['played', 'planned', 'month']);
        } else if (tabSelection.get().length !== 1) {
            if (Meteor.userId())
                tabSelection.set(['planned']);
            else
                tabSelection.set(['month']);
        }
        console.log("adjusting to screensize....");
    });
    Tracker.autorun(function () {
        var myteams = UltiSite.Teams.find({
            $or: [
                { 'participants.user': Meteor.userId() },
                { clubTeam: true }
            ]
        }).map(function (t) {
            return t._id;
        });
        UltiSite.myTeamIds.set(myteams);
    });
});

Template.tournamentCreate.helpers({
    tournamentSchema: function () {
        return UltiSite.schemas.tournament.get();
    },
    prefill: function () {
        return prefillData.get();
    }
});
Template.tournamentCreate.events({
    'shown.bs.modal .modal': function (e, t) {
        t.subscribe("Places", prefillData.get() ? prefillData.get().address.country : "DE");
    }
});
Template.tournamentUpdate.events({
    'shown.bs.modal .modal': function (e, t) {
        t.subscribe("Places", prefillData.get() ? prefillData.get().address.country : "DE");
    }
});

AutoForm.hooks({
    tournamentUpdateForm: {
        formToModifier: function (doc) {

            if (doc.$set && doc.$set.divisions) {
                doc.$set.divisions = doc.$set.divisions.map((d, idx) => {
                    const surf = doc.$set.surfaces[Math.min(idx, doc.$set.surfaces.length - 1)];
                    return {
                        division: d,
                        surface: surf,
                        numPlayers: surf === 'Sand' || surf === 'Halle' ? 5 : 7
                    };
                });
                doc.$set.surfaces = undefined;
            }
            return doc;
        },
        formToDoc: function (doc) {
            doc.divisions = doc.divisions.map((d, idx) => {
                const surf = doc.surfaces[Math.min(idx, doc.surfaces.length - 1)];
                return {
                    division: d,
                    surface: doc.surfaces[Math.min(idx, doc.surfaces.length - 1)],
                    numPlayers: surf === 'Sand' || surf === 'Halle' ? 5 : 7
                };
            });
            doc.surfaces = undefined;
            return doc;
        },
        docToForm: function (doc) {
            doc.divisions = doc.divisions.map((d) => {
                doc.surfaces = _.union(doc.surfaces || [], [d.surface]);
                return d.division;
            });
            return doc;
        },
        // Called when any submit operation succeeds
        onSuccess: function (formType, result) {
            $('#tournamentUpdateDialog').modal('hide');
        },
        // Called when any submit operation fails
        onError: function (formType, error) {
            console.log('tournamentUpdateForm:', error);
            $.notify('Fehler beim Turnier ändern:' + error.message, "error");
        }
    },
    tournamentCreateForm: {
        formToDoc: function (doc) {
            if (Array.isArray(doc.divisions))
                doc.divisions = doc.divisions.map((d, idx) => {
                    const surf = doc.surfaces[Math.min(idx, doc.surfaces.length - 1)];
                    return {
                        division: d,
                        surface: doc.surfaces[Math.min(idx, doc.surfaces.length - 1)],
                        numPlayers: surf === 'Sand' || surf === 'Halle' ? 5 : 7
                    };
                });
            doc.surfaces = undefined;
            return doc;
        },
        docToForm: function (doc) {
            if (Array.isArray(doc.divisions))
                doc.divisions = doc.divisions.map((d) => {
                    doc.surfaces = _.union(doc.surfaces || [], [d.surface]);
                    return d.division;
                });
            return doc;
        },
        // Called when any submit operation succeeds
        onSuccess: function (formType, result) {
            console.log("inserting tournament successfull", result);
            $('#tournamentCreateDialog').modal('hide');
            $.notify('Turnier angelegt', "success");
            FlowRouter.go("tournament", {
                _id: result
            });
        },

        // Called when any submit operation fails
        onError: function (formType, error) {
            $.notify('Fehler beim Turnier anlegen:' + error.message, "error");
        }
    }
});


Template.tournamentList.events({
    'click .btn-more': function (e) {
        e.preventDefault();
        var neu = null;
        var last = null;
        if (!_.contains(tabSelection.get(), "past")) {
            last = months.findOne({}, {
                sort: {
                    year: -1,
                    code: -1
                }
            });
            neu = moment().year(last.year).month(last.month).startOf('month').add(1, "month");
        } else {
            last = months.findOne({}, {
                sort: {
                    year: 1,
                    code: 1
                }
            });
            neu = moment().year(last.year).month(last.month).startOf('month').subtract(1, "month");
        }
        console.log("additional month:" + neu.format("MM.YYYY"));
        months.insert({
            unix: neu.unix(),
            code: neu.format("MM.YYYY"),
            month: neu.format("MMMM"),
            year: neu.format("YYYY")
        });
        console.log("months", months.find().fetch());

    },
    'click .action-prev-month': function (e, t) {
        e.preventDefault();
        currentMonth.set(currentMonth.get().subtract(1, 'month'));
    },
    'click .action-next-month': function (e, t) {
        e.preventDefault();
        currentMonth.set(currentMonth.get().add(1, 'month'));
    },
    'click .action-use-filter': function (e, t) {
        e.preventDefault();
        tabSelection.set(_.union(_.without(tabSelection.get(), 'month', 'map'), ['filter']));
    },
    'click .action-use-map': function (e, t) {
        e.preventDefault();
        tabSelection.set(_.union(_.without(tabSelection.get(), 'filter', 'month'), ['map']));
    },
    'click .action-use-month': function (e, t) {
        e.preventDefault();
        tabSelection.set(_.union(_.without(tabSelection.get(), 'filter', 'map'), ['month']));
    },
    'click .tournament-tabs a': function (e, t) {
        e.preventDefault();
        tabSelection.set([t.$(e.currentTarget).attr('data-target')]);
    },
    'click .btn-add-tournament': function (e) {
        prefillData.set({
            date: new Date(),
            address: {
                country: "DE"
            },
            divisions: [{
                surface: "Rasen",
                numPlayers: 7,
                name: ""
            }],
            category: "Turnier",
            numDays: 2
        });
    }
});

Template.tournamentList.onCreated(function () {
    var self = this;
    self.autorun(function () {
        if (_.contains(tabSelection.get(), 'month')) {
            console.log("subscribing....");

            self.subscribe("Tournaments", {
                date: {
                    $gte: currentMonth.get().clone().startOf('month').toDate(),
                    $lte: currentMonth.get().clone().endOf('month').toDate()
                }
            });
        } else if (_.contains(tabSelection.get(), 'filter')) {
            self.subscribe("Tournaments", tournamentQuery.get(), 0, 200);
        }
    });

    const offlineIds = [];
    UltiSite.localStore.iterate(function (elem, key) {
        offlineIds.push(key);
        try {
            months.upsert({
                code: moment(elem.date).format('MM.YYYY')
            }, {
                    unix: moment(elem.date).unix(),
                    code: moment(elem.date).format('MM.YYYY'),
                    month: moment(elem.date).format('MMMM'),
                    year: moment(elem.date).format('YYYY')
                });
            elem.date = moment(elem.date).toDate();
            integratedTournamentList.upsert({
                _id: elem._id
            }, elem);
        } catch (exc) {
            console.log("exc:", key);

        }
    }, (err, res) => {
        Meteor.call('offlineTournamentCheck', offlineIds, (err, res) => {
            if (err)
                $.notify('Error checking offline data:' + err, 'error');
            else {
                res.forEach((id) => {
                    UltiSite.localStore.removeItem(id);
                });
            }
        });
    });

    self.autorun(function () {
        UltiSite.TournamentList.find().forEach(function (elem) {
            months.upsert({
                code: moment(elem.date).format('MM.YYYY')
            }, {
                    unix: moment(elem.date).unix(),
                    code: moment(elem.date).format('MM.YYYY'),
                    month: moment(elem.date).format('MMMM'),
                    year: moment(elem.date).format('YYYY')
                });
            elem.lastSync = new Date();
            UltiSite.localStore.setItem(elem._id, elem);
            integratedTournamentList.upsert({
                _id: elem._id
            }, elem);
        });
    });
    self.autorun(function () {
        UltiSite.Tournaments.find().forEach(function (elem) {
            elem.lastSync = new Date();
            UltiSite.localStore.setItem(elem._id, elem);
            integratedTournamentList.upsert({
                _id: elem._id
            }, elem);
        });
    });
});

Template.tournamentList.helpers({

    newestTournament: function () {
        return UltiSite.Tournaments.findOne({
            date: {
                $gte: moment().toDate()
            },
            lastChanged: {
                $gte: moment().subtract(1, 'day').toDate()
            }

        }, { limit: 1, sort: { lastChanged: -1 } });
    },
    plannedTournaments: function () {
        var options = {
            sort: {
                date: 1,
                name: 1
            }
        };
        var from = moment().toDate();
        return integratedTournamentList.find({
            teams: {
                $in: UltiSite.myTeamIds.get()
            },
            date: {
                $gte: from
            }
        }, options);
    },
    playedTournaments: function () {
        let to = moment().toDate();
        let limit = integratedTournamentList.find({
            teams: {
                $in: UltiSite.myTeamIds.get()
            },
            date: {
                $gte: to
            }
        }).count();
        var options = {
            limit: Math.max(5, limit),
            sort: {
                date: -1,
                name: 1
            }
        };
        return integratedTournamentList.find({
            teams: {
                $in: UltiSite.myTeamIds.get()
            },
            date: {
                $lte: to
            }
        }, options);
    },
    showTournamentsFilter: function () {
        return _.contains(tabSelection.get(), "filter");
    },
    showTournamentsMonth: function () {
        return _.contains(tabSelection.get(), "month");
    },
    showTournamentsMap: function () {
        return _.contains(tabSelection.get(), "map");
    },
    showPlayed: function () {
        return _.contains(tabSelection.get(), "played");
    },
    showPlanned: function () {
        return _.contains(tabSelection.get(), "planned");
    },
    activeMonth: function () {
        return {
            month: currentMonth.get().format("MMMM"),
            year: currentMonth.get().format("YYYY")
        };
    },
    formatMonth: function (month) {
        return moment().month(month).format("MMMM");
    },
    filteredTournaments: function () {
        return integratedTournamentList.find(tournamentQuery.get(), {
            sort: {
                date: 1,
                name: 1
            }
        });
    },
    tournaments: function (month, year) {
        var query = {};
        var start = moment().year(year).month(month).startOf("month");
        var end = moment().year(year).month(month).endOf("month");
        query.date = {
            $lte: end.toDate(),
            $gte: start.toDate()
        };
        var list = integratedTournamentList.find(query, {
            sort: {
                date: 1,
                name: 1
            }
        });
        return list;
    }
});

Template.tournamentFilter.events({
    "click a": function (e) {
        e.preventDefault();
        console.log($(e.currentTarget).data('target') + "->" + $(e.currentTarget).text());
        Session.set($(e.currentTarget).data('target'), $(e.currentTarget).text());
    },
    "click .btn-mit-teams": function (e) {
        e.preventDefault();
        $(e.currentTarget).toggleClass("checked");
        Session.set("tournament.teams", $(e.currentTarget).hasClass("checked"));
    }
});

Template.tournamentFilter.helpers({
    surface: function () {
        return Session.get("tournament.surface");
    },
    division: function () {
        return Session.get("tournament.division");
    },
    type: function () {
        return Session.get("tournament.type");
    },
    category: function () {
        return Session.get("tournament.category");
    },
    withTeams: function () {
        return Session.get("tournament.teams");
    },
    year: function () {
        return Session.get("tournament.year");
    },
    tournamentYears: function () {
        return [moment().format("YYYY"),
        moment().subtract(1, "year").format("YYYY"),
        moment().subtract(2, "year").format("YYYY"),
        moment().subtract(3, "year").format("YYYY"),
        moment().subtract(4, "year").format("YYYY"),
        moment().subtract(5, "year").format("YYYY"),
        moment().subtract(6, "year").format("YYYY"),
        moment().subtract(7, "year").format("YYYY")
        ];
    }
});

var helpers = {
    tournament: function () {
        return Template.instance().data._id;
    },
    over: function () {
        if (!Template.instance().data)
            return false;
        if (moment(Template.instance().data.date).isBefore(moment(), "day"))
            return true;
        return false;
    },
    dateState: function () {
        if (moment(Template.instance().data.date).clone().add(Template.instance().data.days, 'days').isBefore(moment()))
            return 'text-muted';
        if (moment(Template.instance().data.date).isAfter(moment()))
            return '';
        return 'text-info';
    },
    tags: function () {
        var tags = [];
        this.divisions.forEach(function (elem) {
            if (elem.division.indexOf("Damen") > -1)
                tags.push({
                    icon: "venus",
                    text: elem.division
                });
            if (elem.division.indexOf("Open") > -1)
                tags.push({
                    icon: "mars",
                    text: elem.division
                });
            if (elem.division.indexOf("Mixed") > -1)
                tags.push({
                    icon: "venus-mars",
                    text: elem.division
                });
            if (elem.division.indexOf("Masters") > -1)
                tags.push({
                    icon: "user-secret",
                    text: elem.division
                });
            if (elem.division.indexOf("Junioren") > -1)
                tags.push({
                    icon: "child",
                    text: elem.division
                });
            if (elem.surface === "Sand")
                tags.push({
                    icon: "sun-o",
                    text: elem.surface
                });
            if (elem.surface === "Halle")
                tags.push({
                    icon: "home",
                    text: elem.surface
                });
        });
        if (this.category === "HAT-Turnier")
            tags.push({
                icon: "graduation-cap",
                text: "HAT"
            });
        else if (this.category === "Veranstaltung")
            tags.push({
                icon: "birthday-cake",
                text: "Event"
            });
        else if (this.category === "DFV-Turnier")
            tags.push({
                img: "/dfv.png",
                text: "DFV Turnier"
            });
        return _.unique(tags, false, function (item) {
            return item.text;
        });
    },
    divisionIcon: function () {
        if (this.division) {
            if (this.division.indexOf("Damen") >= 0)
                return "venus";
            if (this.division.indexOf("Mixed") >= 0)
                return "venus-mars";
            if (this.division.indexOf("Open") >= 0)
                return "mars";
        }
        return "question";
    },
    myTeamState: function () {
        return (_.find(this.participants, (p) => { return p.user === Meteor.userId(); }));
    },
    teaminfo: function () {
        if (!this.teams)
            return [];

        return UltiSite.Teams.find({
            $and: [{
                _id: {
                    $in: this.teams
                }
            }, {
                _id: {
                    $in: UltiSite.myTeamIds.get()
                }
            }]

        }).map(function (team) {
            return _.extend({
                stateColor: UltiSite.stateColor(team.state)
            }, team);
        });
    },
};
Template.tournamentListItem.helpers(helpers);
Template.detailedTournamentListItem.helpers(helpers);


Template.tournament.helpers({
    parallelTournaments: function () {
        var from = moment(this.date).clone().subtract(2, "days").toDate();
        var to = moment(this.date).clone().add(this.numDays + 1, "days").toDate();
        //Template.instance().subscribe("TournamentRange", from, to);
        return UltiSite.TournamentList.find({
            _id: {
                $not: this._id
            },
            date: {
                $gte: from,
                $lte: to
            }
        }, {
                fields: {
                    _id: 1,
                    name: 1
                }
            });
    }
});