import { moment } from 'meteor/momentjs:moment';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { SyncedCron } from 'meteor/percolate:synced-cron';

UltiSite.Tournaments.before.update(function (userId, doc, fieldNames, modifier, options) {
  modifier.$set = modifier.$set || {};
  modifier.$set.lastChange = new Date();
});

UltiSite.Tournaments.after.update(function (userId, doc, fieldNames, modifier, options) {
  UltiSite.Teams.update({ tournamentId: doc._id }, { $set: { lastChange: new Date(), tournamentDate: doc.date } });
});

UltiSite.Teams.before.update(function (userId, doc, fieldNames, modifier, options) {
  modifier.$set = modifier.$set || {};
  modifier.$set.lastChange = new Date();
});

UltiSite.getTournamentsStates = function (userId) {
  return UltiSite.Teams.find({ tournamentDate: { $gte: new Date() }, 'participants.user': userId }).map((team) => {
    const part = _.find(team.participants, (p => p.user === userId));
    const tournament = UltiSite.Tournaments.findOne(team.tournamentId);
    return {
      name: tournament.name,
      date: moment(tournament.date).format('DD.MM.'),
      city: tournament.address && tournament.address.city,
      state: UltiSite.textState(part.state),
      comment: part.comment,
      teamName: team.name,
      teamState: team.state,
      sicher: team.participants.filter(p => p.state > 90).length,
      wahrscheinlich: team.participants.filter(p => (p.state < 90) && (p.state > 50)).length,
      interessiert: team.participants.filter(p => (p.state < 50) && (p.state > 0)).length,
    };
  });
};

Meteor.methods({
  offlineTournamentCheck(ids) {
    check(ids, [String]);
    const existing = UltiSite.Tournaments.find({ _id: { $in: ids } }).map(t => t._id);
    return _.without(ids, existing);
  },
  myTournamentStates() {
    return UltiSite.getTournamentsStates(this.userId);
  },
  myTournaments() {
    const ids = UltiSite.Teams.find({
      tournamentDate: {
        $gte: moment().toDate(),
      },
      $or: [
        { clubTeam: true },
        { 'participants.user': this.userId },
      ],
    }).map(function (team) {
      return team.tournamentId;
    });
    ids.concat(UltiSite.Teams.find({
      tournamentDate: {
        $lte: moment().toDate(),
        $gte: moment().subtract(6, 'month').toDate(),
      },
      state: 'dabei',
      $or: [
        { clubTeam: true },
        { 'participants.user': this.userId },
      ],
    }, {
      limit: 5,
    }).map(function (team) {
        return team.tournamentId;
      }));
    return ids;
  },
  addTeam(teamData, tournamentId) {
    check(teamData, Object);
    check(tournamentId, String);
    if (!this.userId) { throw new Meteor.Error('not-logged-in', 'Nicht angemeldet'); }
    const userId = this.userId;
    const tourney = UltiSite.Tournaments.findOne(tournamentId);
    if (!tourney) { throw new Meteor.Error('does-not-exist', `Das Turnier ${tournamentId} existiert nicht`); }

    console.log(`Adding Team ${teamData.name} to ${tournamentId}`);
    teamData.tournamentDate = tourney.date;
    teamData.tournamentId = tournamentId;

    // set tournament defaults from type
    if (teamData.teamType.toLowerCase().indexOf('auslosung') > -1) {
      teamData.drawingDate = moment(tourney.date).clone().subtract(4, 'weeks').toDate();
      teamData.deadlineDate = moment(tourney.date).clone().subtract(3, 'weeks').toDate();
    } else if (teamData.teamType.toLowerCase().indexOf('international') > -1) {
      teamData.drawingDate = moment(tourney.date).clone().subtract(12, 'weeks').toDate();
      teamData.deadlineDate = moment(tourney.date).clone().subtract(10, 'weeks').toDate();
    }
    if (teamData.teamType.toLowerCase().indexOf('verein') > -1) {
      teamData.clubTeam = true;
    } else {
      teamData.clubTeam = false;
      teamData.responsible = this.userId;
      teamData.responsibleName = Meteor.users.findOne(this.userId).username;
    }
    const id = UltiSite.Teams.insert(teamData);
    console.log(`Created Team ${id} and added`);
    UltiSite.Tournaments.update(tournamentId, {
      $set: { lastChange: new Date() },
      $addToSet: { teams: id },
    });
    Meteor.call('addEvent', {
      type: 'team',
      _id: id,
      text: `Neues Team ${teamData.name}`,
    });
    return id;
  },
  teamRemove(id) {
    check(id, String);
    const team = UltiSite.Teams.findOne(id);
    if (!team) { return; }
    if (_.find(team.participants, p => p.state === 100)) { throw new Meteor.Error('team-not-empty', 'Es sind Spieler im Team'); }
    UltiSite.Tournaments.update(team.tournamentId, { $pull: { teams: team._id } });
    UltiSite.Teams.remove(team._id);
  },
  teamMoveToTournament(teamId, tournamentId) {
    check(teamId, String);
    check(tournamentId, String);
    const team = UltiSite.Teams.findOne(teamId);
    const tournament = UltiSite.Tournaments.findOne(tournamentId);
    if (!team) { return; }
    UltiSite.Tournaments.update(tournamentId, { $push: { teams: teamId } });
    UltiSite.Tournaments.update(team.tournamentId, { $pull: { teams: teamId } });
    UltiSite.Teams.update(teamId, { $set: { tournamentId } });
  },
  teamUpdateState(teamId, state) {
    check(teamId, String);
    check(state, String);

    const team = UltiSite.Teams.findOne(teamId);
    if (state === team.state) {
      return;
    }
    const update = { state, lastChange: new Date() };
    if (state === 'dabei' && !team.responsible) {
      const candidates = _.first(
        _.sortBy(
          _.filter(team.participants, p => p.state === 100),
          'entryDate'),
        team.maxPlayers / 2);
      console.log(candidates);
      const resp = _.sample(candidates);
      let text = 'Du wurdest als Verantwortliche(r) für ein Team ausgelost.';
      const user = Meteor.users.findOne(resp.user);
      if (user) {
        update.responsible = resp.user;
        update.responsibleName = user.username;
      } else {
        update.responsible = resp.responsible;
        update.responsibleName = `${resp.username} (${resp.responsibleName})`;
        text = `${resp.username} wurde als Verantwortliche(r) für ein Team ausgelost. Du bist für diesen Spieler verantwortlich.`;
      }

      const template = Assets.getText('mail-templates/team-tournament.html');
      const layout = Assets.getText('mail-templates/layout.html');
      UltiSite.Mail.send([update.responsible], 'Als Verantwortlicher gelost',
        UltiSite.renderMailTemplate(layout, template, {
          user: Meteor.users.findOne(update.responsible),
          infoText: text,
          tournament: UltiSite.Tournaments.findOne(team.tournamentId),
          formatedDate: moment(team.tournamentDate).format('DD.MM.YYYY'),
          team,
          participants: UltiSite.participantList(team._id),
          tournamentUrl: FlowRouter.url('tournament', { _id: team.tournamentId }),
        }));
      UltiSite.addEvent({
        type: 'team',
        _id: team._id,
        text: `Für das Team ${team.name} ist jetzt ${update.responsibleName} Zuständig`,
      });
    }

    UltiSite.Teams.update({
      _id: teamId,
    }, {
      $set: update,
    });
    Meteor.call('addEvent', {
      type: 'team',
      _id: team._id,
      text: `Das Team ${team.name} ist jetzt ${state}`,
    });
  },
  tournamentUpdateInfos(id, infoId, content) {
    check(id, String);
    check(infoId, String);
    check(content, String);
    UltiSite.Tournaments.update({
      _id: id,
      'description._id': infoId,
    }, {
      $set: {
          lastChange: new Date(),
          'description.$.content': content,
        },
    });
  },
  tournamentUpdateReport(id, infoId, content) {
    check(id, String);
    check(infoId, String);
    check(content, String);
    UltiSite.Tournaments.update({
      _id: id,
      'reports._id': infoId,
    }, {
      $set: {
          lastChange: new Date(),
          'reports.$.content': content,
        },
    });
  },
  tournamentAddReport(id, report) {
    check(id, String);
    check(report, Object);
    UltiSite.Tournaments.update({
      _id: id,
    }, {
      $set: {
          lastChange: new Date(),
        },
      $push: {
          reports: {
            $each: [report],
            $position: 0,
          },
        },
    });
  },
  participationComment(teamId, userId, comment) {
    check(teamId, String);
    check(userId, String);
    check(comment, String);
    const activeUser = Meteor.users.findOne(this.userId);
    if (!activeUser) { throw new Meteor.Error('access-denied', 'Sie müssen angemeldet sein'); }
    const team = UltiSite.Teams.findOne(teamId);
    const part = _.find(team.participants, p => p.user === userId);
    if (userId !== this.userId &&
      !UltiSite.isAdmin(this.userId) &&
      part.responsible !== this.userId) { throw new Meteor.Error('access-denied', 'Sie dürfen diese Teilnahme nicht ändern'); }
    UltiSite.Teams.update({ _id: teamId, 'participants.user': userId }, {
      $set: {
        'participants.$.comment': comment,
        lastChange: new Date(),
      },
    });
    let user = Meteor.users.findOne(userId);
    if (!user) { user = { username: userId }; }
    Meteor.call('addEvent', {
      type: 'team',
      _id: team._id,
      userId: this.userId,
      text: `${this.userId === user._id ? '' : user.username} sagt: ${comment}`,
    });
  },
  participationRemove(teamId, userId) {
    check(teamId, String);
    check(userId, String);
    if (!UltiSite.isAdmin(this.userId)) {
      throw new Meteor.Error('access-denied', 'Nur Admins');
    }
    UltiSite.Teams.update({ _id: teamId, 'participants.user': userId }, {
      $pull: {
        participants: {
          user: userId,
        },
      },
    });
  },
  participationUpdate(teamId, userId, participantValue) {
    check(teamId, String);
    check(userId, String);
    check(participantValue, Number);
    const activeUser = Meteor.users.findOne(this.userId);
    if (!activeUser) { throw new Meteor.Error('access-denied', 'Sie müssen angemeldet sein'); }
    const team = UltiSite.Teams.findOne(teamId);
    const part = _.find(team.participants, p => p.user === userId);
    if (userId !== this.userId &&
      !UltiSite.isAdmin(this.userId) &&
      part.responsible !== this.userId) { throw new Meteor.Error('access-denied', 'Sie dürfen diese Teilnahme nicht ändern'); }

    let user = Meteor.users.findOne(userId);
    if (!user) { user = { username: part.user, profile: { sex: part.sex } }; }
    let drawingUpdate;
    let safeStateDate = part.safeStateDate;
    if (participantValue !== part.state) {
      if (part.drawing) { drawingUpdate = 1000; }
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
        lastChange: new Date(),
      },
      $push: {
        'participants.$.history': {
          until: new Date(),
          state: part.state,
          unsetBy: this.userId,
        },
      },
    }, (err, res) => {
      if (err) { throw err; }
      Meteor.call('addEvent', {
        type: 'team',
        userId: this.userId,
        _id: team._id,
        text: (this.userId === user._id ? '' : `${user.username}: `) + UltiSite.textState(participantValue) + (part.comment ? `(${part.comment})` : ''),
      });
      if (user && user._id) { Meteor.call('computeStatistics', user._id); }
    });
  },
  participantInsert(params, teamId) {
    check(params, Object);
    check(teamId, String);
    const activeUser = Meteor.users.findOne(this.userId);
    if (!activeUser) { throw new Meteor.Error('access-denied', 'Sie müssen angemeldet sein'); }
    let user = Meteor.users.findOne(params.userid);
    if (!user) { user = UltiSite.userByAlias(params.alias, this.connection); }
    if (!user) {
      user = {
        _id: params.userid,
        username: params.userid,
profile: { sex: params.sex ? 'W' : 'M' },
      };
      params.dummy = true;
    }
    const team = UltiSite.Teams.findOne(teamId);
    if (!team) { throw new Meteor.Error('does-not-exist', `Das Team ${teamId} existiert nicht`); }
    if (_.find(team.participants, p => p.user === user._id)) {
      throw new Meteor.Error('already-there', 'Der Spieler ist bereits beim Team dabei');
    }
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
      $set: { lastChange: new Date() },
      $push: { participants: params },
    }, (err, affected) => {
      if (err) { throw err; }

      Meteor.call('addEvent', {
        type: 'team',
        userId: this.userId,
        _id: team._id,
        text: (this.userId === user._id ? '' : `${user.username}: `) +
          UltiSite.textState(params.state) + (params.comment ? ` und sagt: ${params.comment}` : ''),
      });
      if (!params.dummy) { Meteor.call('computeStatistics', user._id); }
    });
  },
  participantRemove(params, teamId) {
    check(params, Object);
    check(teamId, String);
    const activeUser = Meteor.users.findOne(this.userId);
    if (!activeUser) { throw new Meteor.Error('access-denied', 'Sie müssen angemeldet sein'); }

    UltiSite.Teams.update({ 'participants.user': params.userid, _id: teamId }, {
      $set: {
        'participants.$.state': 0,
        'participants.$.drawing': 1000,
        lastChange: new Date(),
      },
    });
  },
  tournamentCoordinates() {
    return UltiSite.Tournaments.find({
      $and: [{
        'address.geocoords': {
          $ne: '',
        },
      }, {
        'address.geocoords': {
          $exists: true,
        },
      }],
      date: {
        $gte: new Date(),
      },
    }, {
      fields: {
          'address.geocoords': 1,
          name: 1,
          date: 1,
        },
    }).fetch();
  },
});

Meteor.startup(function () {
  UltiSite.teamDrawings = function () {
    UltiSite.Teams.find({
      drawingResult: { $exists: false },
      tournamentDate: {
        $gte: moment().startOf('day').toDate(),
      },
      drawingDate: {
        $lte: moment().endOf('day').toDate(),
      },
    }).forEach(function (team) {
      if (!team.participants) { return; }
      const partCount = team.participants.length;
      let numbers = [];
      const result = {
        date: new Date(),
      };
      for (let i = 1; i <= partCount; i += 1) {
        numbers[i - 1] = i;
      }
      const orderedParticipants = _.sortBy(_.sortBy(team.participants, 'safeStateDate'), p => 100 - p.state);

      orderedParticipants.forEach((part, idx) => {
        const selection = (Math.random() * numbers.length).toFixed();
        let pos = numbers[selection];
        numbers = _.without(numbers, pos);
        if (idx < (team.maxPlayers / 2)) { pos = 0; }
        if (part.state !== 100) { pos = 1000; }
        UltiSite.Teams.update({ _id: team._id, 'participants.user': part.user }, {
          $set: { 'participants.$.drawing': pos },
        });
        result[part.user.toCamelCase()] = pos;
      });
      UltiSite.Teams.update(team._id, {
        $set: {
          drawingResult: result,
          lastChange: new Date(),
        },
      });
      const drawnParticipants = UltiSite.participantList(team._id).map(p => p.username).join(', ');

      console.log(`finished drawing:${drawnParticipants}`);
      if (team.maxPlayers < partCount * 2) {
        Meteor.call('addEvent', {
          type: 'team',
          _id: team._id,
          text: `Auslosung bei ${team.name}:${drawnParticipants}`,
        });
      }
    });
  };

  SyncedCron.add({
    name: 'Team drawing',
    schedule(parser) {
      // parser is a later.parse object
      return parser.text('at 03:17');
    },
    job: UltiSite.teamDrawings,
  });
});
