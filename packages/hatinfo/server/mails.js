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
  HatInfo.HatParticipants.find(query).forEach((participant) => {
    console.log(`sending reminder to ${participant.email}`);
    Mail.send(
      [participant.email],
      `Erinnerung - Anmeldung beim ${settings().hatName}`,
      renderMailTemplate(template, null, {
        additionalInfos: settings().hatConfirmInfos,
        participant,
        confirmed: participant.confirmed,
        payed: moment(participant.payed).isBefore(new Date()),
        hatName: settings().hatName,
        team: settings().teamname,
        url: Meteor.absoluteUrl(`hat_confirm/${participant.accessKey}`),
      })
    );
  });
};

export const sendHatPlaylistEmails = () => {};
