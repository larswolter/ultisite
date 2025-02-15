import Grid from 'gridfs-locking-stream';
import { Blogs, Events, Practices, Teams, Tournaments } from '../common/lib/ultisite';

Meteor.startup(function () {
  console.log('starting migrations...');
  Events.update({ lastChange: { $exists: false } }, { $set: { lastChange: new Date() } }, { multi: true });
  Blogs.update({ lastChange: { $exists: false } }, { $set: { lastChange: new Date() } }, { multi: true });
  Practices.update({ lastChange: { $exists: false } }, { $set: { lastChange: new Date() } }, { multi: true });

  Tournaments.find({ participants: { $exists: false } }).forEach((tournament) => {
    const participants = [];
    const teams = [];
    tournament.teams &&
      tournament.teams.forEach((teamId) => {
        const team = Teams.findOne(teamId);
        if (team) {
          team.participants &&
            team.participants.forEach((p) => {
              p.team = team._id;
              participants.push(p);
            });
          delete team.participants;
          delete team.tournamentId;
          delete team.tournamentDate;
          delete team.lastChange;
          teams.push(team);
        }
      });
    Tournaments.update(tournament._id, {
      $set: {
        participants,
        teams,
        lastChange: new Date(),
      },
    });
  });
  Meteor.users.find({ 'club.dfv': { $exists: true } }).forEach((u) => {
    if (!Array.isArray(u.club.dfv)) {
      if (u.club.dfv) {
        Meteor.users.update(u._id, { $set: { 'club.dfv': [2018] } });
      } else {
        Meteor.users.update(u._id, { $set: { 'club.dfv': [] } });
      }
    }
  });
  console.log('migrations finished');
});
