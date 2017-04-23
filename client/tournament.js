
Template.tournament.onCreated(function () {
    this.bodyVisible = new ReactiveVar(!Meteor.user());

    this.autorun(() => {
        this.subscribe('tournamentDetails', FlowRouter.getRouteName() === 'tournament' ? FlowRouter.getParam('_id') : null, (err) => {
        });
    });

    this.autorun(() => {
        let t = UltiSite.getTournament(FlowRouter.getParam('_id'));
        if (!t)
            return;

        let from = moment(t.date).clone().subtract(1, "days").toDate();
        let to = moment(t.date).clone().add(t.numDays + 1, "days").toDate();
        this.subscribe("Tournaments", null, {
            date: {
                $gte: from,
                $lte: to
            }
        });

        if (((!t.teams) || (t.teams.length === 0)) && this.bodyVisible.get() === null)
            this.bodyVisible.set(true);
    });
});


Template.tournament.events({
    'click .action-add-team': function(e) {
        e.preventDefault();
        UltiSite.showModal('teamUpdate', {tournamentId:this._id});
    },
    'click .action-edit-tournament': function(e) {
        e.preventDefault();
        UltiSite.showModal('tournamentUpdate', { tournament:this, type:'update' });
    },
    
    'click .action-participate': function(e) {
        e.preventDefault();
        UltiSite.showModal('participateDialog', this);
    },
    'click .preview-content': function (e) {
        $(e.currentTarget).toggleClass("active");
    },
    'click .toggle-tournament-body': function (e, t) {
        t.bodyVisible.set(!t.bodyVisible.get());
    },
    'click .tournament-remove': function (e) {
        e.preventDefault();
        UltiSite.confirmDialog("Willst du das Turnier wirklich löschen?", () => {
            UltiSite.Tournaments.remove(FlowRouter.getParam('_id'), UltiSite.userFeedbackFunction("Turnier löschen"));
            UltiSite.offlineRemoveTournament(FlowRouter.getParam('_id'));
            FlowRouter.go("tournaments");
        });
    },
    'click .action-show-files': function (e) {
        e.preventDefault();
        UltiSite.fileBrowserShowDialog(FlowRouter.getParam('_id'));
    },
    'click .action-add-infos': function (e) {
        e.preventDefault();
        UltiSite.getHTMLTextDialog({ content: '' }, function (text) {
            UltiSite.Tournaments.update({
                _id: FlowRouter.getParam('_id')
            }, {
                $set:{
                    lastChange:new Date()
                },
                $push: {
                    description: {
                        $each: [{
                            _id: Random.id(),
                            content: text,
                            date: new Date(),
                            editor: Meteor.userId()
                        }],
                        $position: 0
                    }
                }
            });
        });
    },
    'click .action-edit-infos': function (e) {
        e.preventDefault();
        var self = this;
        UltiSite.getHTMLTextDialog({ content: self.content }, function (text) {
            Meteor.call('tournamentUpdateInfos', FlowRouter.getParam('_id'), self._id, text);
        });
    },
    'click .action-remove-infos': function (e, t) {
        UltiSite.confirmDialog("Sollen diese Informationen endgültig gelöscht werden?", () => {
            UltiSite.Tournaments.update({
                _id: FlowRouter.getParam('_id')
            }, {
                $set:{
                    lastChange:new Date()
                },
                $pull: {
                    description: {
                        _id: this._id
                    }
                }
            });
        });
    },
    'click .action-edit-report': function (e) {
        e.preventDefault();
        var self = this;
        UltiSite.getHTMLTextDialog({ content: self.content }, function (text) {
            Meteor.call('tournamentUpdateReport', FlowRouter.getParam('_id'), self._id, text);
        });
    },
    'click .action-remove-report': function (e, t) {
        var id = t.$(e.currentTarget).attr('data-id');
        UltiSite.confirmDialog("Soll dieser Bericht endgültig gelöscht werden?", () => {
            UltiSite.Tournaments.update({
                _id: FlowRouter.getParam('_id')
            }, {
                $set:{
                    lastChange:new Date()
                },
                $pull: {
                    reports: {
                        _id: id
                    }
                }
            });
        });
    },
    'click .action-add-report': function (e) {
        e.preventDefault();
        UltiSite.getHTMLTextDialog({ content: '' }, function (text) {
            Meteor.call('tournamentAddReport', FlowRouter.getParam('_id'), {
                _id: Random.id(),
                content: text,
                date: new Date(),
                editor: Meteor.userId()
            });
        });
    }

});

Template.tournamentUpdate.helpers({
    tournamentSchema: function () {
        return UltiSite.schemas.tournament.get();
    }
});


Template.tournament.helpers({
    over: function () {
        var t = UltiSite.getTournament(FlowRouter.getParam('_id'));

        if (t && moment(t.date).isBefore(moment(), "day"))
            return true;
        return false;
    },
    mapsLink: function () {
        return 'https://www.google.de/maps/@' + this.address.geocoords.split(',').reverse().join(',') + ',11z';
    },
    tournament: function () {
        if(!FlowRouter.getParam('_id'))
            return;
        return UltiSite.getTournament(FlowRouter.getParam('_id'));
    },
    tournamentBodyVisible: function () {
        return Template.instance().bodyVisible.get();
    },
    noDescription: function () {
        return (this.description == undefined) || this.description.isEmpty;
    },
    saveDescription: function () {
        var self = this;
        var tournamentId = FlowRouter.getParam('_id');
        return function (newContent, finished) {
            UltiSite.Tournaments.update({
                _id: tournamentId
            }, {
                $set:{
                    lastChange:new Date()
                },
                $pull: {
                    description: {
                        _id: self._id
                    }
                }
            });
            UltiSite.Tournaments.update({
                _id: tournamentId
            }, {
                $set:{
                    lastChange:new Date()
                },
                $push: {
                    description: {
                        $each: [{
                            _id: self._id,
                            content: newContent.trim(),
                            date: self.date,
                            editDate: new Date(),
                            editor: Meteor.userId()
                        }],
                        $position: 0
                    }
                }

            },
            finished);
        };
    },
    saveReport: function () {
        var self = this;
        var tournamentId = FlowRouter.getParam('_id');
        return function (newContent, finished) {
            UltiSite.Tournaments.update({
                _id: tournamentId
            }, {
                $pull: {
                    reports: {
                        _id: self._id
                    }
                }
            });
            UltiSite.Tournaments.update({
                _id: tournamentId
            }, {
                $set:{
                    lastChange:new Date()
                },
                $push: {
                    reports: {
                        $each: [{
                            _id: self._id,
                            content: newContent.trim(),
                            date: self.date,
                            editDate: new Date(),
                            editor: Meteor.userId()
                        }],
                        $position: 0
                    }
                }

            },
            finished);
        };
    },
    isEmpty: function () {
        if (this.content.length === 0)
            return true;
        return false;
    },
    fileCount: function () {
        return UltiSite.Images.find({
            associated: FlowRouter.getParam('_id')
        }).count() + UltiSite.Documents.find({
            associated: FlowRouter.getParam('_id')
        }).count();
    },
    myContent: function () {
        return !!Meteor.userId();
    },
    address: function () {
        var t = UltiSite.getTournament(FlowRouter.getParam('_id')) || {};
        return t.address;
    },
    contact: function () {
        var t = UltiSite.getTournament(FlowRouter.getParam('_id')) || {};
        var address = {};
        if (t.contactDetails)
            t.contactDetails.forEach(function (elem) {
                if (elem.type == "email")
                    address = elem;
            });
        return address;
    },
    teamObjects: function () {
        const teams = this.teams || [];

        return teams.map(function (id) {
            const teamObj = UltiSite.getTeam(id) || {name: '-unbekannt-'};
            return _.extend({
                stateColor: UltiSite.stateColor(teamObj.state)
            }, teamObj);
        });
    }
});

Template.tournamentUpdate.events({
    'shown.bs.modal #tournamentUpdateDialog': function (e, t) {
        t.visible.set(true);
    },
    'hide.bs.modal #tournamentUpdateDialog': function (e, t) {
        //t.visible.set(false);
    }
});
Template.tournamentUpdate.helpers({
    isVisible: function () {
        return false;//Template.instance().visible.get();
    }
});
Template.tournamentUpdate.onCreated(function () {
    this.visible = new ReactiveVar(false);
});