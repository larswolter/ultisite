import { WebApp } from 'meteor/webapp';
import Excel from 'exceljs';
import { Statistics } from '../common/lib/ultisite';

WebApp.connectHandlers.use('/_myTournaments.xlsx', (req, resp) => {
  if (!req.query.token) {
    resp.writeHead(403);
    resp.end('Param token required');
    return;
  }
  const user = Meteor.users.findOne({ 'profile.downloadToken': req.query.token });
  if (!user) {
    resp.writeHead(403);
    resp.end('token not valid');
    return;
  }

  const stats = Statistics.findOne({ target: user._id, type: 'playedTournaments' });
  if (!stats) {
    resp.writeHead(404);
    resp.end('no statistics found');
    return;
  }

  const workbook = new Excel.Workbook();
  workbook.creator = 'Ultisite';
  workbook.lastModifiedBy = user.username;
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet('Gespielte Turniere', { views: [{ xSplit: 1, ySplit: 1 }] });
  sheet.columns = [
    { header: 'Datum', key: 'date', width: 15 },
    { header: 'Turnier', key: 'name', width: 32 },
    { header: 'Land', key: 'country', width: 10 },
    { header: 'Stadt', key: 'city', width: 24 },
    { header: 'Team', key: 'teamname', width: 24 },
  ];
  stats.data.forEach((entry) => sheet.addRow(entry));
  resp.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  resp.setHeader('Content-Disposition', `attachment; filename="gespielte-turniere.xlsx"`);
  resp.writeHead(200);
  workbook.xlsx.write(resp).then(() => {
    resp.end();
  });
});
