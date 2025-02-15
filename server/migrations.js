import Grid from 'gridfs-locking-stream';
import { Blogs, Events, Practices, Teams, Tournaments } from '../common/lib/ultisite';

Meteor.startup(async function() {
  console.log('starting migrations...');
  await Events.updateAsync({ lastChange: { $exists: false } }, { $set: { lastChange: new Date() } }, { multi: true });
  await Blogs.updateAsync({ lastChange: { $exists: false } }, { $set: { lastChange: new Date() } }, { multi: true });
  await Practices.updateAsync({ lastChange: { $exists: false } }, { $set: { lastChange: new Date() } }, { multi: true });

  await Tournaments.find({ participants: { $exists: false } }).forEachAsync(async tournament => {
    const participants = [];
    const teams = [];
    tournament.teams &&
      tournament.teams.forEach(async teamId => {
        const team = await Teams.findOneAsync(teamId);
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
    await Tournaments.updateAsync(tournament._id, {
      $set: {
        participants,
        teams,
        lastChange: new Date(),
      },
    });
  });
  await Meteor.users.find({ 'club.dfv': { $exists: true } }).forEachAsync(async u => {
    if (!Array.isArray(u.club.dfv)) {
      if (u.club.dfv) {
        await Meteor.users.updateAsync(u._id, { $set: { 'club.dfv': [2018] } });
      } else {
        await Meteor.users.updateAsync(u._id, { $set: { 'club.dfv': [] } });
      }
    }
  });
  console.log('migrations finished');
});
