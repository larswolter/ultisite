import { moment } from 'meteor/momentjs:moment';
import { check } from 'meteor/check';

import Excel from 'exceljs';
import { hatSort } from '../utils';
import { HatParticipants } from '../schema';
import { settings, Roles } from './server';

WebApp.connectHandlers.use('/_hatTeamDrawing', async function (req, res, next) {
  const { query } = Npm.require('url').parse(req.url, true);
  check(query.downloadToken, String);
  check(query.teams, String);
  const user = await Meteor.users.findOneAsync({ 'profile.downloadToken': query.downloadToken });
  if (!user || !(await Roles.userIsInRoleAsync(user._id, ['hatAdmin']))) {
    res.writeHead(403);
    res.end();
    return;
  }
  const numTeams = Number(query.teams);
  const teams = [];
  const participants = await HatParticipants.find(
    { confirmed: true, payed: { $lte: new Date() } },
    { sort: hatSort(), limit: Number(settings().hatNumPlayers) }
  ).fetchAsync();
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
  strengthList = [...strengthList, ...girls.slice(-numTeams).reverse()];
  girls = girls.slice(0, -numTeams);
  // add strongest non-girls
  strengthList = [...strengthList, ...guys.slice(0, numTeams)];
  guys = guys.slice(numTeams);
  // add weakest non-girls
  strengthList = [...strengthList, ...guys.slice(-numTeams).reverse()];
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
      teams[p % numTeams].players.push([
        `${player.name} (${player.hometeam}) [${player.gender[0]}]`,
        partStrength(player),
      ]);
  }

  const workbook = new Excel.Workbook();
  workbook.creator = 'Ultisite';
  workbook.lastModifiedBy = user.username;
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet('Teams', { views: [{ xSplit: 1, ySplit: 1 }] });

  sheet.columns = teams
    .map((team, idx) => [
      {
        header: team.name,
        style: {
          alignment: { vertical: 'middle', horizontal: 'center' },
          border: {
            left: { style: 'thick', color: { argb: 'FF000000' } },
          },
        },
        key: idx,
        width: 60,
      },
      {
        header: {
          formula: `=SUM(${String.fromCharCode([idx * 2 + 1 + 'A'.charCodeAt(0)])}2:${String.fromCharCode([
            idx * 2 + 1 + 'A'.charCodeAt(0),
          ])}100)`,
          result: team.players.reduce((sum, cur) => cur[1] + sum, 0),
        },
        style: {
          alignment: { vertical: 'middle', horizontal: 'center' },
          border: {
            right: { style: 'thick', color: { argb: 'FF000000' } },
          },
        },
        key: idx + '-',
        width: 10,
      },
    ])
    .flat();
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFAAAAAA' },
  };
  sheet.getRow(1).border = { bottom: { style: 'double', color: { argb: 'FF000000' } } };
  sheet.getRow(1).height = 15;

  for (let p = 0; p < playersPerTeam + 1; p += 1) {
    sheet.addRow(teams.map((t) => t.players[p] || ['-', 0]).flat());
  }
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${settings().hatId}-Teams-${moment().format('YYYY-MM-DD_HH-mm')}.xlsx"`
  );
  res.writeHead(200);
  workbook.xlsx.write(res).then(() => {
    res.end();
  });
});
