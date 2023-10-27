import { moment } from 'meteor/momentjs:moment';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { Roles } from 'meteor/alanning:roles';
import { CronJob } from 'cron';
import Excel from 'exceljs';

WebApp.connectHandlers.use('/_hatTeamDrawing', function (req, res, next) {
  const { query } = Npm.require('url').parse(req.url, true);
  check(query.downloadToken, String);
  check(query.teams, String);
  const user = Meteor.users.findOne({ 'profile.downloadToken': query.downloadToken });
  if (!user || !Roles.userIsInRole(user._id, ['hatAdmin'])) {
    res.writeHead(403);
    res.end();
    return;
  }
  const numTeams = Number(query.teams);
  const teams = [];
  const participants = UltiSite.HatInfo.HatParticipants.find({ confirmed: true, payed: { $lte: new Date() } }).fetch();
  const playersPerTeam = Math.ceil(participants.length / numTeams);
  console.log(`Drawing ${numTeams} teams with ${playersPerTeam} from ${participants.length} players`);
  for (let t = 0; t < numTeams; t += 1) {
    const players = [];
    for (let p = 0; p < playersPerTeam; p += 1) {
      const player = participants.pop();
      player && players.push(`${player.name} (${player.hometeam})`);
    }
    teams.push({ name: `Team ${t}`, players });
  }

  const workbook = new Excel.Workbook();
  workbook.creator = 'Ultisite';
  workbook.lastModifiedBy = user.username;
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet('Teams', { views: [{ xSplit: 1, ySplit: 1 }] });
  sheet.columns = teams.map((team, idx) => ({
    header: team.name,
    key: idx,
    width: 60,
  }));
  for (let p = 0; p < playersPerTeam; p += 1) {
    sheet.addRow(teams.map((t) => t.players[p] || '-'));
  }
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${UltiSite.settings().hatId}-Teams-${moment().format('YYYY-MM-DD_HH-mm')}.xlsx"`
  );
  res.writeHead(200);
  workbook.xlsx.write(res).then(() => {
    res.end();
  });
});
