import { moment } from 'meteor/momentjs:moment';
import { FlowRouter } from 'meteor/kadira:flow-router';

Meteor.methods({
  teamRemove(teamId) {
    check(teamId, String);
    const tournament = UltiSite.Tournaments.findOne({
      participants: {
        $elemMatch: { team: teamId, state: 100 },
      },
    });
    if (tournament) {
      throw new Meteor.Error('team-not-empty', 'Es sind Spieler im Team');
    }
    UltiSite.Tournaments.update({ 'teams._id': teamId }, {
      $pull: {
        teams: { _id: teamId },
        particpants: { team: teamId },
      },
    });
  },
  teamMoveToTournament(teamId, tournamentId) {
    check(teamId, String);
    check(tournamentId, String);
    const team = UltiSite.getTeam(teamId);
    if (!team) { return; }
    // first insert, then remove, to not loose the team
    UltiSite.Tournaments.update(tournamentId, { $push: { teams: team } });
    UltiSite.Tournaments.update({ _id: { $ne: tournamentId, 'teams._id': teamId } }, { $pull: { teams: { _id: teamId } } });
  },
  teamMakeMeResponsible(teamId) {
    check(teamId, String);
    if (!this.userId) {
      throw new Meteor.Error('access-denied');
    }
    const user = Meteor.users.findOne(this.userId);
    UltiSite.Tournaments.update({ 'teams._id': teamId }, {
      $set: {
        'teams.$.responsible': this.userId,
        'teams.$.responsibleName': user.username,
        lastChange: new Date(),
      },
    });
  },
  teamUpdateRemarks(teamId, remark) {
    check(teamId, String);
    check(remark, String);
    if (!this.userId) {
      throw new Meteor.Error('access-denied');
    }
    UltiSite.Tournaments.update({ 'teams._id': teamId }, { $set: { 'teams.$.remarks': remark } });
  },
  teamUpdateImage(teamId, image) {
    check(teamId, String);
    check(image, String);
    if (!this.userId) {
      throw new Meteor.Error('access-denied');
    }
    UltiSite.Tournaments.update({ 'teams._id': teamId }, { $set: { 'teams.$.image': image } });
  },
  teamUpdateResults(teamId, name, value) {
    check(teamId, String);
    check(name, String);
    check(value, String);
    if (!this.userId) {
      throw new Meteor.Error('access-denied');
    }
    if (name.indexOf('results.') !== 0) {
      throw new Meteor.Error('wrong-content');
    }
    const upd = {};
    upd['teams.$.' + name] = value;

    UltiSite.Tournaments.update({ 'teams._id': teamId }, { $set: upd });
  },

  teamUpdate(teamId, teamData) {
    check(teamId, String);
    check(teamData, Object);
    if (!this.userId) {
      throw new Meteor.Error('access-denied');
    }
    const upd = {};
    Object.keys(teamData).forEach((key) => {
      upd['teams.$.' + key] = teamData[key];
    });
    UltiSite.Tournaments.update({ 'teams._id': teamId }, { $set: upd });
  },
  teamUpdateState(teamId, state) {
    check(teamId, String);
    check(state, String);

    const tournament = UltiSite.Tournaments.findOne({ 'teams._id': teamId });
    const team = _.find(tournament.teams, t => t._id === teamId);
    if (state === team.state) {
      return;
    }
    const update = { state, lastChange: new Date() };
    if (state === 'dabei' && !team.responsible) {
      const candidates = _.first(
        _.sortBy(
          _.filter(tournament.participants, p => (p.team === teamId) && (p.state === 100)),
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
          tournament,
          formatedDate: moment(tournament.date).format('DD.MM.YYYY'),
          team,
          participants: UltiSite.participantList(team._id),
          tournamentUrl: FlowRouter.url('tournament', { _id: tournament._id }),
        }));
      UltiSite.addEvent({
        type: 'tournament',
        _id: tournament._id,
        text: `Für das Team ${team.name} ist jetzt ${update.responsibleName} Zuständig`,
      });
    }
    const upd = {};
    Object.keys(update).forEach((key) => { upd['teams.$.' + key] = update[key]; });

    UltiSite.Tournaments.update({
      'teams._id': teamId,
    }, {
      $set: upd,
    });
    Meteor.call('addEvent', {
      type: 'tournament',
      _id: tournament._id,
      text: `Das Team ${team.name} ist jetzt ${state}`,
    });
  },
  participationComment(teamId, userId, comment) {
    check(teamId, String);
    check(userId, String);
    check(comment, String);
    const activeUser = Meteor.users.findOne(this.userId);
    if (!activeUser) { throw new Meteor.Error('access-denied', 'Sie müssen angemeldet sein'); }
    const tournament = UltiSite.Tournaments.findOne({ 'teams._id': teamId });
    const part = _.find(tournament.participants, p => (p.team === teamId) && (p.user === userId));
    if (userId !== this.userId &&
      !UltiSite.isAdmin(this.userId) &&
      part.responsible !== this.userId) { throw new Meteor.Error('access-denied', 'Sie dürfen diese Teilnahme nicht ändern'); }
    UltiSite.Tournaments.update({
      participants: {
        $elemMatch: { user: userId, team: teamId },
      },
    }, {
      $set: {
          'participants.$.comment': comment,
          lastChange: new Date(),
        },
    });
    let user = Meteor.users.findOne(userId);
    if (!user) { user = { username: userId }; }
    Meteor.call('addEvent', {
      type: 'tournament',
      _id: tournament._id,
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
    UltiSite.Tournaments.update({
      participants: {
        $elemMatch: { user: userId, team: teamId },
      },
    }, {
      $pull: {
          participants: {
            user: userId,
            team: teamId,
          },
        },
      $set: {
          lastChange: new Date(),
        },
    });
  },
  participationUpdate(teamId, userId, participantValue) {
    check(teamId, String);
    check(userId, String);
    check(participantValue, Number);
    const activeUser = Meteor.users.findOne(this.userId);
    if (!activeUser) { throw new Meteor.Error('access-denied', 'Sie müssen angemeldet sein'); }
    const tournament = UltiSite.Tournaments.findOne({ 'teams._id': teamId });
    const part = _.find(tournament.participants, p => (p.team === teamId) && (p.user === userId));
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
    UltiSite.Tournaments.update({
      participants: {
        $elemMatch: { user: userId, team: teamId },
      },
    }, {
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
          type: 'tournament',
          userId: this.userId,
          _id: tournament._id,
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
    const tournament = UltiSite.Tournaments.findOne({
      participants: { $elemMatch: { user: user._id, team: teamId } },
    });
    if (tournament) {
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
    params.team = teamId;

    UltiSite.Tournaments.update({ 'teams._id': teamId }, {
      $set: { lastChange: new Date() },
      $push: { participants: params },
    }, (err, affected) => {
      if (err) { throw err; }

      Meteor.call('addEvent', {
        type: 'team',
        userId: this.userId,
        _id: teamId,
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

    UltiSite.Tournaments.update({
      participants: { $elemMatch: { user: params.userid, team: teamId } },
    }, {
      $set: {
          'participants.$.state': 0,
          'participants.$.drawing': 1000,
          lastChange: new Date(),
        },
    });
  },

});
