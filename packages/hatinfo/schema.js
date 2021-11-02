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
                { label: 'Erstes Turnier', value: '1' },
                { label: 'Zweites Turnier', value: '2' },
                { label: 'Drittes Turnier', value: '3' },
                { label: 'Ab und zu ein Turnier', value: '4' },
                { label: '5+ Turniere im Jahr', value: '5' },
                { label: '10+ Turnier im Jahr', value: '6' },
                { label: 'Ligaspieler(in)', value: '7' },
                { label: '1. Liga', value: '8' },
                { label: 'Nationalspieler(in)', value: '9' },
              ];
            },
          },
        },
        years: {
          type: Number,
          label: 'Spieljahre',
          optional: false,
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
