import { Meteor } from 'meteor/meteor';
import { aggregateTeamInfo } from '../imports/helpers';
import UltiSite from '../imports/Ultisite';

Meteor.startup(function () {
  UltiSite.Tournaments.find({ teams: { $exists: true } }).observe({
    changed(tournament) {
      tournament.teams.forEach((t) => {
        const info = aggregateTeamInfo({
          ...t,
          participants: tournament.participants.filter((p) => p.team === t._id),
        });
        if (JSON.stringify(t.teamInfo) !== JSON.stringify(info)) {
          UltiSite.Tournaments.updateAsync(
            { _id: tournament._id, 'teams._id': t._id },
            { $set: { 'teams.$.teamInfo': info } }
          )
            .then(() => console.log('updated teamstats after tournament change'))
            .catch((err) => console.log('error updating teamstats after tournament change', err));
        }
      });
    },
  });

  UltiSite.Tournaments.find({ category: 'HAT-Turnier', teams: { $exists: false } }).observeChanges({
    added(tournamentId, fields) {
      console.log('missing hat team on ', tournamentId, fields.name);
    },
  });
});
