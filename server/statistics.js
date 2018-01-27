import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.startup(() => {
  UltiSite.Statistics.remove({});
});

Meteor.methods({
  computeStatistics(userId) {
    check(userId, String);
    this.unblock();
    let players = [];

    const teams = UltiSite.Teams.find({
      state: 'dabei',
      participants: {
        $elemMatch: {
          user: userId,
          state: 100,
        },
      },
    }).map(function (team) {
      const tournament = UltiSite.Tournaments.findOne(team.tournamentId);
      if (!tournament) { return undefined; }
      if (!team) { return undefined; }

      if (Array.isArray(team.participants) && moment().isAfter(tournament.date)) {
        players = players.concat(team.participants.filter(part => (part._id !== userId) && (part.state === 100)).map(function (participant) {
          return participant.user;
        }));
      }

      return {
        name: tournament.name,
        date: tournament.date,
        city: tournament.address.city,
        country: tournament.address.country,
        teamname: team.name,
        teamId: team._id,
        teamImage: team.image,
        tournamentId: tournament._id,
        unsure: (team.state !== "dabei") || (tournament.category === "Veranstaltung"),
      };
    });
    const played = _.sortBy(teams.filter(function (elem) {
      if (!elem) { return false; }
      if (moment(elem.date).isAfter(moment())) { return false; }
      return true;
    }), function (elem) {
      return -moment(elem.date).diff(moment(), "seconds");
    });
    const planned = _.sortBy(teams.filter(function (elem) {
      if (!elem) { return false; }
      if (moment(elem.date).isBefore(moment())) { return false; }
      return true;
    }), function (elem) {
      return moment(elem.date).diff(moment(), "seconds");
    });

    let stats = {
      target: userId,
      type: "playedTournaments",
      data: played,
    };
    UltiSite.Statistics.upsert({
      target: stats.target,
      type: stats.type,
    }, {
      $set: {
          data: stats.data,
        },
    });
    stats = {
      target: userId,
      type: "plannedTournaments",
      data: planned,
    };
    UltiSite.Statistics.upsert({
      target: stats.target,
      type: stats.type,
    }, {
      $set: {
          data: stats.data,
        },
    });
    let result = [];
    const playerCounts = _.countBy(players, p => p);

    Object.keys(playerCounts).forEach((pc) => {
      result.push({
        userId: pc,
        username: (Meteor.users.findOne(pc) || {}).username || pc,
        count: playerCounts[pc],
      });
    });
    result = _.first(_.sortBy(result, 'count').reverse(), 10);

    const top10Stats = {
      target: userId,
      type: "top10Players",
      data: result,
    };
    UltiSite.Statistics.upsert({
      target: top10Stats.target,
      type: top10Stats.type,
    }, top10Stats);
  },

});
