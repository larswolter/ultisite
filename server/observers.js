import { Meteor } from 'meteor/meteor';
import { Tournaments } from '../common/lib/ultisite';

Meteor.startup(function () {
  Tournaments.find({ category: 'HAT-Turnier', teams: { $exists: false } }).observeChanges({
    added(tournamentId, fields) {
      console.log('missing hat team on ', tournamentId, fields.name);
    },
  });
});
