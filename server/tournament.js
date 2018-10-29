import { moment } from 'meteor/momentjs:moment';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { SyncedCron } from 'meteor/percolate:synced-cron';

UltiSite.Tournaments.before.update(function (userId, doc, fieldNames, modifier, options) {
  modifier.$set = modifier.$set || {};
  modifier.$set.lastChange = new Date();
});

UltiSite.Tournaments.before.insert(function (userId, doc) {
  doc.lastChange = new Date();
  doc.participants = [];
});

UltiSite.getTeam = function (id) {
  return UltiSite.Tournaments.findOne({ 'teams._id': id }).teams[id];
};

UltiSite.getTournamentsStates = function (userId) {
  const teams = [];
  UltiSite.Tournaments.find({
    date: { $gte: new Date() },
    participants: { $elemMatch: { user: userId, state: { $gt: 50 } } },
  }).forEach((tournament) => {
    tournament.participants.filter(p => p.user === userId).forEach((part) => {
      const team = _.find(tournament.teams, t => t._id === part.team);
      teams.push({
        url: FlowRouter.url('tournament', { _id: tournament._id }),
        name: tournament.name,
        date: moment(tournament.date).format('DD.MM.'),
        city: tournament.address && tournament.address.city,
        state: UltiSite.textState(part.state),
        comment: part.comment,
        teamName: team.name,
        teamState: team.state,
        sicher: tournament.participants.filter(p => (p.team === part.team) && (p.state > 90)).length,
        wahrscheinlich: tournament.participants.filter(p => (p.team === part.team) && (p.state < 90) && (p.state > 50)).length,
        interessiert: tournament.participants.filter(p => (p.team === part.team) && (p.state < 50) && (p.state > 0)).length,
      });
    });
  });
  return teams;
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
    const ids = UltiSite.Tournaments.find({
      date: {
        $gte: moment().toDate(),
      },
      $or: [
        { 'teams.clubTeam': true },
        { 'participants.user': this.userId },
      ],
    }, { fields: { _id: 1 } }).map(function (t) {
      return t._id;
    });
    ids.concat(UltiSite.Tournaments.find({
      tournamentDate: {
        $lte: moment().toDate(),
        $gte: moment().subtract(6, 'month').toDate(),
      },
      'teams.state': 'dabei',
      $or: [
        { 'teams.clubTeam': true },
        { 'participants.user': this.userId },
      ],
    }, {
      limit: 5, fields: { _id: 1 },
    }).map(function (t) {
        return t._id;
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
    teamData._id = Random.id();
    console.log(`Created Team ${teamData._id} `);
    UltiSite.Tournaments.update(tournamentId, {
      $set: { lastChange: new Date() },
      $push: { teams: teamData },
    });
    Meteor.call('addEvent', {
      type: 'tournament',
      _id: tournamentId,
      text: `Neues Team ${teamData.name}`,
    });
    return teamData._id;
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
    UltiSite.Tournaments.find({
      date: {
        $gte: moment().startOf('day').toDate(),
      },
      'teams.drawingResult': { $exists: false },
      'teams.drawingDate': {
        $lte: moment().endOf('day').toDate(),
      },
    }).forEach(function (tournament) {
      tournament.teams.forEach((team) => {
        if (team.drawingResult) { return; }
        if (moment(team.drawingDate).isAfter(moment().startOf('day'))) { return; }
        const participants = tournament.participants.filter(p => p.team === team._id);

        const partCount = participants.length;
        let numbers = [];
        const result = {
          date: new Date(),
        };
        for (let i = 1; i <= partCount; i += 1) {
          numbers[i - 1] = i;
        }
        const orderedParticipants = _.sortBy(_.sortBy(participants, 'safeStateDate'), p => 100 - p.state);

        orderedParticipants.forEach((part, idx) => {
          const selection = (Math.random() * numbers.length).toFixed();
          let pos = numbers[selection];
          numbers = _.without(numbers, pos);
          if (idx < (team.maxPlayers / 2)) { pos = 0; }
          if (part.state !== 100) { pos = 1000; }
          UltiSite.Tournaments.update({ _id: tournament._id, 'participants.user': part.user }, {
            $set: { 'participants.$.drawing': pos },
          });
          result[part.user.toCamelCase()] = pos;
        });
        UltiSite.Tournaments.update({ _id: tournament._id, 'teams._id': team._id }, {
          $set: {
            'teams.$.drawingResult': result,
            lastChange: new Date(),
          },
        });
        const drawnParticipants = UltiSite.participantList(team._id).map(p => p.username).join(', ');

        console.log(`finished drawing:${drawnParticipants}`);
        if (team.maxPlayers < partCount * 2) {
          Meteor.call('addEvent', {
            type: 'tournament',
            _id: tournament._id,
            text: `Auslosung bei ${team.name}:${drawnParticipants}`,
          });
        }
      });
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
