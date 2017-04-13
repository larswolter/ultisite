import { SimpleSchema } from 'meteor/aldeed:simple-schema';;

uoodleSchema = new SimpleSchema({
    "name": {
        type: String,
        label: "Name",
        optional: false,
        max: 60
    },
    validUntil: {
        type: Date,
        label: "Läuft bis",
        autoform: {
            format: "DD.MM.YYYY"
        }
    },
    "description": {
        type: String,
        label: "Beschreibung",
        optional: true,
        max: 2000
    },
    options: {
        type: [Object],
        max: 10,
        min: 2,
        label: 'Auswahloptionen',
        autoform:{
            inline: true
        }

    },
    "options.$.date": {
        type: Date,
        label: "Datum",
        autoform: {
            format: "DD.MM.YYYY"
        },
        optional: true
    },
    "options.$.name": {
        type: String,
        label: "Name",
        optional: true,
        max: 32
    },
    "options.$.id": {
        type: String,
        label: "ID",
        defaultValue: '0',
        autoform:{
            type:'hidden'
        }
    }
});
Meteor.startup(function() {
    UltiSite.schemas.uoodle = new ReactiveVar(uoodleSchema);
});
