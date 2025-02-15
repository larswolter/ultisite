import { moment } from 'meteor/momentjs:moment';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { Roles } from 'meteor/alanning:roles';
import { CronJob } from 'cron';
import Excel from 'exceljs';
import { sendHatReminderEmails } from './mails';
import './teamDrawing';
import { hatSort } from '../utils';
import { HatInfo, HatParticipants } from '../schema';
import { isAdmin, Mail, renderMailTemplate, settings } from './server';

Meteor.startup(async function () {
  HatParticipants._ensureIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 60 });

  if (!_.find(Roles.getAllRoles().fetch(), (r) => r.name === 'hatAdmin')) {
    Roles.createRole('hatAdmin');
  }
  await HatParticipants.find({ payed: { $exists: false } }).forEachAsync(async (elem) => {
    await HatParticipants.updateAsync(elem._id, {
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
  async hatTriggerMailReminder() {
    if (!Roles.userIsInRole(this.userId, ['hatAdmin'])) {
      throw new Meteor.Error('access-denied', 'Änderung nicht erlaubt');
    }
    sendHatReminderEmails();
  },
  async hatHomeTeams() {
    const res = await HatParticipants.rawCollection()
      .aggregate([
        { $match: { hatId: settings().hatId } },
        { $group: { _id: null, hometeams: { $addToSet: '$hometeam' } } },
      ])
      .toArray();
    return [...(settings().arrayHatHomeTeams || []), ...res[0].hometeams];
  },
  async createRandomData(total, payed, confirmed) {
    check(total, Number);
    check(payed, Number);
    check(confirmed, Number);
    if (!isAdmin(this.userId)) return;
    await HatParticipants.removeAsync({});

    for (let i = 0; i < total; i += 1) {
      const createdAt = moment().subtract(Math.floor(Math.random() * 10) + 3, 'days');
      await HatParticipants.insertAsync({
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
        hatId: settings().hatId,
      });
      console.log(createdAt);
    }
  },
  async hatConfirmParticipant(accessKey) {
    check(accessKey, String);
    const part = await HatParticipants.findOneAsync({ accessKey });
    if (part.allowPublic) {
      await HatParticipants.updateAsync(
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
      await HatParticipants.updateAsync(
        { accessKey },
        {
          $set: { confirmed: true },
        }
      );
    }
  },
  async hatParticipate(p) {
    check(p, Object);

    const participant = _.clone(p);
    participant.createdAt = new Date();
    participant.modifiedAt = new Date();
    if (participant.hometeam === settings().teamname) {
      participant.payed = moment().subtract(1, 'second').toDate();
    } else {
      participant.payed = moment().add(10, 'years').toDate();
    }
    participant.accessKey = Random.id(34);
    participant.hatId = settings().hatId;
    if (
      await HatParticipants.findOneAsync({
        email: participant.email,
        hatId: participant.hatId,
      })
    ) {
      throw new Meteor.Error('Teilnehmer mit dieser E-Mail existiert schon!');
    }
    await HatParticipants.insertAsync(participant);
    const template = Assets.getText('private/confirm.html');
    Mail.send(
      [participant.email],
      `Anmeldung beim ${settings().hatName} bestätigen`,
      renderMailTemplate(template, null, {
        additionalInfos: settings().hatConfirmInfos,
        participant,
        team: settings().teamname,
        url: Meteor.absoluteUrl(`hat_confirm/${participant.accessKey}`),
      })
    );
    return 'inserted';
  },
  async hatResendMail(accessKey) {
    check(accessKey, String);
    if (!Roles.userIsInRole(this.userId, ['hatAdmin'])) {
      throw new Meteor.Error('access-denied', 'Änderung nicht erlaubt');
    }
    const participant = await HatParticipants.findOneAsync({ accessKey });
    const template = Assets.getText('private/confirm.html');
    Mail.send(
      [participant.email],
      `Anmeldung beim ${settings().hatName} bestätigen`,
      renderMailTemplate(template, null, {
        additionalInfos: settings().hatConfirmInfos,
        participant,
        team: settings().teamname,
        url: Meteor.absoluteUrl(`hat_confirm/${participant.accessKey}`),
      })
    );
  },
  async hatParticipationPayed(accessKey) {
    check(accessKey, String);
    const part = await HatParticipants.findOneAsync({ accessKey });
    if (!part) {
      throw new Meteor.Error('access-denied', 'Zahlung nicht erlaubt');
    }
    if (!Roles.userIsInRole(this.userId, ['hatAdmin'])) {
      throw new Meteor.Error('access-denied', 'Zahlung nicht erlaubt');
    }

    await HatParticipants.updateAsync(part._id, { $set: { payed: moment().subtract(1, 'minute').toDate() } });
    return 'payed';
  },
  async hatUpdateParticipation(participant) {
    check(participant, Object);
    check(participant.accessKey, String);
    const part = await HatParticipants.findOneAsync({ accessKey: participant.accessKey });
    if (!part) {
      throw new Meteor.Error('access-denied', 'Änderung nicht erlaubt');
    }
    if (!Roles.userIsInRole(this.userId, ['hatAdmin'])) {
      participant = _.pick(participant, 'name', 'city', 'hometeam', 'strength', 'years', 'allowPublic');
    }
    participant.modifiedAt = new Date();

    if (participant.allowPublic && part.confirmed) {
      await HatParticipants.updateAsync(part._id, {
        $set: {
          ...participant,
          public: {
            ..._.pick(participant, 'name', 'city', 'hometeam'),
          },
        },
      });
    } else {
      await HatParticipants.updateAsync(part._id, {
        $set: participant,
        $unset: { public: 1 },
      });
    }
    return 'updated';
  },
  async hatRemoveParticipation(accessKey) {
    check(accessKey, String);
    const part = await HatParticipants.findOneAsync({ accessKey });
    if (!part) {
      throw new Meteor.Error('access-denied', 'Änderung nicht erlaubt');
    }
    Mail.send(
      [settings().hatEmail],
      `Stornierung beim ${settings().hatName}`,
      `<p>Der folgende Teilnehmer hat sich abgemeldet:</p><pre>${JSON.stringify(part, null, 2)}</pre>`
    );

    await HatParticipants.removeAsync(part._id);
    return 'removed';
  },
});

Meteor.publish('hatParticipants', async function () {
  const sort = hatSort();
  const filter = {
    hatId: settings().hatId || undefined,
  };
  /*
  if(search && search.trim())
      filter.$or= [
          { name: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') }
      ];
  */
  if (Roles.userIsInRole(this.userId, ['hatAdmin'])) {
    return HatParticipants.find(filter, { sort });
  }

  return HatParticipants.find(filter, {
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
Meteor.publish('hatParticipant', async function (accessKey) {
  check(accessKey, String);
  return HatParticipants.find({ accessKey });
});

WebApp.connectHandlers.use('/_hatInfoExport', async function (req, res, next) {
  const { query } = Npm.require('url').parse(req.url, true);
  const user = await Meteor.users.findOneAsync({ 'profile.downloadToken': query.downloadToken });
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
  sheet.columns = _.without(HatInfo.schema._schemaKeys, 'accessKey').map((column) => ({
    header: HatInfo.schema.label(column),
    key: column,
    width: 20,
  }));
  await HatParticipants.find({
    hatId: settings().hatId || undefined,
  }).forEachAsync((entry) =>
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
    `attachment; filename="${settings().hatId}-Participants-${moment().format('YYYY-MM-DD_HH-mm')}.xlsx"`
  );
  res.writeHead(200);
  workbook.xlsx.write(res).then(() => {
    res.end();
  });
});
