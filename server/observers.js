import { Meteor } from 'meteor/meteor';

Meteor.startup(function () {
  Tournaments.find({ category: 'HAT-Turnier', teams: { $exists: false } }).observeChanges({
    added(tournamentId, fields) {
      console.log('missing hat team on ', tournamentId, fields.name);
    },
  });
});
