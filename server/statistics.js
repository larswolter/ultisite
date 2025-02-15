import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { moment } from 'meteor/momentjs:moment';
import { Statistics, Tournaments } from '../common/lib/ultisite';

Meteor.startup(async () => {
  await Statistics.removeAsync({});
});

Meteor.methods({
  async computeStatistics(userId) {
    check(userId, String);
    this.unblock();
    let players = [];

    const teams = [];
    await Tournaments.find({
      'teams.state': 'dabei',
      participants: {
        $elemMatch: {
          user: userId,
          state: 100,
        },
      },
    }).forEachAsync(function (tournament) {
      tournament.teams.forEach((team) => {
        if (!tournament.participants.find((p) => p.team === team._id && p.user === userId)) return;
        const participants = tournament.participants.filter((p) => p.team === team._id);
        if (Array.isArray(participants) && moment().isAfter(tournament.date)) {
          players = players.concat(
            participants
              .filter((part) => part._id !== userId && part.state === 100)
              .map(function (participant) {
                return participant.user;
              })
          );
        }

        teams.push({
          name: tournament.name,
          date: tournament.date,
          city: tournament.address.city,
          country: tournament.address.country,
          teamname: team.name,
          teamId: team._id,
          teamImage: team.image,
          tournamentId: tournament._id,
          unsure: team.state !== 'dabei' || tournament.category === 'Veranstaltung',
        });
      });
    });
    const played = _.sortBy(
      teams.filter(function (elem) {
        if (!elem) {
          return false;
        }
        if (moment(elem.date).isAfter(moment())) {
          return false;
        }
        return true;
      }),
      function (elem) {
        return -moment(elem.date).diff(moment(), 'seconds');
      }
    );
    const planned = _.sortBy(
      teams.filter(function (elem) {
        if (!elem) {
          return false;
        }
        if (moment(elem.date).isBefore(moment())) {
          return false;
        }
        return true;
      }),
      function (elem) {
        return moment(elem.date).diff(moment(), 'seconds');
      }
    );

    let stats = {
      target: userId,
      type: 'playedTournaments',
      data: played,
    };
    await Statistics.upsertAsync(
      {
        target: stats.target,
        type: stats.type,
      },
      {
        $set: {
          data: stats.data,
        },
      }
    );
    stats = {
      target: userId,
      type: 'plannedTournaments',
      data: planned,
    };
    await Statistics.upsertAsync(
      {
        target: stats.target,
        type: stats.type,
      },
      {
        $set: {
          data: stats.data,
        },
      }
    );
    let result = [];
    const playerCounts = _.countBy(players, (p) => p);

    Object.keys(playerCounts).forEach(async pc => {
      if (pc !== userId) {
        result.push({
          userId: pc,
          username: ((await Meteor.users.findOneAsync(pc)) || {}).username || pc,
          count: playerCounts[pc],
        });
      }
    });
    result = _.first(_.sortBy(result, 'count').reverse(), 10);

    const top10Stats = {
      target: userId,
      type: 'top10Players',
      data: result,
    };
    await Statistics.upsertAsync(
      {
        target: top10Stats.target,
        type: top10Stats.type,
      },
      top10Stats
    );
  },
});
