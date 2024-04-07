import Grid from 'gridfs-locking-stream';
import UltiSite from '../imports/Ultisite';
import { aggregateTeamInfo } from '../imports/helpers';

const gridFS = Grid(UltiSite.Documents.rawDatabase(), Npm.require('mongodb'), 'documents-grid');

Meteor.startup(function () {
  console.log('starting migrations...');
  UltiSite.Events.update({ lastChange: { $exists: false } }, { $set: { lastChange: new Date() } }, { multi: true });
  UltiSite.Blogs.update({ lastChange: { $exists: false } }, { $set: { lastChange: new Date() } }, { multi: true });
  UltiSite.Practices.update({ lastChange: { $exists: false } }, { $set: { lastChange: new Date() } }, { multi: true });

  const Teams = new Meteor.Collection('Teams');

  UltiSite.Tournaments.find({ participants: { $exists: false } }).forEach((tournament) => {
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
    UltiSite.Tournaments.update(tournament._id, {
      $set: {
        participants,
        teams,
        lastChange: new Date(),
      },
    });
  });

  UltiSite.Tournaments.find({ 'teams.teamInfo.femalesFull': { $exists: false }, 'teams.name': { $exists: true } }).forEach(
    (tournament) => {
      tournament.teams.forEach((t) => {
        const info = aggregateTeamInfo({
          ...t,
          participants: tournament.participants.filter((p) => p.team === t._id),
        });
        UltiSite.Tournaments.update(
          { _id: tournament._id, 'teams._id': t._id },
          { $set: { 'teams.$.teamInfo': info } }
        );
      });
    }
  );
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
