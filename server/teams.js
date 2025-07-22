import { moment } from 'meteor/momentjs:moment';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { isAdmin, textState, Tournaments, userByAlias } from '../common/lib/ultisite';
import { getTeam } from './tournament';
import { Mail, renderMailTemplate } from './mail';
import { participantList } from '../common/teams';
import { addEvent } from './events';

Meteor.methods({
  async teamRemove(teamId) {
    check(teamId, String);
    const tournament = await Tournaments.findOneAsync({
      participants: {
        $elemMatch: { team: teamId, state: 100 },
      },
    });
    if (tournament) {
      throw new Meteor.Error('team-not-empty', 'Es sind Spieler im Team');
    }
    await Tournaments.updateAsync(
      { 'teams._id': teamId },
      {
        $pull: {
          teams: { _id: teamId },
          particpants: { team: teamId },
        },
      }
    );
  },
  async teamMoveToTournament(teamId, tournamentId) {
    check(teamId, String);
    check(tournamentId, String);
    const team = await getTeam(teamId);
    if (!team) {
      return;
    }
    // first insert, then remove, to not loose the team
    await Tournaments.updateAsync(tournamentId, { $push: { teams: team } });
    await Tournaments.updateAsync(
      { _id: { $ne: tournamentId, 'teams._id': teamId } },
      { $pull: { teams: { _id: teamId } } }
    );
  },
  async teamMakeMeResponsible(teamId) {
    check(teamId, String);
    if (!this.userId) {
      throw new Meteor.Error('access-denied');
    }
    const user = await Meteor.users.findOneAsync(this.userId);
    await Tournaments.updateAsync(
      { 'teams._id': teamId },
      {
        $set: {
          'teams.$.responsible': this.userId,
          'teams.$.responsibleName': user.username,
          lastChange: new Date(),
        },
      }
    );
  },
  async teamUpdateRemarks(teamId, remark) {
    check(teamId, String);
    check(remark, String);
    if (!this.userId) {
      throw new Meteor.Error('access-denied');
    }
    await Tournaments.updateAsync({ 'teams._id': teamId }, { $set: { 'teams.$.remarks': remark } });
  },
  async teamUpdateImage(teamId, image) {
    check(teamId, String);
    check(image, String);
    if (!this.userId) {
      throw new Meteor.Error('access-denied');
    }
    await Tournaments.updateAsync({ 'teams._id': teamId }, { $set: { 'teams.$.image': image } });
  },
  async teamUpdateResults(teamId, name, value) {
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

    await Tournaments.updateAsync({ 'teams._id': teamId }, { $set: upd });
  },

  async teamUpdate(teamId, teamData) {
    check(teamId, String);
    check(teamData, Object);
    if (!this.userId) {
      throw new Meteor.Error('access-denied');
    }
    const upd = {};
    Object.keys(teamData).forEach((key) => {
      upd['teams.$.' + key] = teamData[key];
    });
    await Tournaments.updateAsync({ 'teams._id': teamId }, { $set: upd });
  },
  async teamUpdateState(teamId, state) {
    check(teamId, String);
    check(state, String);

    const tournament = await Tournaments.findOneAsync({ 'teams._id': teamId });
    const team = _.find(tournament.teams, (t) => t._id === teamId);
    if (state === team.state) {
      return;
    }
    const update = { state, lastChange: new Date() };
    if (state === 'dabei' && !team.responsible) {
      const candidates = _.first(
        _.sortBy(
          _.filter(tournament.participants, (p) => p.team === teamId && p.state === 100),
          'entryDate'
        ),
        team.maxPlayers / 2
      );
      console.log(candidates);
      const resp = _.sample(candidates);
      let text = 'Du wurdest als Verantwortliche(r) für ein Team ausgelost.';
      const user = await Meteor.users.findOneAsync(resp.user);
      if (user) {
        update.responsible = resp.user;
        update.responsibleName = user.username;
      } else {
        update.responsible = resp.responsible;
        update.responsibleName = `${resp.username} (${resp.responsibleName})`;
        text = `${resp.username} wurde als Verantwortliche(r) für ein Team ausgelost. Du bist für diesen Spieler verantwortlich.`;
      }

      const template = await Assets.getTextAsync('mail-templates/team-tournament.html');
      const layout = await Assets.getTextAsync('mail-templates/layout.html');
      Mail.send(
        [update.responsible],
        'Als Verantwortlicher gelost',
        renderMailTemplate(layout, template, {
          user: await Meteor.users.findOneAsync(update.responsible),
          infoText: text,
          tournament,
          formatedDate: moment(tournament.date).format('DD.MM.YYYY'),
          team,
          participants: await participantList(team._id),
          tournamentUrl: FlowRouter.url('tournament', { _id: tournament._id }),
        })
      );
      await addEvent({
        type: 'tournament',
        _id: tournament._id,
        text: `Für das Team ${team.name} ist jetzt ${update.responsibleName} Zuständig`,
      });
    }
    const upd = {};
    Object.keys(update).forEach((key) => {
      upd['teams.$.' + key] = update[key];
    });

    await Tournaments.updateAsync(
      {
        'teams._id': teamId,
      },
      {
        $set: upd,
      }
    );
    await Meteor.callAsync('addEvent', {
      type: 'tournament',
      _id: tournament._id,
      text: `Das Team ${team.name} ist jetzt ${state}`,
    });
  },
  async participationComment(teamId, userId, comment) {
    check(teamId, String);
    check(userId, String);
    check(comment, String);
    const activeUser = await Meteor.users.findOneAsync(this.userId);
    if (!activeUser) {
      throw new Meteor.Error('access-denied', 'Sie müssen angemeldet sein');
    }
    const tournament = await Tournaments.findOneAsync({ 'teams._id': teamId });
    const part = _.find(tournament.participants, (p) => p.team === teamId && p.user === userId);
    if (userId !== this.userId && !(await isAdmin(this.userId)) && part.responsible !== this.userId) {
      throw new Meteor.Error('access-denied', 'Sie dürfen diese Teilnahme nicht ändern');
    }
    await Tournaments.updateAsync(
      {
        participants: {
          $elemMatch: { user: userId, team: teamId },
        },
      },
      {
        $set: {
          'participants.$.comment': comment,
          lastChange: new Date(),
        },
      }
    );
    let user = await Meteor.users.findOneAsync(userId);
    if (!user) {
      user = { username: userId };
    }
    await Meteor.callAsync('addEvent', {
      type: 'tournament',
      _id: tournament._id,
      userId: this.userId,
      text: `${this.userId === user._id ? '' : user.username} sagt: ${comment}`,
    });
  },
  async participationRemove(teamId, userId) {
    check(teamId, String);
    check(userId, String);
    if (!(await isAdmin(this.userId))) {
      throw new Meteor.Error('access-denied', 'Nur Admins');
    }
    await Tournaments.updateAsync(
      {
        participants: {
          $elemMatch: { user: userId, team: teamId },
        },
      },
      {
        $pull: {
          participants: {
            user: userId,
            team: teamId,
          },
        },
        $set: {
          lastChange: new Date(),
        },
      }
    );
  },
  async participationUpdate(teamId, userId, participantValue) {
    check(teamId, String);
    check(userId, String);
    check(participantValue, Number);
    const activeUser = await Meteor.users.findOneAsync(this.userId);
    if (!activeUser) {
      throw new Meteor.Error('access-denied', 'Sie müssen angemeldet sein');
    }
    const tournament = await Tournaments.findOneAsync({ 'teams._id': teamId });
    const part = _.find(tournament.participants, (p) => p.team === teamId && p.user === userId);
    if (userId !== this.userId && !(await isAdmin(this.userId)) && part.responsible !== this.userId) {
      throw new Meteor.Error('access-denied', 'Sie dürfen diese Teilnahme nicht ändern');
    }

    let user = await Meteor.users.findOneAsync(userId);
    if (!user) {
      user = { username: part.user, profile: { sex: part.sex } };
    }
    let drawingUpdate;
    let safeStateDate = part.safeStateDate;
    if (participantValue !== part.state) {
      if (part.drawing) {
        drawingUpdate = 1000;
      }
      safeStateDate = new Date();
    }
    await Tournaments.updateAsync(
      {
        participants: {
          $elemMatch: { user: userId, team: teamId },
        },
      },
      {
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
      },
      async (err, res) => {
        if (err) {
          throw err;
        }
        await Meteor.callAsync('addEvent', {
          type: 'tournament',
          userId: this.userId,
          _id: tournament._id,
          text:
            (this.userId === user._id ? '' : `${user.username}: `) +
            textState(participantValue) +
            (part.comment ? `(${part.comment})` : ''),
        });
        if (user && user._id) {
          await Meteor.callAsync('computeStatistics', user._id);
        }
      }
    );
  },
  async participantInsert(params, teamId) {
    check(params, Object);
    check(teamId, String);
    const activeUser = await Meteor.users.findOneAsync(this.userId);
    if (!activeUser) {
      throw new Meteor.Error('access-denied', 'Sie müssen angemeldet sein');
    }
    let user = await Meteor.users.findOneAsync(params.userid);
    if (!user && params.alias) {
      user = await userByAlias(params.alias, this.connection);
    }
    if (!user) {
      user = {
        _id: params.userid,
        username: params.userid,
        profile: { sex: params.sex ? 'W' : 'M' },
      };
      params.dummy = true;
    }
    let tournament = await Tournaments.findOneAsync({
      participants: { $elemMatch: { user: user._id, team: teamId } },
    });
    if (tournament) {
      throw new Meteor.Error('already-there', 'Der Spieler ist bereits beim Team dabei');
    }
    tournament = await Tournaments.findOneAsync({
      participants: { $elemMatch: { team: teamId } },
    });
    delete params.alias;
    params.user = user._id;
    params.drawing = 1000;
    params.username = user.username;
    params.sex = user.profile.sex;
    params.responsible = this.userId;
    params.responsibleName = activeUser.username;
    params.entryDate = new Date();
    params.safeStateDate = new Date();
    params.team = teamId;

    await Tournaments.updateAsync(
      { 'teams._id': teamId },
      {
        $set: { lastChange: new Date() },
        $push: { participants: params },
      },
      async (err, affected) => {
        if (err) {
          throw err;
        }

        await Meteor.callAsync('addEvent', {
          type: 'tournament',
          userId: this.userId,
          _id: tournament._id,
          text:
            (this.userId === user._id ? '' : `${user.username}: `) +
            textState(params.state) +
            (params.comment ? ` und sagt: ${params.comment}` : ''),
        });
        if (!params.dummy) {
          await Meteor.callAsync('computeStatistics', user._id);
        }
      }
    );
  },
  async participantRemove(params, teamId) {
    check(params, Object);
    check(teamId, String);
    const activeUser = await Meteor.users.findOneAsync(this.userId);
    if (!activeUser) {
      throw new Meteor.Error('access-denied', 'Sie müssen angemeldet sein');
    }

    await Tournaments.updateAsync(
      {
        participants: { $elemMatch: { user: params.userid, team: teamId } },
      },
      {
        $set: {
          'participants.$.state': 0,
          'participants.$.drawing': 1000,
          lastChange: new Date(),
        },
      }
    );
  },
});
