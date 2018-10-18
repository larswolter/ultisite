import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { Roles } from 'meteor/alanning:roles';

Meteor.startup(function () {
  if (!_.find(Roles.getAllRoles().fetch(), r => r.name === 'hatAdmin')) {
    Roles.createRole('hatAdmin');
  }
  UltiSite.HatInfo.HatParticipants.find({ payed: { $exists: false } }).forEach((elem) => {
    UltiSite.HatInfo.HatParticipants.update(elem._id, { $set: { payed: moment(elem.createdAt).clone().add(10, 'years').toDate() } });
  });
});
Meteor.methods({
  hatConfirmParticipant(accessKey) {
    check(accessKey, String);
    UltiSite.HatInfo.HatParticipants.update({ accessKey }, { $set: { confirmed: true } });
  },
  hatParticipate(p) {
    const participant = _.clone(p);
    participant.createdAt = new Date();
    participant.modifiedAt = new Date();
    participant.payed = moment().add(10, 'years').toDate();
    participant.accessKey = Random.id(34);
    participant.hatId = UltiSite.settings().hatId;
    if (UltiSite.HatInfo.HatParticipants.findOne({
      email: participant.email,
      hatId: participant.hatId,
    })) {
      throw new Meteor.Error('Teilnehmer mit dieser E-Mail exisitiert schon!');
    }
    UltiSite.HatInfo.HatParticipants.insert(participant);
    const template = Assets.getText('private/confirm.html');
    UltiSite.Mail.send([participant.email], `Anmeldung beim ${UltiSite.settings().hatName} bestätigen`,
      UltiSite.renderMailTemplate(template, null, {
        participant,
        team: UltiSite.settings().teamname,
        url: Meteor.absoluteUrl(`hat_confirm/${participant.accessKey}`),
      }));
    return 'inserted';
  },
  hatResendMail(accessKey) {
    check(accessKey, String);
    if (!Roles.userIsInRole(this.userId, ['admin', 'hatAdmin'])) {
      throw new Meteor.Error('access-denied', 'Änderung nicht erlaubt');
    }
    const participant = UltiSite.HatInfo.HatParticipants.findOne({ accessKey });
    const template = Assets.getText('private/confirm.html');
    UltiSite.Mail.send([participant.email], `Anmeldung beim ${UltiSite.settings().hatName} bestätigen`,
      UltiSite.renderMailTemplate(template, null, {
        participant,
        team: UltiSite.settings().teamname,
        url: Meteor.absoluteUrl(`hat_confirm/${participant.accessKey}`),
      }));
  },
  hatParticipationPayed(accessKey) {
    check(accessKey, String);
    const part = UltiSite.HatInfo.HatParticipants.findOne({ accessKey });
    if (!part) {
      throw new Meteor.Error('access-denied', 'Zahlung nicht erlaubt');
    }
    if (!Roles.userIsInRole(this.userId, ['admin', 'hatAdmin'])) {
      throw new Meteor.Error('access-denied', 'Zahlung nicht erlaubt');
    }

    UltiSite.HatInfo.HatParticipants.update(part._id, { $set: { payed: new Date() } });
    return 'payed';
  },
  hatUpdateParticipation(participant) {
    const part = UltiSite.HatInfo.HatParticipants.findOne({ accessKey: participant.accessKey });
    if (!part) {
      throw new Meteor.Error('access-denied', 'Änderung nicht erlaubt');
    }
    participant.modifiedAt = new Date();

    if (Roles.userIsInRole(this.userId, ['admin', 'hatAdmin'])) {
      UltiSite.HatInfo.HatParticipants.update(part._id, { $set: participant });
    } else {
      UltiSite.HatInfo.HatParticipants.update(part._id, {
        $set: _.pick(participant, 'name', 'city', 'hometeam', 'strength', 'modifiedAt'),
      });
    }
    return 'updated';
  },
  hatRemoveParticipation(accessKey) {
    const part = UltiSite.HatInfo.HatParticipants.findOne({ accessKey });
    if (!part) { throw new Meteor.Error('access-denied', 'Änderung nicht erlaubt'); }
    UltiSite.HatInfo.HatParticipants.remove(part._id);
    return 'removed';
  },
});

Meteor.publish('hatParticipants', function (limit, search) {
  const sort = {};
  if (UltiSite.settings().hatSort) { sort[UltiSite.settings().hatSort] = 1; }
  sort.createdAt = 1;
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
  if (Roles.userIsInRole(this.userId, ['admin', 'hatAdmin'])) {
    return UltiSite.HatInfo.HatParticipants.find(filter, { sort });
  }

  return UltiSite.HatInfo.HatParticipants.find(filter, {
    sort,
    fields: {
      name: 1,
      strength: 1,
      city: 1,
      hometeam: 1,
      createdAt: 1,
      confirmed: 1,
      payed: 1,
    },
  });
});
Meteor.publish('hatParticipant', function (accessKey) {
  return UltiSite.HatInfo.HatParticipants.find({ accessKey });
});

WebApp.connectHandlers.use('/_hatInfoExport', function (req, res, next) {
  const query = Npm.require('url').parse(req.url, true).query;
  const user = Meteor.users.findOne({ 'profile.downloadToken': query.downloadToken });
  if (!user) {
    res.writeHead(403);
    res.end();
    return;
  }

  let csv = `${_.without(UltiSite.HatInfo.schema._schemaKeys, 'accessKey').join(';')}\n\r`;
  csv += UltiSite.HatInfo.HatParticipants.find({
    hatId: UltiSite.settings().hatId || undefined,
  }).map(p => _.without(UltiSite.HatInfo.schema._schemaKeys, 'accessKey').map(key => `"${String(p[key]).replace(/"/g, '\'')}"`).join(';')).join('\n\r');
  res.writeHead(200, { 'content-type': 'text/csv', 'content-disposition': `attachment; filename="participants-${UltiSite.settings().hatName}.csv"` });
  res.end(`${csv}\n\r`);
});
