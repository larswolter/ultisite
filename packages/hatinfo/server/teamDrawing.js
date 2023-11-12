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
  const partStrength = (p) => {
    return Number(p.strength) + Number(p.years) + Number(p.experience) + Number(p.fitness);
  };
  // separate by girls and non girls
  let girls = participants
    .filter((p) => p.gender === 'weiblich')
    .sort((b, a) => {
      return partStrength(a) - partStrength(b);
    });
  let guys = participants
    .filter((p) => p.gender !== 'weiblich')
    .sort((b, a) => {
      return partStrength(a) - partStrength(b);
    });
  console.log(`separeted players ${girls.length} girls and ${guys.length} guys`);
  // add storngest girls
  let strengthList = girls.slice(0, numTeams);
  girls = girls.slice(numTeams);
  // add weakest girls
  strengthList = [...strengthList, ...girls.slice(-numTeams)];
  girls = girls.slice(0, -numTeams);
  // add strongest non-girls
  strengthList = [...strengthList, ...guys.slice(0, numTeams)];
  guys = guys.slice(numTeams);
  // add weakest non-girls
  strengthList = [...strengthList, ...guys.slice(-numTeams)];
  guys = guys.slice(0, -numTeams);

  strengthList = [...strengthList, ...guys, ...girls].reverse();
  const playersPerTeam = Math.ceil(participants.length / numTeams);
  console.log(`Drawing ${numTeams} teams with ${playersPerTeam} from ${strengthList.length} players`);
  // create teams
  for (let t = 0; t < numTeams; t += 1) {
    teams.push({ name: `Team ${t}`, players: [] });
  }
  const total = strengthList.length;

  // distribute all players across the teams
  for (let p = 0; p < total; p += 1) {
    const player = strengthList.pop();
    player &&
      teams[p % numTeams].players.push(
        `[${partStrength(player).toLocaleString('de', { minimumSignificantDigits: 2 })}] - ${player.name} (${
          player.hometeam
        })`
      );
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
