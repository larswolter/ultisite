import { Meteor } from 'meteor/meteor';
import { aggregateTeamInfo } from '../imports/helpers';
import UltiSite from '../imports/Ultisite';

let observerSetup = false;
const update = (tournament) => {
  if(!observerSetup) return;
  console.log('observed tournament change');
  tournament.teams.forEach((t) => {
    const info = aggregateTeamInfo({
      ...t,
      participants: tournament.participants.filter((p) => p.team === t._id),
    });
    console.log('checking team', t.name);
    if (JSON.stringify(t.teamInfo) !== JSON.stringify(info)) {
      UltiSite.Tournaments.updateAsync(
        { _id: tournament._id, 'teams._id': t._id },
        { $set: { 'teams.$.teamInfo': info } }
      )
        .then(() => console.log('updated teamstats after tournament change'))
        .catch((err) => console.log('error updating teamstats after tournament change', err));
    }
  });
};

Meteor.startup(function () {
  UltiSite.Tournaments.find({ teams: { $exists: true } }).observe({
    added: update,
    changed: update,
  });
  observerSetup=true;
  UltiSite.Tournaments.find({ category: 'HAT-Turnier', teams: { $exists: false } }).observeChanges({
    added(tournamentId, fields) {
      console.log('missing hat team on ', tournamentId, fields.name);
    },
  });
});
