import { SimpleSchema } from 'meteor/aldeed:simple-schema';

Meteor.startup(function () {
    if (Meteor.isClient)
        setSchemas();

    try {
        if (Meteor.isServer)
            setSchemas();
    } catch (e) {

    }

});

function validateSettingsList() {
    var key = this.genericKey.split('.');
    var settingsKey = ("array " + key[key.length - 1]).toCamelCase() + "s";

    if (_.contains(UltiSite.settings()[settingsKey], this.value))
        return undefined;
    return "notAllowed";
}

UltiSite.schemas.emailServerSchema.set(new SimpleSchema({
    from: {
        label: 'Absenderadresse',
        type: String,
        regEx: SimpleSchema.RegEx.Email,
        optional: false
    },
    user: {
        label: 'Login',
        type: String,
        optional: false
    },
    password: {
        label: 'Passwort',
        type: String,
        optional: false
    },
    port: {
        label: 'Port',
        type: Number,
        optional: false,
        autoform: {
            placeholder: '993'
        }
    },
    host: {
        label: 'HostUrl',
        type: String,
        regEx: SimpleSchema.RegEx.Domain,
        optional: false,
        autoform: {
            placeholder: 'mail.server.de'
        }
    }
}));

var addressSchema = new SimpleSchema({
    city: {
        label: "Stadt",
        type: String,
        optional: false
    },
    country: {
        label: "Land",
        type: String,
        max: 2,
        optional: false,
        defaultValue: "DE"
    },
    postcode: {
        label: "PLZ",
        type: String,
        max: 5,
        regEx: SimpleSchema.RegEx.ZipCode,
        optional: true
    },
    street: {
        label: "Straße",
        type: String,
        optional: true
    },
    geocoords: {
        label: "Koordinaten",
        type: String,
        optional: true
    }
});

var setSchemas = function () {
    UltiSite.schemas.links.set(new SimpleSchema({
        "links": {
            type: [Object],
            label: "Links",
            optional: false,
            maxCount: 6
        },
        "links.$.text": {
            type: String,
            label: "Link Text",
            optional: false,
            max: 15
        },
        "links.$.target": {
            type: String,
            label: "Ziel URL",
            optional: false,
            max: 50
        },
        "links.$.loggedIn": {
            type: Boolean,
            label: "Wenn angemeldet",
            defaultValue: true,
        },
        "links.$.loggedOut": {
            type: Boolean,
            label: "Wenn nicht angemeldet",
            defaultValue: true,
        },
        "links.$.submenu": {
            type: [Object],
            label: "Untermenu",
            defaultValue: [],
            maxCount: 6,
            autoform: {
                initialCount: 0
            }
        },
        "links.$.submenu.$.text": {
            type: String,
            label: "Link Text",
            optional: false,
            max: 15
        },
        "links.$.submenu.$.target": {
            type: String,
            label: "Ziel URL",
            optional: false,
            max: 25
        },
    }));
    UltiSite.schemas.user.set(new SimpleSchema({
        "email": {
            type: String,
            label: "E-Mail",
            regEx: SimpleSchema.RegEx.Email,
            optional: false,
            max: 200
        },
        "name": {
            type: String,
            label: "Vorname",
            max: 200
        },
        "surname": {
            type: String,
            label: "Nachname",
            optional: true,
            max: 200
        },
        "alias": {
            type: String,
            label: "Nutzername",
            optional: false,
            max: 200
        },
        "sex": {
            type: String,
            label: "Geschlecht",
            optional: false,
            allowedValues: ["W", "M"],
            autoform: {
                noselect: true,
                options: [
                    { value: 'M', label: 'Männlich' },
                    { value: 'W', label: 'Weiblich' }
                ]
            }
        },
        "club": {
            type: String,
            label: "Verein",
            allowedValues: ["kein Mitglied", "Mitglied", "Vorstand"],
            defaultValue: "kein Mitglied",
            autoform: {
                options: "allowed"
            }
        },
    }));
    UltiSite.schemas.userRegister.set(new SimpleSchema([UltiSite.schemas.user.get(), {
        "sitePassword": {
            type: String,
            label: "Registrierungspasswort",
            optional: false,
            autoform: {

            }
        },
    }]));
    UltiSite.schemas.team.set(new SimpleSchema({
        name: {
            type: String,
            label: "Teamname",
            max: 200
        },
        teamType: {
            type: String,
            label: "Vereinsteam",
            defaultValue: 'Verein - Auslosung',
            allowedValues: ['Verein - Auslosung', 'Verein - Offiziell', 'Verein - International', 'Extern / Projekt'],
            autoform: {
                options: "allowed"
            }
        },
        maxPlayers: {
            type: Number,
            label: "Maximale Anzahl Spieler",
            defaultValue: 12
        },
        minFemale: {
            type: Number,
            label: "Minimale Anzahl Frauen",
            defaultValue: 0
        },
        state: {
            type: String,
            label: "Stand",
            allowedValues: ["dabei", "auf Warteliste", "angemeldet", "geplant", "abgesagt"],
            defaultValue: "geplant",
            autoform: {
                options: "allowed"
            }
        },
        division: {
            type: String,
            label: "Division",
            custom: validateSettingsList,
            defaultValue: "Open",
            autoform: {
                options: function () {
                    return UltiSite.settings().arrayDivisions.map(function (element) {
                        return { label: element, value: element };
                    });
                }
            }
        },
        responsible: {
            type: String,
            label: "Zuständig",
            optional: true
        },
        placement: {
            type: Number,
            label: "Platzierung",
            optional: true
        },
        teamfoto: {
            type: String,
            label: "Teamfoto",
            optional: true
        },
        remarks: {
            type: String,
            label: "Anmerkungen",
            optional: true,
            autoform: {
                rows: 3
            }
        }
    }));
    UltiSite.schemas.tournament.set(new SimpleSchema({
        name: {
            type: String,
            label: "Name",
            max: 200,
            optional: false
        },
        date: {
            type: Date,
            label: "Datum",
            autoform: {
                format: 'DD.MM.YYYY',
                type: "bootstrap-datepicker",
                //                buttonClasses: "fa fa-calendar",
                datePickerOptions: {
                    language: "de-DE",
                    format: "dd.mm.yyyy"
                }
            },
            optional: false
        },
        surfaces: {
            type: [String],
            minCount: 1,
            label: 'Untergründe',
            autoform: {
                multi: true,
                options: function () {
                    return UltiSite.settings().arraySurfaces.map(function (element) {
                        return { label: element, value: element };
                    });
                }
            },
            optional: true
        },
        divisions: {
            type: [String],
            minCount: 1,
            label: 'Divisionen',
            autoform: {
                multi: true,
                options: function () {
                    return UltiSite.settings().arrayDivisions.map(function (element) {
                        return { label: element, value: element };
                    });
                }
            }
        },
        numDays: {
            type: Number,
            label: "Anzahl Tage",
            defaultValue: 2,
            min: 1,
            max: 14
        },
        category: {
            type: String,
            label: "Kategorie",
            optional: false,
            defaultValue: "Turnier",
            custom: validateSettingsList,
            autoform: {
                options: function () {
                    return UltiSite.settings().arrayCategorys.map(function (element) {
                        return { label: element, value: element };
                    });
                }
            }
        },
        address: {
            label: "Adresse",
            type: addressSchema
        },
        tournamentDirector: {
            type: String,
            label: "Kontaktperson",
            optional: true
        },
        website: {
            type: String,
            regEx: SimpleSchema.RegEx.Url,
            label: "Webseite",
            optional: true
        }
    }));
    UltiSite.schemas.practice.set(new SimpleSchema({
        hostingTeam: {
            type: String,
            label: "Team",
            defaultValue: UltiSite.settings().teamname,
            optional: false
        },
        weekday: {
            type: Number,
            label: "Wochentag",
            autoform: {
                options: [
                    { label: 'Montags', value: 1 },
                    { label: 'Dienstags', value: 2 },
                    { label: 'Mittwochs', value: 3 },
                    { label: 'Donnerstags', value: 4 },
                    { label: 'Freitags', value: 5 },
                    { label: 'Samstags', value: 6 },
                    { label: 'Sonntags', value: 0 },
                ]
            }
        },
        trainer: {
            type: String,
            label: "Trainer",
            optional: true
        },
        contact: {
            type: String,
            label: "Kontaktmail",
            optional: true
        },
        contactPhone: {
            type: String,
            label: "Kontaktnummer",
            optional: true
        },
        website: {
            type: String,
            label: "Webseite",
            optional: true
        },
        description: {
            type: String,
            label: "Beschreibung",
            optional: true
        },
        skillLevel: {
            type: String,
            optional: true,
            label: "Zielgruppe"
        },
        address: {
            label: "Adresse",
            type: addressSchema
        },
        startTime: {
            label: "Beginn",
            type: String,
            min: 3,
            max: 5,
            defaultValue: '18:00',
            custom() {
                if (this.isSet)
                    return !!this.value.match(/[0-2][0-9]:[0-5][0-9]/);
            }
        },
        start: {
            label: "Erster Termin",
            type: Date,
            optional: true,
            defaultValue: new Date(),
            autoform: {
                format: 'DD.MM.YYYY',
                type: "bootstrap-datepicker",
                datePickerOptions: {
                    language: "de-DE",
                    format: "dd.mm.yyyy"
                }
            },
        },
        end: {
            label: "Letzter Termin",
            type: Date,
            optional: true,
            defaultValue: moment().add(6, 'month').toDate(),
            autoform: {
                format: 'DD.MM.YYYY',
                type: "bootstrap-datepicker",
                datePickerOptions: {
                    language: "de-DE",
                    format: "dd.mm.yyyy"
                }
            },
        },
        duration: {
            type: Number,
            label: "Dauer",
            defaultValue: 120,
            optional: false,
        }
    }));
};
SimpleSchema.messages({
    minString: "[label] muss mindestens [min] Zeichen haben",
    maxString: "[label] darf maximal [max] Zeichen haben",
    minNumber: "[label] must be at least [min]",
    maxNumber: "[label] cannot exceed [max]",
    minDate: "[label] must be on or after [min]",
    maxDate: "[label] cannot be after [max]",
    badDate: "[label] is not a valid date",
    minCount: "You must specify at least [minCount] values",
    maxCount: "You cannot specify more than [maxCount] values",
    noDecimal: "[label] must be an integer",
    notAllowed: "[value] is not an allowed value",
    expectedString: "[label] muss Text sein",
    expectedNumber: "[label] muss eine Zahl sein",
    expectedBoolean: "[label] must be a boolean",
    expectedArray: "[label] must be an array",
    expectedObject: "[label] must be an object",
    expectedConstructor: "[label] must be a [type]",
    regEx: [
        {msg: "[label] failed regular expression validation"},
        {exp: SimpleSchema.RegEx.Email, msg: "[label] muss eine gültige E-Mail sein"},
        {exp: SimpleSchema.RegEx.WeakEmail, msg: "[label] muss eine gültige E-Mail sein"},
        {exp: SimpleSchema.RegEx.Domain, msg: "[label] must be a valid domain"},
        {exp: SimpleSchema.RegEx.WeakDomain, msg: "[label] must be a valid domain"},
        {exp: SimpleSchema.RegEx.IP, msg: "[label] must be a valid IPv4 or IPv6 address"},
        {exp: SimpleSchema.RegEx.IPv4, msg: "[label] must be a valid IPv4 address"},
        {exp: SimpleSchema.RegEx.IPv6, msg: "[label] must be a valid IPv6 address"},
        {exp: SimpleSchema.RegEx.Url, msg: "[label] must be a valid URL"},
        {exp: SimpleSchema.RegEx.Id, msg: "[label] must be a valid alphanumeric ID"}
    ],
    keyNotInSchema: "[key] is not allowed by the schema",
    'required': "[label] ist ein Pflichtfeld",
    'wrong-password': "Falsches Passwort",
    "invalid-username": "Ungültiger Nutzername",
    "duplicate-email": "E-Mail bereits vorhanden",
    "duplicate-username": "Nutzername bereits vorhanden"
});
