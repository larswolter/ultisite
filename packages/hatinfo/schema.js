import { SimpleSchema } from 'meteor/ultisite:autoform';
import { Tracker } from 'meteor/tracker';
import { Mongo } from 'meteor/mongo';

export const HatParticipants = new Mongo.Collection('HatParticipants');
export const HatInfo = {
  HatParticipants,
  schema: new SimpleSchema(
    {
      name: {
        type: String,
        label: 'Name',
        optional: false,
        max: 30,
      },
      accessKey: {
        type: String,
        label: 'accessKey',
        optional: true,
        autoform: {
          type: 'hidden',
        },
      },
      email: {
        type: String,
        label: 'E-Mail',
        regEx: SimpleSchema.RegEx.Email,
        optional: false,
      },
      city: {
        type: String,
        label: 'Stadt',
        optional: true,
      },
      age: {
        type: Number,
        label: 'Alter',
        optional: true,
      },
      fullAge: {
        type: Boolean,
        label: 'Volljährig',
      },
      gender: {
        type: String,
        label: 'Geschlecht',
        autoform: {
          firstOption: 'Geschlecht wählen',
          options() {
            return [
              { label: 'divers', value: 'divers' },
              { label: 'männlich', value: 'männlich' },
              { label: 'weiblich', value: 'weiblich' },
            ];
          },
        },
      },
      hometeam: {
        type: String,
        label: 'Heimatteam',
        optional: true,
        autoform: {
          inputAttribs: {
            list: 'hometeams',
          },
        },
      },
      experience: {
        type: String,
        label: 'Experience / Spielerfahrung',
        optional: false,
        autoform: {
          firstOption: 'Bitte wählen',
          options() {
            return [
              { label: 'Heureka, mein erstes Turnier.', value: '1' },
              { label: '1 bis 3 Turniere habe ich schon gespielt', value: '2' },
              { label: '4 bis 10 Turniere Erfahrung habe ich in meinen Knochen', value: '3' },
              { label: 'Ich spiele schon länger, ab und an Turniere. Mehr als 10 Turniere sicherlich…!', value: '4' },
              {
                label: 'Ich spiele regelmäßig Turniere, seit Jahren. Ich habe bei 20 aufgehört zu zählen.',
                value: '5',
              },
            ];
          },
        },
      },
      years: {
        type: String,
        label: 'Spieljahre',
        optional: false,
        autoform: {
          firstOption: 'Bitte wählen',
          options() {
            return [
              { label: '< 1 Jahr', value: '1' },
              { label: '1-2 Jahre', value: '2' },
              { label: '2-5 Jahre', value: '3' },
              { label: '5-10 Jahre', value: '4' },
              { label: '>10 Jahre', value: '5' },
            ];
          },
        },
      },
      strength: {
        type: String,
        label: 'Spielstärke',
        optional: false,
        autoform: {
          firstOption: 'Bitte wählen',
          options() {
            return [
              { label: 'Ich bin neu dabei.', value: '1' },
              {
                label:
                  'Die wichtigsten Tricks (Zone, Würfe, Vertical u. Horizontal Stack sind kein Neuland).',
                value: '2',
              },
              {
                label: 'Ich spiele schon recht sicher und kann mich im Team einbringen.',
                value: '3',
              },
              {
                label: 'Ich übernehme Verantwortung im Spiel und auch ein paar Ansagen im Team.',
                value: '4',
              },
              {
                label: 'In der 1. Liga und/oder auf internationalem Niveau fühle ich mich zu Hause.',
                value: '5',
              },
            ];
          },
        },
      },
      fitness: {
        type: String,
        label: 'Fitness',
        optional: false,
        autoform: {
          firstOption: 'Bitte wählen',
          options() {
            return [
              { label: 'Ich mag Bewegung, aber bei Hitze bleibe ich lieber im Schatten.', value: '1' },
              { label: 'Ich halte bei normalem Training gut mit.', value: '2' },
              { label: 'Ich bin fit und entwische dem Bademeister regelmäßig.', value: '3' },
              { label: 'Forderndes Training in der strahlenden Sonne sind voll mein Ding.', value: '4' },
              { label: 'Ich bin topfit und bereit für jede Hitzeschlacht.', value: '5' },
            ];
          },
        },
      },
      decisionDate: {
        type: Date,
        label:
          'Falls du auf der Warteliste landest: bis zu welchem Datum möchtest du dich bereithalten noch nachzurücken? Je spontaner, desto höher die Wahrscheinlichkeit dabei zu sein! Wenn beim Nachrücken dieses Datum schon vorrüber ist, würden wir dich u.U. aus der Spiellerliste entfernen (PF gibts dann zurück).',
        autoform: {
          format: 'DD.MM.YYYY',
        },
      },
      mobilePhone: {
        type: String,
        label:
          'Falls du beim Nachrücken auch noch sehr spontan bist, kannst du uns hier deine Handynummer hinterlassen, damit wir dich im Zweifel schnell erreichen können. ',
        optional: true,
      },
      sleepFriday: {
        type: Boolean,
        label: 'Übernachtung Freitag',
        defaultValue: false,
      },
      sleepSaturday: {
        type: Boolean,
        label: 'Übernachtung Samstag',
        defaultValue: false,
      },
      breakfastSaturday: {
        type: Boolean,
        label: 'Frühstück Samstag',
        defaultValue: false,
      },
      breakfastSunday: {
        type: Boolean,
        label: 'Frühstück Sonntag',
        defaultValue: false,
      },
      allowPublic: {
        type: Boolean,
        label: 'Mein Name, Stadt und Heimatteam sollen allen gezeigt werden',
        optional: true,
      },
      createdAt: {
        type: Date,
        label: 'Eingetragen',
        optional: true,
      },
      modifiedAt: {
        type: Date,
        label: 'Geändert',
        optional: true,
      },
      confirmed: {
        type: Boolean,
        label: 'Die E-Mail wurde bestätigt',
        optional: true,
      },
      payed: {
        type: Date,
        label: 'Bezahlt',
        optional: true,
      },
      nachrueckSent: {
        type: Boolean,
        label: 'Nachrück-Anfrage gesendet',
        optional: true,
      },
      nachrueckConfirmed: {
        type: Boolean,
        label: 'Nachrücken bestätigt',
        optional: true,
      },
    },
    { tracker: Tracker }
  ),
};
Meteor.startup(function () {
  UltiSite.HatInfo = HatInfo;
});
