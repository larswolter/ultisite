import { SimpleSchema } from 'meteor/ultisite:autoform';
import { Tracker } from 'meteor/tracker';

const HatParticipants = new Meteor.Collection('HatParticipants');

Meteor.startup(function () {
  UltiSite.HatInfo = {
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
        gender: {
          type: String,
          label: 'Geschlecht',
          optional: true,
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
        },
        strength: {
          type: String,
          label: 'Spielstärke',
          optional: false,
          autoform: {
            firstOption: 'Spielstärke wählen',
            options() {
              return [
                { label: 'Heureka, mein erstes Turnier.', value: '1' },
                { label: '1 bis 3 Turniere habe ich schon gespielt', value: '2' },
                { label: '4 bis 10 Turniere Erfahrung habe ich in meinen Knochen', value: '3' },
                { label: 'Ich spiele schon länger, ab und an Turniere. Mehr als 10 Turniere sicherlich…!', value: '4' },
                { label: 'Ich spiele regelmäßig Turniere, seit Jahren. Ich habe bei 20 aufgehört zu zählen.', value: '5' },
              ];
            },
          },
        },
        years: {
          type: Number,
          label: 'Spieljahre',
          optional: false,
        },
        experience: {
          type: String,
          label: 'Wie erfahren bist Du im Schabernack und dem Spiel mit der Scheibe?',
          optional: false,
          autoform: {
            firstOption: 'Bitte wählen',
            options() {
              return [
                { label: 'Junger Kürbis - ich bin neu dabei.', value: '1' },
                { label: 'Trickreich wie Lock, Shock and Barrel - die wichtigsten Tricks und Basics habe ich drauf.', value: '2' },
                { label: 'Rag`n Roll passt gut zu mir - ich spiele schon recht sicher und kann andere im Training unterstützen.', value: '3' },
                {
                  label: 'Jack Skellington macht mir nichts vor - ich übernehme viel Verantwortung im Team, kann Training und Coaching übernehmen.',
                  value: '4',
                },
                { label: 'Ausgebufft wie Oogie Boogie - In der 1. Liga und/oder auf internationalem Niveau, da fühle ich mich zu Hause.', value: '5' },
              ];
            },
          },
        },
        fitness: {
          type: String,
          label: 'Wie laut kannst Du schreien, wie schnell kannst Du laufen - Wie ist es mit Deiner Fitness?',
          optional: false,
          autoform: {
            firstOption: 'Bitte wählen',
            options() {
              return [
                { label: 'Laufen und viel bewegen? Och, ich bin lieber gemütlich unterwegs.', value: '1' },
                { label: 'Laufen beim Training ist schon drin für mich.', value: '2' },
                { label: 'Extra Einheiten an Geschenke klauen und Fitnessschabernack zusätzlich zum Training, sind voll mein Ding.', value: '3' },
                { label: 'Vor, nach und zwischen den Trainings, sind Sport-, Lauf und Krafteinheiten selbstverständlich für mich.', value: '4' },
              ];
            },
          },
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
        tested: {
          type: Boolean,
          label: 'Nur getestet, nicht geimpft/genesen',
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
      },
      { tracker: Tracker }
    ),
  };
});
