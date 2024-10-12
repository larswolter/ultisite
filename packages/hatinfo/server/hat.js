import { moment } from 'meteor/momentjs:moment';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { Roles } from 'meteor/alanning:roles';
import { CronJob } from 'cron';
import Excel from 'exceljs';
import { sendHatReminderEmails } from './mails';
import './teamDrawing';
import { hatSort } from '../utils';

Meteor.startup(function () {
  UltiSite.HatInfo.HatParticipants._ensureIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 60 });

  if (!_.find(Roles.getAllRoles().fetch(), (r) => r.name === 'hatAdmin')) {
    Roles.createRole('hatAdmin');
  }
  UltiSite.HatInfo.HatParticipants.find({ payed: { $exists: false } }).forEach((elem) => {
    UltiSite.HatInfo.HatParticipants.update(elem._id, {
      $set: { payed: moment(elem.createdAt).clone().add(10, 'years').toDate() },
    });
  });

  const job = new CronJob(
    '0 17 6 * * *',
    Meteor.bindEnvironment(() => {
      console.log('checking hat mails');
      sendHatReminderEmails();
    }),
    null,
    false,
    'Europe/Berlin'
  );

  if (Meteor.absoluteUrl('').indexOf('localhost') === -1) {
    job.start();
  }
});

Meteor.methods({
  hatTriggerMailReminder() {
    if (!Roles.userIsInRole(this.userId, ['hatAdmin'])) {
      throw new Meteor.Error('access-denied', 'Änderung nicht erlaubt');
    }
    sendHatReminderEmails();
  },
  async hatHomeTeams() {
    const res = await UltiSite.HatInfo.HatParticipants.rawCollection()
      .aggregate([
        { $match: { hatId: UltiSite.settings().hatId } },
        { $group: { _id: null, hometeams: { $addToSet: '$hometeam' } } },
      ])
      .toArray();
    return [...(UltiSite.settings().arrayHatHomeTeams || []), ...res[0].hometeams];
  },
  createRandomData(total, payed, confirmed) {
    check(total, Number);
    check(payed, Number);
    check(confirmed, Number);
    if (!UltiSite.isAdmin(this.userId)) return;
    UltiSite.HatInfo.HatParticipants.remove({});

    for (let i = 0; i < total; i += 1) {
      const createdAt = moment().subtract(Math.floor(Math.random() * 10) + 3, 'days');
      UltiSite.HatInfo.HatParticipants.insert({
        createdAt: createdAt.toDate(),
        modifiedAt: createdAt.toDate(),
        confirmed: i < confirmed,
        name: Random.id(),
        email: Random.id() + '@hallunken.de',
        city: 'Halle',
        hometeam: 'Hallunken',
        payed:
          i < payed
            ? createdAt
                .clone()
                .add(Math.random() * 20, 'hours')
                .toDate()
            : moment().add(10, 'years').toDate(),
        accessKey: Random.id(34),
        hatId: UltiSite.settings().hatId,
      });
      console.log(createdAt);
    }
  },
  hatConfirmParticipant(accessKey) {
    check(accessKey, String);
    const part = UltiSite.HatInfo.HatParticipants.findOne({ accessKey });
    if (part.allowPublic) {
      UltiSite.HatInfo.HatParticipants.update(
        { accessKey },
        {
          $set: {
            confirmed: true,
            public: {
              name: part.name,
              city: part.city,
              hometeam: part.hometeam,
            },
          },
        }
      );
    } else {
      UltiSite.HatInfo.HatParticipants.update(
        { accessKey },
        {
          $set: { confirmed: true },
        }
      );
    }
  },
  hatParticipate(p) {
    check(p, Object);

    const participant = _.clone(p);
    participant.createdAt = new Date();
    participant.modifiedAt = new Date();
    if (participant.hometeam === UltiSite.settings().teamname) {
      participant.payed = moment().subtract(1, 'second').toDate();
    } else {
      participant.payed = moment().add(10, 'years').toDate();
    }
    participant.accessKey = Random.id(34);
    participant.hatId = UltiSite.settings().hatId;
    if (
      UltiSite.HatInfo.HatParticipants.findOne({
        email: participant.email,
        hatId: participant.hatId,
      })
    ) {
      throw new Meteor.Error('Teilnehmer mit dieser E-Mail existiert schon!');
    }
    UltiSite.HatInfo.HatParticipants.insert(participant);
    const template = Assets.getText('private/confirm.html');
    UltiSite.Mail.send(
      [participant.email],
      `Anmeldung beim ${UltiSite.settings().hatName} bestätigen`,
      UltiSite.renderMailTemplate(template, null, {
        additionalInfos: UltiSite.settings().hatConfirmInfos,
        participant,
        team: UltiSite.settings().teamname,
        url: Meteor.absoluteUrl(`hat_confirm/${participant.accessKey}`),
      })
    );
    return 'inserted';
  },
  hatResendMail(accessKey) {
    check(accessKey, String);
    if (!Roles.userIsInRole(this.userId, ['hatAdmin'])) {
      throw new Meteor.Error('access-denied', 'Änderung nicht erlaubt');
    }
    const participant = UltiSite.HatInfo.HatParticipants.findOne({ accessKey });
    const template = Assets.getText('private/confirm.html');
    UltiSite.Mail.send(
      [participant.email],
      `Anmeldung beim ${UltiSite.settings().hatName} bestätigen`,
      UltiSite.renderMailTemplate(template, null, {
        additionalInfos: UltiSite.settings().hatConfirmInfos,
        participant,
        team: UltiSite.settings().teamname,
        url: Meteor.absoluteUrl(`hat_confirm/${participant.accessKey}`),
      })
    );
  },
  hatParticipationPayed(accessKey) {
    check(accessKey, String);
    const part = UltiSite.HatInfo.HatParticipants.findOne({ accessKey });
    if (!part) {
      throw new Meteor.Error('access-denied', 'Zahlung nicht erlaubt');
    }
    if (!Roles.userIsInRole(this.userId, ['hatAdmin'])) {
      throw new Meteor.Error('access-denied', 'Zahlung nicht erlaubt');
    }

    UltiSite.HatInfo.HatParticipants.update(part._id, { $set: { payed: moment().subtract(1, 'minute').toDate() } });
    return 'payed';
  },
  hatUpdateParticipation(participant) {
    check(participant, Object);
    check(participant.accessKey, String);
    const part = UltiSite.HatInfo.HatParticipants.findOne({ accessKey: participant.accessKey });
    if (!part) {
      throw new Meteor.Error('access-denied', 'Änderung nicht erlaubt');
    }
    if (!Roles.userIsInRole(this.userId, ['hatAdmin'])) {
      participant = _.pick(participant, 'name', 'city', 'hometeam', 'strength', 'years', 'allowPublic');
    }
    participant.modifiedAt = new Date();

    if (participant.allowPublic && part.confirmed) {
      UltiSite.HatInfo.HatParticipants.update(part._id, {
        $set: {
          ...participant,
          public: {
            ..._.pick(participant, 'name', 'city', 'hometeam'),
          },
        },
      });
    } else {
      UltiSite.HatInfo.HatParticipants.update(part._id, {
        $set: participant,
        $unset: { public: 1 },
      });
    }
    return 'updated';
  },
  hatRemoveParticipation(accessKey) {
    check(accessKey, String);
    const part = UltiSite.HatInfo.HatParticipants.findOne({ accessKey });
    if (!part) {
      throw new Meteor.Error('access-denied', 'Änderung nicht erlaubt');
    }
    UltiSite.Mail.send(
      [UltiSite.settings().hatEmail],
      `Stornierung beim ${UltiSite.settings().hatName}`,
      `<p>Der folgende Teilnehmer hat sich abgemeldet:</p><pre>${JSON.stringify(part, null, 2)}</pre>`
    );

    UltiSite.HatInfo.HatParticipants.remove(part._id);
    return 'removed';
  },
});

Meteor.publish('hatParticipants', function () {
  const sort = hatSort();
  const filter = {
    hatId: UltiSite.settings().hatId || undefined,
  };
  /*
  if(search && search.trim())
      filter.$or= [
          { name: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') }
      ];
  */
  if (Roles.userIsInRole(this.userId, ['hatAdmin'])) {
    return UltiSite.HatInfo.HatParticipants.find(filter, { sort });
  }

  return UltiSite.HatInfo.HatParticipants.find(filter, {
    sort,
    fields: {
      strength: 1,
      fitness: 1,
      experience: 1,
      years: 1,
      public: 1,
      createdAt: 1,
      confirmed: 1,
      payed: 1,
    },
  });
});
Meteor.publish('hatParticipant', function (accessKey) {
  check(accessKey, String);
  return UltiSite.HatInfo.HatParticipants.find({ accessKey });
});

WebApp.connectHandlers.use('/_hatInfoExport', function (req, res, next) {
  const { query } = Npm.require('url').parse(req.url, true);
  const user = Meteor.users.findOne({ 'profile.downloadToken': query.downloadToken });
  if (!user || !Roles.userIsInRole(user._id, ['hatAdmin'])) {
    res.writeHead(403);
    res.end();
    return;
  }

  const workbook = new Excel.Workbook();
  workbook.creator = 'Ultisite';
  workbook.lastModifiedBy = user.username;
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet('Participants', { views: [{ xSplit: 1, ySplit: 1 }] });
  sheet.columns = _.without(UltiSite.HatInfo.schema._schemaKeys, 'accessKey').map((column) => ({
    header: UltiSite.HatInfo.schema.label(column),
    key: column,
    width: 20,
  }));
  UltiSite.HatInfo.HatParticipants.find({
    hatId: UltiSite.settings().hatId || undefined,
  }).forEach((entry) =>
    sheet.addRow({
      ...entry,
      strength: Number(entry.strength),
      experience: Number(entry.experience),
      years: Number(entry.years),
      fitness: Number(entry.fitness),
    })
  );
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${UltiSite.settings().hatId}-Participants-${moment().format('YYYY-MM-DD_HH-mm')}.xlsx"`
  );
  res.writeHead(200);
  workbook.xlsx.write(res).then(() => {
    res.end();
  });
});
