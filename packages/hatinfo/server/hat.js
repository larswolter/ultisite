

Meteor.startup(function () {
  UltiSite.HatInfo.HatParticipants.find({ payed: { $exists: false } }).forEach((elem) => {
      UltiSite.HatInfo.HatParticipants.update(elem._id, { $set: { payed: moment(elem.createdAt).clone().add(10, 'years').toDate() } });
    });
});
Meteor.methods({
  hatConfirmParticipant(accessKey) {
      UltiSite.HatInfo.HatParticipants.update({ accessKey }, { $set: { confirmed: true } });
    },
  hatParticipate(participant) {
      participant.createdAt = new Date();
      participant.modifiedAt = new Date();
      participant.payed = moment().add(10, 'years').toDate();
      participant.accessKey = Random.id(34);
      if (UltiSite.HatInfo.HatParticipants.findOne({ email: participant.email }))
          throw new Meteor.Error('Teilnehmer mit dieser E-Mail exisitiert schon!');
      UltiSite.HatInfo.HatParticipants.insert(participant);
      UltiSite.Mail.send([participant.email], "Anmeldung beim " + UltiSite.settings().hatName + ' bestätigen',
            `Hallo ${participant.name}, \n\n bitte öffne den folgenden Link, um deine Anmeldung beim HitHat zu bestätigen.\n\n` +
            Meteor.absoluteUrl("hat_confirm/" + participant.accessKey) +
            "\n\nViele Grüße\n" + UltiSite.settings().teamname);
      return 'inserted';
    },
  hatParticipationPayed(accessKey) {
      let part = UltiSite.HatInfo.HatParticipants.findOne({ accessKey });
      if (!part)
          throw new Meteor.Error('access-denied', 'Zahlung nicht erlaubt');
      if (!Roles.userIsInRole(this.userId, ['admin', 'hatAdmin']))
          throw new Meteor.Error('access-denied', 'Zahlung nicht erlaubt');

      UltiSite.HatInfo.HatParticipants.update(part._id, { $set: { payed: new Date() } });
      return 'payed';
    },
  hatUpdateParticipation(participant) {
      let part = UltiSite.HatInfo.HatParticipants.findOne({ accessKey: participant.accessKey });
      if (!part)
          throw new Meteor.Error('access-denied', 'Änderung nicht erlaubt');
      participant.modifiedAt = new Date();

      UltiSite.HatInfo.HatParticipants.update(part._id, { $set: _.pick(participant, 'name', 'city', 'hometeam', 'strength', 'modifiedAt') });
      return 'updated';
    },
  hatRemoveParticipation(accessKey) {
      let part = UltiSite.HatInfo.HatParticipants.findOne({ accessKey });
      if (!part)
          throw new Meteor.Error('access-denied', 'Änderung nicht erlaubt');
      UltiSite.HatInfo.HatParticipants.remove(part._id);
      return 'removed';
    }
});

Meteor.publish('hatParticipants', function (limit,search) {
  const sort = {};
  if (UltiSite.settings().hatSort)
      sort[UltiSite.settings().hatSort] = 1;
  sort.createdAt = 1;
  const filter={};
    /*
    if(search && search.trim())
        filter.$or= [
            { name: new RegExp(search, 'i') },
            { email: new RegExp(search, 'i') }
        ];
    */
  if (Roles.userIsInRole(this.userId, ['admin', 'hatAdmin']))
      return UltiSite.HatInfo.HatParticipants.find(filter,{sort});

  return UltiSite.HatInfo.HatParticipants.find(filter, {
      sort,
      fields: {
          name: 1,
          strength: 1,
          city: 1,
          hometeam: 1,
          createdAt: 1,
          confirmed: 1,
          payed: 1
        }
    });
});
Meteor.publish('hatParticipant', function (accessKey) {
  return UltiSite.HatInfo.HatParticipants.find({ accessKey });
});

WebApp.connectHandlers.use("/_hatInfoExport", function (req, res, next) {
  let query = Npm.require('url').parse(req.url, true).query;
  let user = Meteor.users.findOne({ 'profile.downloadToken': query.downloadToken });
  if (!user) {
      res.writeHead(403);
      res.end();
      return;
    }

  let csv = _.without(UltiSite.HatInfo.schema._schemaKeys, 'accessKey').join(';') + '\n\r';
  csv += UltiSite.HatInfo.HatParticipants.find().map((p) => {
      return _.without(UltiSite.HatInfo.schema._schemaKeys, 'accessKey').map((key) => {
          return '"' + String(p[key]).replace(/"/g, '\'') + '"';
        }).join(';');
    }).join('\n\r');
  res.writeHead(200, { "content-type": "text/csv", "content-disposition": "attachment; filename=\"participants-" + UltiSite.settings().hatName + ".csv\"" });
  res.end(csv + '\n\r');
});
