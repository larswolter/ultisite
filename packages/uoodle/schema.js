
uoodleSchema = new SimpleSchema({
    "name": {
        type: String,
        label: "Name",
        optional: false,
        max: 60
    },
    "owner": {
        type: String,
        label: "Owner",
        optional: false,
        autoform: {
            type: 'hidden'
        }
    },
    validUntil: {
        type: Date,
        label: "Läuft bis",
        autoform: {
            type: "bootstrap-datepicker",
            datePickerOptions: {
                language: "de-DE",
                format: "dd.mm.yyyy"
            }
        }
    },
    "description": {
        type: String,
        label: "Beschreibung",
        optional: true,
        max: 2000
    },
    participants: {
        type: [String],
        min: 0,
        defaultValue: [],
        autoform: {
            type: 'hidden'
        }
    },
    options: {
        type: [Object],
        max: 10,
        min: 2
    },
    "options.$.date": {
        type: Date,
        label: "Datum",
        autoform: {
            type: "bootstrap-datepicker",
            //buttonClasses: "fa fa-calendar",
            datePickerOptions: {
                language: "de-DE",
                format: "dd.mm.yyyy"
            }
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