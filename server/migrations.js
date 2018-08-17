import Grid from 'gridfs-locking-stream';

const gridFS = Grid(UltiSite.Documents.rawDatabase(), Npm.require('mongodb'), 'documents-grid');


Meteor.startup(function () {
  console.log('starting migrations...');
  UltiSite.Events.update({ lastChange: { $exists: false } }, { $set: { lastChange: new Date() } }, { multi: true });
  UltiSite.Blogs.update({ lastChange: { $exists: false } }, { $set: { lastChange: new Date() } }, { multi: true });
  UltiSite.Practices.update({ lastChange: { $exists: false } }, { $set: { lastChange: new Date() } }, { multi: true });

  const Teams = new Meteor.Collection('Teams');

  UltiSite.Tournaments.find({ 'participants': { $exists: false } }).forEach((tournament) => {
    const participants = [];
    const teams = [];
    tournament.teams && tournament.teams.forEach((teamId) => {
      const team = Teams.findOne(teamId);
      if (team) {
        team.participants && team.participants.forEach((p) => {
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
    UltiSite.Tournaments.update(tournament._id, {
      $set: {
        participants,
        teams,
        lastChange: new Date(),
      },
    });
  });
  console.log('migrations finished');
});
