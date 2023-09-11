import { moment } from 'meteor/momentjs:moment';

export const sendHatReminderEmails = () => {
  const template = Assets.getText('private/reminder.html');
  const query = {
    createdAt: {
      $gt: moment().subtract(1, 'week').startOf('day').toDate(),
      $lt: moment().subtract(1, 'week').endOf('day').toDate(),
    },
    $or: [{ confirmed: { $ne: true } }, { payed: { $gt: new Date() } }],
  };
  UltiSite.HatInfo.HatParticipants.find(query).forEach((participant) => {
    console.log(`sending reminder to ${participant.email}`);
    UltiSite.Mail.send(
      [participant.email],
      `Erinnerung - Anmeldung beim ${UltiSite.settings().hatName}`,
      UltiSite.renderMailTemplate(template, null, {
        additionalInfos: UltiSite.settings().hatConfirmInfos,
        participant,
        confirmed: participant.confirmed,
        payed: moment(participant.payed).isBefore(new Date()),
        hatName: UltiSite.settings().hatName,
        team: UltiSite.settings().teamname,
        url: Meteor.absoluteUrl(`hat_confirm/${participant.accessKey}`),
      })
    );
  });
};

export const sendHatPlaylistEmails = () => {};
