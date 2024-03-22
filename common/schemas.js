import SimpleSchema from 'simpl-schema';
import { Tracker } from 'meteor/tracker';

Meteor.startup(function () {
  if (Meteor.isClient) {
    setSchemas();
  }

  try {
    if (Meteor.isServer) {
      setSchemas();
    }
  } catch (e) {}
});

function validateSettingsList() {
  const key = this.genericKey.split('.');
  const settingsKey = `${`array ${key[key.length - 1]}`.toCamelCase()}s`;

  if (_.contains(UltiSite.settings()[settingsKey], this.value)) {
    return undefined;
  }
  return 'notAllowed';
}

UltiSite.schemas.emailServerSchema.set(
  new SimpleSchema(
    {
      from: {
        label: 'Absenderadresse',
        type: String,
        regEx: SimpleSchema.RegEx.Email,
        optional: false,
      },
      user: {
        label: 'Login',
        type: String,
        optional: false,
      },
      password: {
        label: 'Passwort',
        type: String,
        optional: false,
      },
      port: {
        label: 'Port',
        type: Number,
        optional: false,
      },
      host: {
        label: 'HostUrl',
        type: String,
        regEx: SimpleSchema.RegEx.Domain,
        optional: false,
      },
    },
    { tracker: Tracker }
  )
);

const addressSchema = new SimpleSchema(
  {
    city: {
      label: 'Stadt',
      type: String,
      optional: false,
    },
    country: {
      label: 'Land',
      type: String,
      max: 2,
      optional: false,
      defaultValue: 'DE',
    },
    postcode: {
      label: 'PLZ',
      type: String,
      max: 5,
      regEx: SimpleSchema.RegEx.ZipCode,
      optional: true,
    },
    street: {
      label: 'Straße',
      type: String,
      optional: true,
    },
    geocoords: {
      label: 'Koordinaten',
      type: String,
      optional: true,
    },
  },
  { tracker: Tracker }
);

const setSchemas = function () {
  UltiSite.schemas.links.set(
    new SimpleSchema(
      {
        links: {
          type: Array,
          label: 'Links',
          optional: false,
          maxCount: 6,
        },
        'links.$': Object,
        'links.$.text': {
          type: String,
          label: 'Link Text',
          optional: false,
          max: 15,
        },
        'links.$.target': {
          type: String,
          label: 'Ziel URL',
          optional: false,
          max: 50,
        },
        'links.$.loggedIn': {
          type: Boolean,
          label: 'Wenn angemeldet',
          defaultValue: true,
        },
        'links.$.loggedOut': {
          type: Boolean,
          label: 'Wenn nicht angemeldet',
          defaultValue: true,
        },
        'links.$.submenu': {
          type: Array,
          label: 'Untermenu',
          defaultValue: [],
          maxCount: 6,
        },
        'links.$.submenu.$': Object,
        'links.$.submenu.$.text': {
          type: String,
          label: 'Link Text',
          optional: false,
          max: 15,
        },
        'links.$.submenu.$.target': {
          type: String,
          label: 'Ziel URL',
          optional: false,
          max: 25,
        },
      },
      { tracker: Tracker }
    )
  );
  UltiSite.schemas.user.set(
    new SimpleSchema(
      {
        email: {
          type: String,
          label: 'E-Mail',
          regEx: SimpleSchema.RegEx.Email,
          optional: false,
          max: 200,
        },
        name: {
          type: String,
          label: 'Vorname',
          max: 200,
        },
        surname: {
          type: String,
          label: 'Nachname',
          optional: true,
          max: 200,
        },
        alias: {
          type: String,
          label: 'Nutzername',
          optional: false,
          max: 200,
        },
        sex: {
          type: String,
          label: 'Geschlecht',
          optional: false,
          allowedValues: ['W', 'M'],
        },
        club: {
          type: String,
          label: 'Verein',
          allowedValues: ['kein Mitglied', 'Mitglied', 'Vorstand'],
          defaultValue: 'kein Mitglied',
        },
      },
      { tracker: Tracker }
    )
  );
  UltiSite.schemas.userRegister.set(
    new SimpleSchema(
      {
        sitePassword: {
          type: String,
          label: 'Registrierungspasswort',
          optional: false,
        },
      },
      { tracker: Tracker }
    )
  );
  UltiSite.schemas.userRegister.get().extend(UltiSite.schemas.user.get());
  UltiSite.schemas.team.set(
    new SimpleSchema(
      {
        name: {
          type: String,
          label: 'Teamname',
          max: 200,
        },
        teamType: {
          type: String,
          label: 'Vereinsteam',
          defaultValue: 'Verein - Auslosung',
          allowedValues: ['Verein - Auslosung', 'Verein - Offiziell', 'Verein - International', 'Extern / Projekt'],
        },
        maxPlayers: {
          type: Number,
          label: 'Maximale Anzahl Spieler',
          defaultValue: 12,
        },
        minFemale: {
          type: Number,
          label: 'Minimale Anzahl Frauen',
          defaultValue: 0,
        },
        state: {
          type: String,
          label: 'Stand',
          allowedValues: ['dabei', 'auf Warteliste', 'angemeldet', 'geplant', 'abgesagt'],
          defaultValue: 'geplant',
        },
        division: {
          type: String,
          label: 'Division',
          custom: validateSettingsList,
          defaultValue: 'Open',
        },
        responsible: {
          type: String,
          label: 'Zuständig',
          optional: true,
        },
        placement: {
          type: Number,
          label: 'Platzierung',
          optional: true,
        },
        teamfoto: {
          type: String,
          label: 'Teamfoto',
          optional: true,
        },
        remarks: {
          type: String,
          label: 'Anmerkungen',
          optional: true,
        },
      },
      { tracker: Tracker }
    )
  );
  UltiSite.schemas.tournament.set(
    new SimpleSchema(
      {
        name: {
          type: String,
          label: 'Name',
          max: 200,
          optional: false,
        },
        date: {
          type: Date,
          label: 'Datum',
          optional: false,
        },
        surfaces: {
          type: Array,
          minCount: 1,
          label: 'Untergründe',
          optional: true,
        },
        'surfaces.$': String,
        divisions: {
          type: Array,
          minCount: 1,
          label: 'Divisionen',
        },
        'divisions.$': String,
        numDays: {
          type: Number,
          label: 'Anzahl Tage',
          defaultValue: 2,
          min: 1,
          max: 14,
        },
        category: {
          type: String,
          label: 'Kategorie',
          optional: false,
          defaultValue: 'Turnier',
          custom: validateSettingsList,
        },
        address: {
          label: 'Adresse',
          type: addressSchema,
          defaultValue: { country: 'DE' },
        },
        tournamentDirector: {
          type: String,
          label: 'Kontaktperson',
          optional: true,
        },
        website: {
          type: String,
          regEx: SimpleSchema.RegEx.Url,
          label: 'Webseite',
          optional: true,
        },
      },
      { tracker: Tracker }
    )
  );
  UltiSite.schemas.practice.set(
    new SimpleSchema(
      {
        hostingTeam: {
          type: String,
          label: 'Team',
          defaultValue: UltiSite.settings().teamname,
          optional: false,
        },
        weekday: {
          type: Number,
          label: 'Wochentag',
        },
        trainer: {
          type: String,
          label: 'Trainer',
          optional: true,
        },
        contact: {
          type: String,
          label: 'Kontaktmail',
          optional: true,
        },
        contactPhone: {
          type: String,
          label: 'Kontaktnummer',
          optional: true,
        },
        website: {
          type: String,
          label: 'Webseite',
          optional: true,
        },
        description: {
          type: String,
          label: 'Beschreibung',
          optional: true,
        },
        skillLevel: {
          type: String,
          optional: true,
          label: 'Zielgruppe',
        },
        address: {
          label: 'Adresse',
          type: addressSchema,
        },
        startTime: {
          label: 'Beginn',
          type: String,
          min: 3,
          max: 5,
          defaultValue: '18:00',
          custom() {
            if (this.isSet) {
              return !!this.value.match(/[0-2][0-9]:[0-5][0-9]/);
            }
          },
        },
        start: {
          label: 'Erster Termin',
          type: Date,
          optional: true,
          defaultValue: new Date(),
        },
        end: {
          label: 'Letzter Termin',
          type: Date,
          optional: true,
          defaultValue: moment().add(6, 'month').toDate(),
        },
        duration: {
          type: Number,
          label: 'Dauer',
          defaultValue: 120,
          optional: false,
        },
      },
      { tracker: Tracker }
    )
  );
};
SimpleSchema.setDefaultMessages({
  messages: {
    en: {
      minString: '{{label}} muss mindestens {{min}} Zeichen haben',
      maxString: '{{label}} darf maximal {{max}} Zeichen haben',
      minNumber: '{{label}} must be at least {{min}}',
      maxNumber: '{{label}} cannot exceed {{max}}',
      minDate: '{{label}} must be on or after {{min}}',
      maxDate: '{{label}} cannot be after {{max}}',
      badDate: '{{label}} is not a valid date',
      minCount: 'You must specify at least {{minCount}} values',
      maxCount: 'You cannot specify more than {{maxCount}} values',
      noDecimal: '{{label}} must be an integer',
      notAllowed: '{{value]] is not an allowed value',
      expectedString: '{{label}} muss Text sein',
      expectedNumber: '{{label}} muss eine Zahl sein',
      expectedBoolean: '{{label}} must be a boolean',
      expectedArray: '{{label}} must be an array',
      expectedObject: '{{label}} must be an object',
      expectedConstructor: '{{label}} must be a {{type}}',
      regEx: [
        { msg: '{{label}} failed regular expression validation' },
        { exp: SimpleSchema.RegEx.Email, msg: '{{label}} muss eine gültige E-Mail sein' },
        { exp: SimpleSchema.RegEx.WeakEmail, msg: '{{label}} muss eine gültige E-Mail sein' },
        { exp: SimpleSchema.RegEx.Domain, msg: '{{label}} must be a valid domain' },
        { exp: SimpleSchema.RegEx.WeakDomain, msg: '{{label}} must be a valid domain' },
        { exp: SimpleSchema.RegEx.IP, msg: '{{label}} must be a valid IPv4 or IPv6 address' },
        { exp: SimpleSchema.RegEx.IPv4, msg: '{{label}} must be a valid IPv4 address' },
        { exp: SimpleSchema.RegEx.IPv6, msg: '{{label}} must be a valid IPv6 address' },
        { exp: SimpleSchema.RegEx.Url, msg: '{{label}} must be a valid URL' },
        { exp: SimpleSchema.RegEx.Id, msg: '{{label}} must be a valid alphanumeric ID' },
      ],
      keyNotInSchema: '{{key}} is not allowed by the schema',
      required: '{{label}} ist ein Pflichtfeld',
      'wrong-password': 'Falsches Passwort',
      'invalid-username': 'Ungültiger Nutzername',
      'duplicate-email': 'E-Mail bereits vorhanden',
      'duplicate-username': 'Nutzername bereits vorhanden',
    },
  },
});
