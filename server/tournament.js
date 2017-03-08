
UltiSite.Tournaments.before.update(function (userId, doc, fieldNames, modifier, options) {
  modifier.$set = modifier.$set || {};
  modifier.$set.lastChange = new Date();
  UltiSite.Teams.update({tournamentId: doc._id},{$set:{lastChange:new Date()}});
});

UltiSite.Tournaments.after.update(function (userId, doc, fieldNames, modifier, options) {
  UltiSite.Teams.update({tournamentId: doc._id},{$set:{lastChange:new Date()}});
});

UltiSite.Teams.before.update(function (userId, doc, fieldNames, modifier, options) {
  modifier.$set = modifier.$set || {};
  modifier.$set.lastChange = new Date();
});

Meteor.methods({
    offlineTournamentCheck: function (ids) {
        const existing = UltiSite.Tournaments.find({ _id: { $in: ids } }).map(t => t._id);
        return _.without(ids, existing);
    },
    myTournaments: function () {
        var ids = UltiSite.Teams.find({
            tournamentDate: {
                $gte: moment().toDate()
            },
            $or: [
                { clubTeam: true },
                { 'participants.user': this.userId }
            ]
        }).map(function (team) {
            return team.tournamentId;
        });
        ids.concat(UltiSite.Teams.find({
            tournamentDate: {
                $lte: moment().toDate(),
                $gte: moment().subtract(6, 'month').toDate()
            },
            state: 'dabei',
            $or: [
                { clubTeam: true },
                { 'participants.user': this.userId }
            ]
        }, {
                limit: 5
            }).map(function (team) {
                return team.tournamentId;
            }));
        return ids;
    },
    addTeam: function (teamData, tournamentId) {
        if (!this.userId)
            throw new Meteor.Error("not-logged-in", "Nicht angemeldet");
        var userId = this.userId;
        var tourney = UltiSite.Tournaments.findOne(tournamentId);
        if (!tourney)
            throw new Meteor.Error("does-not-exist", "Das Turnier " + tournamentId + " existiert nicht");

        console.log("Adding Team " + teamData.name + " to " + tournamentId);
        teamData.tournamentDate = tourney.date;
        teamData.tournamentId = tournamentId;

        // set tournament defaults from type
        if (teamData.teamType.toLowerCase().indexOf('auslosung') > -1) {
            teamData.drawingDate = moment(tourney.date).clone().subtract(4, 'weeks').toDate();
            teamData.deadlineDate = moment(tourney.date).clone().subtract(3, 'weeks').toDate();
        }
        else if (teamData.teamType.toLowerCase().indexOf('international') > -1) {
            teamData.drawingDate = moment(tourney.date).clone().subtract(12, 'weeks').toDate();
            teamData.deadlineDate = moment(tourney.date).clone().subtract(10, 'weeks').toDate();
        }
        if (teamData.teamType.toLowerCase().indexOf('verein') > -1)
            teamData.clubTeam = true;
        else
            teamData.clubTeam = false;

        var id = UltiSite.Teams.insert(teamData);
        console.log("Created Team " + id + " and added");
        UltiSite.Tournaments.update(tournamentId, { 
            $set: { lastChange:new Date() },
            $addToSet: { teams: id } 
        });
        Meteor.call("addEvent", {
            type: "team",
            _id: id,
            text: "Neues Team " + teamData.name
        });
        return id;
    },
    teamRemove: function (id) {
        let team = UltiSite.Teams.findOne(id);
        if(!team)
            return;
        if(_.find(team.participants,(p)=>{return p.state === 100;}))
            throw new Meteor.Error('team-not-empty', 'Es sind Spieler im Team');
        UltiSite.Tournaments.update(team.tournamentId, { $pull: { teams: team._id} } );
        UltiSite.Teams.remove(team._id);
    },
    teamUpdateState: function (id, state) {
        let team = UltiSite.Teams.findOne(id);
        let update = { state: state, lastChange: new Date() };
        if (state === 'dabei' && !team.responsible) {
            const candidates = _.first(
                _.sortBy(
                    _.filter(team.participants, (p) => { return p.state === 100; }),
                    'entryDate'),
                team.maxPlayers / 2);
            console.log(candidates);
            const resp = _.sample(candidates);
            let text = 'Du wurdest als Verantwortliche(r) für ein Team ausgelost.';
            if (Meteor.users.findOne(resp.user)) {
                update.responsible = resp.user;
                update.responsibleName = resp.username;
            }
            else {
                update.responsible = resp.responsible;
                update.responsibleName = resp.username+' ('+resp.responsibleName+')';
                text = resp.username + ' wurde als Verantwortliche(r) für ein Team ausgelost. Du bist für diesen Spieler verantwortlich.';
            }

            var template = Assets.getText('mail-templates/team-tournament.html');
            var layout = Assets.getText('mail-templates/layout.html');
            UltiSite.Mail.send([update.responsible], 'Als Verantwortlicher gelost',
                UltiSite.renderMailTemplate(layout, template, {
                    user: Meteor.users.findOne(update.responsible),
                    infoText: text,
                    tournament: UltiSite.Tournaments.findOne(team.tournamentId),
                    formatedDate: moment(team.tournamentDate).format('DD.MM.YYYY'),
                    team: team,
                    participants: UltiSite.participantList(team._id),
                    tournamentUrl: FlowRouter.url('tournament', { _id: team.tournamentId })
                }));
        }

        UltiSite.Teams.update({
            _id: id
        }, {
                $set: update
            });

    },
    tournamentUpdateInfos: function (id, infoId, content) {
        UltiSite.Tournaments.update({
            _id: id,
            'description._id': infoId
        }, {
                $set: {
                    lastChange:new Date(),
                    'description.$.content': content
                }
            });
    },
    tournamentUpdateReport: function (id, infoId, content) {
        UltiSite.Tournaments.update({
            _id: id,
            'reports._id': infoId
        }, {
                $set: {
                    lastChange:new Date(),
                    'reports.$.content': content
                }
            });
    },
    tournamentAddReport: function (id, report) {
        UltiSite.Tournaments.update({
            _id: id
        }, {
                $set:{
                    lastChange:new Date()
                },
                $push: {
                    reports: {
                        $each: [report],
                        $position: 0
                    }
                }
            });

    },
    participationComment: function (teamId, userId, comment) {
        var activeUser = Meteor.users.findOne(this.userId);
        if (!activeUser)
            throw new Meteor.Error("access-denied", "Sie müssen angemeldet sein");
        let team = UltiSite.Teams.findOne(teamId);
        let part = _.find(team.participants, (p) => { return p.user === userId; });
        if (userId !== this.userId &&
            !UltiSite.isAdmin(this.userId) &&
            part.responsible !== this.userId)
            throw new Meteor.Error("access-denied", "Sie dürfen diese Teilnahme nicht ändern");
        UltiSite.Teams.update({ _id: teamId, 'participants.user': userId }, {
            $set: {
                'participants.$.comment': comment,
                lastChange: new Date()
            }
        });
        let user = Meteor.users.findOne(userId);
        if (!user)
            user = { username: userId };
        Meteor.call("addEvent", {
            type: "team",
            _id: team._id,
            userId: this.userId,
            text: (this.userId === user._id ? '' : user.username) + " sagt: " + comment
        });
    },
    participationUpdate: function (teamId, userId, participantValue) {
        var activeUser = Meteor.users.findOne(this.userId);
        if (!activeUser)
            throw new Meteor.Error("access-denied", "Sie müssen angemeldet sein");
        let team = UltiSite.Teams.findOne(teamId);
        let part = _.find(team.participants, (p) => { return p.user === userId; });
        if (userId !== this.userId &&
            !UltiSite.isAdmin(this.userId) &&
            part.responsible !== this.userId)
            throw new Meteor.Error("access-denied", "Sie dürfen diese Teilnahme nicht ändern");

        var user = Meteor.users.findOne(userId);
        if (!user)
            user = { username: part.user, profile: { sex: part.sex } };
        var drawingUpdate;
        var safeStateDate = part.safeStateDate;
        if (participantValue !== part.state) {
            if (part.drawing)
                drawingUpdate = 1000;
            safeStateDate = new Date();
        }
        UltiSite.Teams.update({ _id: teamId, 'participants.user': userId }, {
            $set: {
                'participants.$.state': participantValue,
                'participants.$.responsible': this.userId,
                'participants.$.responsibleName': activeUser.username,
                'participants.$.drawing': drawingUpdate,
                'participants.$.safeStateDate': safeStateDate,
                'participants.$.username': user.username,
                'participants.$.sex': user.profile.sex,
                lastChange: new Date()
            },
            $push: {
                'participants.$.history': {
                    until: new Date(),
                    state: part.state,
                    unsetBy: this.userId
                }
            }
        }, (err, res) => {
            if (err)
                throw err;
            Meteor.call("addEvent", {
                type: "team",
                userId: this.userId,
                _id: team._id,
                text: (this.userId === user._id ? '' : user.username + ': ') + UltiSite.textState(participantValue) + (part.comment ? '(' + part.comment + ')' : "")
            });
            if (user && user._id)
                Meteor.call('computeStatistics', user._id);
        });
    },
    participantInsert: function (params, teamId) {
        var activeUser = Meteor.users.findOne(this.userId);
        if (!activeUser)
            throw new Meteor.Error("access-denied", "Sie müssen angemeldet sein");
        var user = Meteor.users.findOne(params.userid);
        if (!user)
            user = UltiSite.userByAlias(params.alias, this.connection);
        if (!user) {
            user = { _id: params.userid, username: params.userid, profile: { sex: params.sex ? 'W' : 'M' } };
            params.dummy = true;
        }
        var team = UltiSite.Teams.findOne(teamId);
        if (!team)
            throw new Meteor.Error("does-not-exist", "Das Team " + teamId + " existiert nicht");
        if (_.find(team.participants, (p) => { return p.user === user._id; }))
            throw new Meteor.Error("already-there", "Der Spieler ist bereits beim Team dabei");
        delete (params.alias);
        params.user = user._id;
        params.drawing = 1000;
        params.username = user.username;
        params.sex = user.profile.sex;
        params.responsible = this.userId;
        params.responsibleName = activeUser.username;
        params.entryDate = new Date();
        params.safeStateDate = new Date();

        UltiSite.Teams.update({ _id: teamId }, { 
            $set:{ lastChange: new Date() },
            $push: { participants: params } }, function (err, affected) {
            if (err)
                throw err;

            Meteor.call("addEvent", {
                type: "team",
                userId: this.userId,
                _id: team._id,
                text: (this.userId === user._id ? '' : user.username + ': ') + UltiSite.textState(params.state)
            });
            if (!params.dummy)
                Meteor.call('computeStatistics', user._id);

        });
    },
    participantRemove: function (params, teamId) {
        var activeUser = Meteor.users.findOne(this.userId);
        if (!activeUser)
            throw new Meteor.Error("access-denied", "Sie müssen angemeldet sein");

        UltiSite.Teams.update({ 'participants.user': params.userid, _id: teamId }, { 
            $set: { 
                'participants.$.state': 0, 
                'participants.$.drawing': 1000, 
                lastChange: new Date()
            } });
    },
    tournamentCoordinates: function () {
        return UltiSite.Tournaments.find({
            $and: [{
                'address.geocoords': {
                    $ne: ''
                }
            }, {
                'address.geocoords': {
                    $exists: true
                }
            }],
            date: {
                $gte: new Date()
            }
        }, {
                fields: {
                    'address.geocoords': 1,
                    name: 1,
                    date: 1
                }
            }).fetch();
    }
});

Meteor.startup(function () {

    UltiSite.teamDrawings = function () {
        UltiSite.Teams.find({
            drawingResult: { $exists: false },
            tournamentDate: {
                $gte: moment().startOf('day').toDate()
            },
            drawingDate: {
                $lte: moment().endOf('day').toDate()
            }
        }).forEach(function (team) {
            if (!team.participants)
                return;
            let partCount = team.participants.length;
            let numbers = [];
            let result = {
                date: new Date()
            };
            for (let i = 1; i <= partCount; i++)
                numbers[i - 1] = i;
            const orderedParticipants = _.sortBy(_.sortBy(team.participants, 'safeStateDate'), (p) => {
                return 100 - p.state;
            });

            orderedParticipants.forEach((part, idx) => {
                let selection = (Math.random() * numbers.length).toFixed();
                let pos = numbers[selection];
                numbers = _.without(numbers, pos);
                if(idx < (team.maxPlayers / 2))
                    pos = 0;
                if(part.state !== 100)
                    pos = 1000;
                UltiSite.Teams.update({ _id: team._id, 'participants.user': part.user }, {
                    $set: { 'participants.$.drawing': pos }
                });
                result[part.user.toCamelCase()] = pos;
            });
            UltiSite.Teams.update(team._id, { $set: { 
                drawingResult: result,
                lastChange: new Date()
             } });
            let drawnParticipants = UltiSite.participantList(team._id).map((p) => {
                return p.username;
            }).join(', ');

            console.log('finished drawing:' + drawnParticipants);
            Meteor.call("addEvent", {
                type: "team",
                _id: team._id,
                text: "Auslosung bei " + team.name + ':' + drawnParticipants
            });

        });
    };

    SyncedCron.add({
        name: 'Team drawing',
        schedule: function (parser) {
            // parser is a later.parse object
            return parser.text('at 03:17');
        },
        job: UltiSite.teamDrawings
    });
});