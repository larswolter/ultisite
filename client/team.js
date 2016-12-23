Template.participant.events({
    'click .action-participate': function (e, t) {
        e.preventDefault();
        var partValue = Number(t.$(e.currentTarget).attr('data-participation'));
        var teamId = Template.parentData()._id;
        Meteor.call('participationUpdate', teamId, this.user, partValue);
    },
    'click button.action-comment': function (e, t) {
        e.preventDefault();
        var self = this;
        var teamId = Template.parentData()._id;
        UltiSite.getTextDialog({text:self.comment,header:'Kommentar eingeben'}, function (comment) {
            Meteor.call('participationComment', teamId, self.user, comment, function (err) {
                if (err)
                    t.$('button.action-comment').notify('Konnte Kommentar nicht speicher', 'error');
            });
        });
    },
    'keyup input.comment': function (e, t) {
        t.$('button.comment').removeClass('disabled');
    }
});


Template.team.created = function () {
    var self = this;
    self.searchTerm = new ReactiveVar("");
    self.inviteOther = new ReactiveVar(false);
    this.teamEmails = new ReactiveVar();
    this.autorun(() => {
        if (this.data.participants)
            Meteor.call('retrieveEmails', this.data.participants.map(p => p.user), (err, res) => {
                this.teamEmails.set(res);
            });
    });

};
Template.team.onRendered(function () {
    if (this.find('#team-participants'))
        this.find('#team-participants')._uihooks = {
            moveElement: function (node, next) {
                console.log('moving node');
                const $node = $(node);
                $node.hide({
                    complete() {
                        $node.insertBefore(next);
                        $(node).show(400);
                    }
                });
            }
        };
});


Template.team.events({
    'click .registered': function (e, t) {
        e.preventDefault();
        UltiSite.Teams.update({
            _id: this._id
        }, {
                $set: {
                    state: "angemeldet"
                }
            });
    },
    'click .action-edit-remarks': function(e,t) {
        UltiSite.getHTMLTextDialog({ content: this.remarks,header:'Anmerkungen zum Team bearbeiten' }, (text) => {
            UltiSite.Teams.update(this._id, {
                    $set: {remarks:text}
                });
        });
    },
    'click .team-remove': function (e, t) {
        e.preventDefault();
        UltiSite.confirmDialog("Willst du wirklich das gesamte Team löschen?",() => {
            UltiSite.Teams.remove(this._id, UltiSite.userFeedbackFunction('Team löschen'));
        });
    },
    'click .action-set-state': function (e, t) {
        e.preventDefault();
        let state = t.$(e.currentTarget).attr('data-state');
        if (state === 'dabei') {
            UltiSite.confirmDialog("Sicher, das das Team bestätigt wurde? Jetzt wird auch der Verantwortliche ausgelost!",() =>{
                Meteor.call('teamUpdateState', this._id, state, UltiSite.userFeedbackFunction('Team Status ändern'));
            });
        } else
            Meteor.call('teamUpdateState', this._id, state, UltiSite.userFeedbackFunction('Team Status ändern'));
    },
    'click .action-be-responsible': function (e, t) {
        e.preventDefault();
        UltiSite.Teams.update({
            _id: this._id
        }, {
                $set: {
                    responsible: Meteor.userId()
                }
            });
    }
});

Template.participateDialog.onCreated(function () {
    this.selectedUser = new ReactiveVar(undefined);
    this.inserting = new ReactiveVar(false);
    this.teams = new ReactiveVar([]);
    this.selectedTeam = new ReactiveVar();
});

Template.participateDialog.helpers({
    teams: function () {
        return Template.instance().teams.get();
    },
    femaleRequired: function () {
        const team = UltiSite.Teams.findOne(Template.instance().selectedTeam.get());
        if (!team)
            return false;
        if (team.minFemale < team.maxPlayers)
            return false;
        const user = Template.instance().selectedUser.get();
        if (user.sex === 'W')
            return false;
        return true;
    },
    inviteOther: function () {
        if (_.find(this.participants, (p) => { return p.user === Meteor.userId(); }))
            return true;
        return Template.instance().inviteOther.get();
    },
    selectedUser: function () {
        return Template.instance().selectedUser.get();
    },
    selectUser: function () {
        var curTemplate = Template.instance();
        return function (elem) {
            if (elem.id)
                curTemplate.selectedUser.set({ username: elem.name, _id: elem.id, sex: elem.sex });
            else
                curTemplate.selectedUser.set({ username: elem.username });
            return true;
        };
    },
    notFound: function () {
        return function (term) {
            return {
                name: "Das nicht Mitglied " + term + " in die Liste eintragen",
                icon: "fa-user-plus",
                link: "",
                username: term
            };
        };
    }
});

Template.participateDialog.events({
    'click .action-switch-invite': function (e, t) {
        t.inviteOther.set(true);
    },
    'keyup .alias-field': function (e, t) {
        e.preventDefault();
        t.$(".user-id").val("");
    },
    'change [name="teamId"]': function (e, t) {
        t.selectedTeam.set(t.$('[name="teamId"]').val());
    },
    'show.bs.modal .modal': function (e, t) {
        var button = $(e.relatedTarget); // Button that triggered the modal
        var teamId = button.data('team');
        console.log('resetting dialog', this);
        t.inserting.set(false);
        var dabei = false;
        if (teamId) {
            t.teams.set(UltiSite.Teams.find({ _id: teamId }).fetch());
            dabei = UltiSite.Teams.findOne({ _id: teamId, 'participants.user': Meteor.userId() });
        }
        else {
            t.teams.set(UltiSite.Teams.find({ tournamentId: this.tournamentId }, { sort: { clubTeam: -1 } }).fetch());
            dabei = UltiSite.Teams.findOne({ tournamentId: this.tournamentId, 'participants.user': Meteor.userId() });
        }

        if (t.teams.get().length === 1)
            t.selectedTeam.set(t.teams.get()[0]);

        if (!dabei)
            t.selectedUser.set(Meteor.user());
        else
            t.selectedUser.set(undefined);
    },
    'click .action-insert': function (e, t) {

        var teamId = t.$('[name="teamId"]').val();
        e.preventDefault();
        var params = {
            state: t.$(e.currentTarget).data("value"),
            userid: t.selectedUser.get()._id || t.selectedUser.get().username,
            sex: t.$('input[name="female"]')[0] && t.$('input[name="female"]')[0].checked
        };
        t.inserting.set(true);
        console.log('Inserting part:', params);
        Meteor.call("participantInsert", params, teamId, UltiSite.userFeedbackFunction('Spieler eintragen', e.currentTarget, function () {
            t.$('.user-id').val("");
            t.$('.alias-field').val("");
            $('.modal').modal('hide');
            t.inserting.set(false);
        }));
    }
});

Template.teamCountBar.helpers({
    teamCount: function () {

        var full = 0;
        var half = 0;
        var rest = 0;
        var females = 0;
        if (this.participants)
            this.participants.forEach(function (participant) {
                if (participant.state > 90)
                    full++;
                else if (participant.state > 50)
                    half++;
                else if (participant.state > 10)
                    rest++;
                if (participant.sex === 'W')
                    females++;
            });
        if (full + half + rest === 0)
            return undefined;
        var max = Math.max(this.maxPlayers, full + half + rest);
        if (full > this.maxPlayers) {
            full = this.maxPlayers;
            rest = half = 0;
        }
        if (full + half > this.maxPlayers) {
            half = this.maxPlayers - full;
            rest = 0;
        }
        if (full + half + rest > this.maxPlayers)
            rest = this.maxPlayers - full - half;

        return {
            percentFull: full * (100 / max),
            percentHalf: half * (100 / max),
            percentRest: rest * (100 / max),
            percentOver: (max - this.maxPlayers) * (100 / max),
            over: (max - this.maxPlayers),
            full: full,
            all: full + half,
            half: half,
            rest: rest,
            spots: this.maxPlayers - full,
            females: females,
            percentFemales: females * (100 / this.minFemale),
            missingFemales: Math.max(0, this.minFemale - females)
        };
    }
});

Template.team.helpers({
    teamColorState: function () {
        return UltiSite.stateColor(this.state);
    },
    participantMails: function () {
        return Template.instance().teamEmails.get();
    },
    notAvailable: function () {
        return _.filter(this.participants, (p) => { return p.state === 0; }).map(function (participant) {
            var user = Meteor.users.findOne(participant.user);
            var partUser = _.extend({}, user, participant);
            return partUser;
        });
    },
    participantUsers: function () {
        var self = this;

        return UltiSite.participantList(this._id);
    },
    teamRemovable: function () {
        if (_.find(this.participants, (p) => { return p.state === 100; }))
            return false;
        return true;
    },
    saveRemarks: function () {
        var self = this;
        return function (newContent, finished) {
            UltiSite.Teams.update({
                _id: self._id
            }, {
                    $set: {
                        remarks: newContent.trim()
                    }
                }, function (err) {
                    if (err)
                        $.notify("Error saving team:" + err, "error");

                    else {
                        Meteor.call("storeContentVersion", self._id, newContent);
                        $.notify("Anmerkungen gespeichert", "success");
                        finished();
                    }
                });
        };
    },
    currentUserAlias: function () {
        if (_.find(this.participants, (p) => { return p.user === Meteor.userId(); }))
            return "";
        return Meteor.user().username;
    },
    iamParticipating: function () {
        if (_.find(this.participants, (p) => { return p.user === Meteor.userId(); }))
            return true;
    },
    isMyTeam: function () {
        if (!Meteor.userId())
            return false;
        if (this.clubTeam)
            return true;
        if (this.responsible === Meteor.userId())
            return true;
        if (UltiSite.isAdmin())
            return true;
        if (_.find(this.participants, (p) => { return p.user === Meteor.userId(); }))
            return true;
    },
    isResponsible: function () {
        if (UltiSite.isAdmin())
            return true;
        return this.responsible === Meteor.userId();
    }
});




Template.participant.helpers({
    isWoman: function () {
        if (this.profile)
            return this.profile.sex === 'W';
        if (this.sex === 'W')
            return true;
        return false;
    },
    isUser: function () {
        return !this.dummy;
    },
    textState: function () {
        return UltiSite.textState(this.state);
    },
    noChangeRights: function () {
        if (Meteor.userId())
            return false;
        if (this.user === Meteor.userId())
            return false;
        if (UltiSite.isAdmin())
            return false;
        if (this.responsible === Meteor.userId())
            return false;
        return true;
    }
});


AutoForm.hooks({
    teamUpdateForm: {
        onSuccess: function () {
            $('.modal').modal('hide');
            AutoForm.resetForm("teamUpdateForm");
        },
        onSubmit: function (insertDoc, updateDoc, currentDoc) {
            var self = this;
            console.log("teamUpdateForm onSubmit");
            if (currentDoc && currentDoc._id) {
                UltiSite.Teams.update({
                    _id: currentDoc._id
                }, updateDoc);
                self.done();
            } else
                Meteor.call("addTeam", insertDoc, self.template.data.tournamentId, function (err, res) {
                    if (err)
                        self.done(err);
                    else {
                        self.done();
                    }
                });
            return false;
        }
    }
});

Template.teamUpdate.created = function () {
    this.teamId = new ReactiveVar(null);
};

Template.teamUpdate.helpers({
    teamSchema: function () {
        return UltiSite.schemas.team.get();
    },
    tournamentDivisions: function () {
        if (FlowRouter.getRouteName() === "tournament") {
            var t = UltiSite.Tournaments.findOne(FlowRouter.getParam('_id'));
            if (t && t.divisions)
                return t.divisions.map(function (d) {
                    return {
                        label: d.name || d.division,
                        value: d.division
                    };
                });
        }
        return [];
    },
    team: function () {
        var team = UltiSite.Teams.findOne(Template.instance().teamId.get());
        if (team)
            return team;
        var division;
        var maxPlayers = 12;
        var minFemale = 0;
        if (FlowRouter.getRouteName() === "tournament") {
            var t = UltiSite.Tournaments.findOne(FlowRouter.getParam('_id'));
            if (t && t.divisions && (t.divisions.length > 0)) {
                division = t.divisions[0].division;
                if (division.indexOf('Mixed') === 0)
                    minFemale = 6;
                else if (division.indexOf('Soft Mixed') === 0)
                    minFemale = 4;
                if (t.divisions[0].surface === 'Sand' || t.divisions[0].surface === 'Halle') {
                    maxPlayers -= 2;
                    minFemale -= 1;
                }
                if (division.indexOf('Damen') === 0)
                    minFemale = maxPlayers;
            }
        }
        return {
            name: UltiSite.settings().teamname,
            teamType: 'Verein - Auslosung',
            maxPlayers: 12,
            minFemale: 1,
            division: division,
            responsible: Meteor.userId()
        };
    }
});

Template.teamUpdate.events({
    'show.bs.modal .modal': function (e, t) {
        var button = $(e.relatedTarget);
        if (button.data('team-id'))
            t.teamId.set(button.data('team-id'));
        else
            t.teamId.set(null);
        AutoForm.resetForm("teamUpdateForm");
    }
});
Template.teamReport.onCreated(function () {
});
Template.teamReport.events({
    'click .action-add-me': function (e, t) {
        e.preventDefault();

        var params = {
            state: 100,
            userid: Meteor.userId(),
            alias: UltiSite.getAlias(Meteor.userId()),
            comment: ""
        };
        if (_.find(t.data.participants, (p) => { return p.user === Meteor.userId(); }))
            Meteor.call("participationUpdate", t.data._id, Meteor.userId(), 100, UltiSite.userFeedbackFunction('Mich hinzufügen', e.currentTarget));
        else
            Meteor.call("participantInsert", params, t.data._id, UltiSite.userFeedbackFunction('Mich hinzufügen', e.currentTarget));
    },
    'click .action-remove-team': function (e, t) {
        e.preventDefault();
        Meteor.call('teamUpdateState', this._id, 'geplant', UltiSite.userFeedbackFunction('Team Status ändern'));
    },
    'click .action-delete-team': function (e, t) {
        e.preventDefault();
        UltiSite.confirmDialog("Willst du wirklich das gesamte Team löschen?",() => {
            UltiSite.Teams.remove(this._id, UltiSite.userFeedbackFunction('Team löschen'));
        });
    },
    'click .action-add-team': function (e, t) {
        e.preventDefault();
        Meteor.call('teamUpdateState', this._id, 'dabei', UltiSite.userFeedbackFunction('Team Status ändern'));
    },
    'click .action-remove-me': function (e, t) {
        e.preventDefault();
        var params = {
            userid: Meteor.userId()
        };
        Meteor.call("participantRemove", params, t.data._id, UltiSite.userFeedbackFunction('Mich entfernen', e.currentTarget));
    },
    'click .action-team-image': function () {
        var teamId = this._id;
        UltiSite.fileBrowserShowDialog(this.tournamentId, function (file) {
            if (file)
                UltiSite.Images.update(file._id, {
                    $addToSet: {
                        associated: teamId,
                        tags: 'Teamfoto'
                    }
                });
            else {
                var img = UltiSite.Images.findOne({
                    associated: teamId
                });
                UltiSite.Images.update(img._id, {
                    $pull: {
                        associated: teamId
                    }
                });
            }
            UltiSite.Teams.update(teamId,{$set:{image:file && file._id}});
            UltiSite.fileBrowserHideDialog();
        });
    },
    'change .team-report .form-control': function (e, t) {
        var value = t.$(e.currentTarget).val();
        var name = $(e.currentTarget).attr("name");
        var node = $(e.currentTarget.parentNode);
        var toSet = {};
        toSet[name] = value;
        UltiSite.Teams.update({
            _id: this._id
        }, {
                $set: toSet
            }, UltiSite.userFeedbackFunction("Speichern der Ergebnisse"));
    }

});

Template.teamReport.helpers({
    myTeamState: function () {
        return !!_.find(this.participants, (p) => { return (p.user === Meteor.userId()) && (p.state === 100); });
    },
    teamRemovable: function () {
        if (_.find(this.participants, (p) => { return p.state === 100; }))
            return false;
        return true;
    },
    noChangeRights: function () {
        if (Meteor.userId())
            return false;
        if (_.find(this.participants, (p) => { return p.user === Meteor.userId(); }))
            return false;
        if (UltiSite.isAdmin())
            return false;
        if (this.responsible === Meteor.userId())
            return false;
        return true;
    },
    selectUser: function () {
        var teamId = this._id;
        return function (elem) {
            var params = {
                state: 100,
                userid: elem.id,
                alias: elem.name,
                sex: elem.female ? 'W' : 'M',
                comment: ""
            };
            Meteor.call("participantInsert", params, teamId);
            return true;
        };
    },
});

Template.teamHistoricView.onCreated(function () {
    this.teamId = new ReactiveVar();
});

Template.teamHistoricView.events({
    'show.bs.modal .modal': function (e, t) {
        var button = $(e.relatedTarget);
        if (button.data('team-id'))
            t.teamId.set(button.data('team-id'));
        else
            t.teamId.set(null);
    }
});

Template.teamHistoricView.helpers({
    participants: function () {
        return (UltiSite.Teams.findOne({
            _id: Template.instance().teamId.get()
        }) || {}).participants;
    },
    marks: function () {
        var team = UltiSite.Teams.findOne(Template.instance().teamId.get());
        if (!team)
            return;
        let earlyReg = _.sortBy(team.participants, 'entryDate');
        var turnier = UltiSite.Tournaments.findOne(team.tournamentId);
        let start = moment();
        if (earlyReg.length > 0)
            start = moment(earlyReg[0].entryDate);
        var ende = moment(turnier.date);
        return [{
            stateClass: 'mark-left',
            width: 25,
            offset: 0,
            text: start.format('DD.MM HH:mm')
        }, {
            stateClass: 'mark-right',
            width: 25,
            offset: 75,
            text: ende.format('DD.MM HH:mm')
        }];
    },
    historicBlocks: function () {
        var team = UltiSite.Teams.findOne(Template.instance().teamId.get());
        if (!team)
            return;
        let earlyReg = _.sortBy(team.participants, 'entryDate');
        var turnier = UltiSite.Tournaments.findOne(team.tournamentId);
        let start = moment();
        if (earlyReg.length > 0)
            start = moment(earlyReg[0].entryDate);
        var ende = moment(turnier.date);
        var diff = 100.0 / start.diff(ende, 'minutes');
        var last = start.clone();
        var results = this.history && this.history.map(function (block) {
            var width = last.diff(moment(block.until).clone(), 'minutes');
            var offset = start.diff(last, 'minutes');
            last = moment(block.until).clone();
            return {
                stateClass: ' ' + (block.state < 10 ? 'progress-bar-muted' : block.state < 70 ? 'progress-bar-danger' : block.state < 100 ? 'progress-bar-warning' : 'progress-bar-success'),
                width: width * diff,
                offset: offset * diff
            };
        }) || [];
        var width = last.diff(ende, 'minutes');
        var offset = start.diff(last, 'minutes');
        results.push({
            stateClass: ' ' + (this.state < 10 ? 'progress-bar-muted' : this.state < 70 ? 'progress-bar-danger' : this.state < 100 ? 'progress-bar-warning' : 'progress-bar-success'),
            width: width * diff,
            offset: offset * diff
        });
        return results;
    }
});
