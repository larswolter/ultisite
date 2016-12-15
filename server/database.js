Meteor.methods({
    createDatabases: function () {
        if (UltiSite.settings() && UltiSite.settings().databaseCreated)
            return;
        Tracker.nonreactive(function () {
            handleStuff();
        });
    },

    cleanDatabases: function () {
        Tracker.nonreactive(function () {
            console.log("Start cleaning all databases");
            UltiSite.Settings.remove({});
            Meteor.users.remove({});
            UltiSite.Tournaments.remove({});
            UltiSite.WikiPages.remove({});
            UltiSite.Practices.remove({});
            UltiSite.Teams.remove({});
            UltiSite.Events.remove({});
            UltiSite.Images.remove({});
            UltiSite.Documents.remove({});
            console.log("Finished cleaning all databases");
        });
    },
    recreateCitiesCountries: function() {
        handleStuff();
    },
    setupNeeded: function() {
        return !Meteor.users.findOne();
    }
});


Meteor.startup(function () {
    Meteor.call('createDatabases');
});


var handleStuff = function () {
    UltiSite.Folders.upsert({
        name: "/"
    }, {
        $set: {
            name: "/",
            associated: []
        }
    });


    // Read countries
    var rows = JSON.parse(Assets.getText('countries.json'));
    rows.forEach(function (entry) {
        UltiSite.Countries.upsert(entry.cca2, {
            _id: entry.cca2,
            name: (entry.translations.deu && entry.translations.deu.common) || entry.name.common,
            coordinates: entry.latlng,
            area: entry.area
        });
    });

    // read cities
    if (UltiSite.Cities.find().count() === 0) {
        console.log('Recreating cities database');
        var cities = Assets.getText("cities5000.csv");
        var count = 0;
        cities.split("\n").forEach(function (line) {
            try {
                var lineAr = line.split('\t');
                var city = {
                    _id: lineAr[0],
                    name: lineAr[1],
                    geocoords: [Number(lineAr[4]), Number(lineAr[5])],
                    alternateNames: lineAr[3].split(","),
                    country: lineAr[8],
                    timezone: lineAr[17]
                };
                UltiSite.Cities.upsert(city._id, city);
                count++;
                if(count%10000===0)
                    console.log('Parsed '+count+' cities');
            } catch (err) {

            }
        });
        console.log('Created cities database with Entries:',count);
    }

    // Add default Settings
    if(!UltiSite.settings())
        UltiSite.Settings.insert({
            imageLogo: null,
            imageTitleImage: null,
            imageMobileLogo: null,
            imageIcon: null,
            arrayDivisions: ["Open", "Damen", "Soft Mixed", "Mixed", "Masters", "Mixed Masters", "Junioren", "Juniorinnen", "Mixed Junioren", "Grand Masters", "Damen Masters"],
            arrayCategorys: ["Turnier", "HAT-Turnier", "DFV-Turnier", "Trainingslager", "Veranstaltung"],
            arraySurfaces: ["Rasen", "Sand", "Kunstrasen", "Halle"],
            arrayClubStates: ["kein Mitglied", "Mitglied", "Präsident", "Vizepräsident", "Kassenwart", "Beisitzer", "Kassenprüfer"],
            databaseCreated: true,
            objectHeaderLinks: {
                "links": [{
                    "text": "Turniere",
                    "target": "/tournaments",
                    "loggedIn": true,
                    "loggedOut": true,
                    "submenu": []
                }, {
                    "text": "Trainings",
                    "target": "/practices",
                    "loggedIn": true,
                    "loggedOut": true,
                    "submenu": []
                }, {
                    "text": "Wiki",
                    "target": "/wikipage",
                    "loggedIn": true,
                    "loggedOut": false,
                    "submenu": []
                }, {
                    "text": "Dokumente",
                    "target": "/files",
                    "loggedIn": true,
                    "loggedOut": false,
                    "submenu": []
                }, {
                    "text": "Mitglieder",
                    "target": "/users",
                    "loggedIn": true,
                    "loggedOut": false,
                    "submenu": []
                }]
            }
        });
};