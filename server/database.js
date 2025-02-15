const handleStuff = function () {
  Folders.upsert(
    {
      name: '/',
    },
    {
      $set: {
        name: '/',
        associated: [],
      },
    }
  );

  if (!Meteor.isAppTest) {
    // Read countries
    const rows = JSON.parse(Assets.getText('countries.json'));
    rows.forEach(function (entry) {
      Countries.upsert(entry.cca2, {
        _id: entry.cca2,
        name: (entry.translations.deu && entry.translations.deu.common) || entry.name.common,
        coordinates: entry.latlng,
        area: entry.area,
      });
    });

    // read cities
    if (Cities.find().count() === 0) {
      console.log('Recreating cities database');
      const cities = Assets.getText('cities5000.csv');
      let count = 0;
      cities.split('\n').forEach(function (line) {
        try {
          const lineAr = line.split('\t');
          const city = {
            _id: lineAr[0],
            name: lineAr[1],
            geocoords: [Number(lineAr[4]), Number(lineAr[5])],
            alternateNames: lineAr[3].split(','),
            country: lineAr[8],
            timezone: lineAr[17],
          };
          Cities.upsert(city._id, city);
          count += 1;
          if (count % 10000 === 0) {
            console.log(`Parsed ${count} cities`);
          }
        } catch (err) {}
      });
      console.log('Created cities database with Entries:', count);
    }
  }
  // Add default Settings
  if (!settings()) {
    Settings.insert({
      imageLogo: null,
      imageTitleImage: null,
      imageMobileLogo: null,
      imageIcon: null,
      arrayDivisions: [
        'Open',
        'Damen',
        'Soft Mixed',
        'Mixed',
        'Masters',
        'Mixed Masters',
        'Junioren',
        'Juniorinnen',
        'Mixed Junioren',
        'Grand Masters',
        'Damen Masters',
      ],
      arrayCategorys: ['Turnier', 'HAT-Turnier', 'DFV-Turnier', 'Trainingslager', 'Veranstaltung'],
      arraySurfaces: ['Rasen', 'Sand', 'Kunstrasen', 'Halle'],
      arrayClubStates: [
        'kein Mitglied',
        'Mitglied',
        'Präsident',
        'Vizepräsident',
        'Kassenwart',
        'Beisitzer',
        'Kassenprüfer',
      ],
      databaseCreated: true,
      objectHeaderLinks: {
        links: [
          {
            text: 'Turniere',
            target: '/tournaments',
            loggedIn: true,
            loggedOut: true,
            submenu: [],
          },
          {
            text: 'Trainings',
            target: '/practices',
            loggedIn: true,
            loggedOut: true,
            submenu: [],
          },
          {
            text: 'Wiki',
            target: '/wikipage',
            loggedIn: true,
            loggedOut: false,
            submenu: [],
          },
          {
            text: 'Dokumente',
            target: '/files',
            loggedIn: true,
            loggedOut: false,
            submenu: [],
          },
          {
            text: 'Mitglieder',
            target: '/users',
            loggedIn: true,
            loggedOut: false,
            submenu: [],
          },
        ],
      },
    });
  }
};

Meteor.methods({
  createDatabases() {
    if (!isAdmin()) {
      return;
    }
    if (settings() && settings().databaseCreated) {
      return;
    }
    Tracker.nonreactive(function () {
      handleStuff();
    });
  },

  cleanDatabases() {
    if (!isAdmin()) {
      return;
    }
    Tracker.nonreactive(function () {
      console.log('Start cleaning all databases');
      Settings.remove({});
      Meteor.users.remove({});
      Tournaments.remove({});
      WikiPages.remove({});
      Practices.remove({});
      Teams.remove({});
      Events.remove({});
      Images.remove({});
      Documents.remove({});
      console.log('Finished cleaning all databases');
    });
  },
  recreateCitiesCountries() {
    if (!isAdmin(this.userId)) {
      return;
    }
    handleStuff();
  },
  setupNeeded() {
    return !Meteor.users.findOne();
  },
});

Meteor.startup(function () {
  Meteor.call('createDatabases');
  Tournaments._ensureIndex({ date: -1 });
  Tournaments._ensureIndex({ lastChange: -1 });
  Tournaments._ensureIndex({ name: 1 });
  Tournaments._ensureIndex({ 'address.city': 1 });
  Tournaments._ensureIndex({ 'teams._id': 1 });
  Tournaments._ensureIndex({ 'participants.team': 1, 'participants.user': 1 });
  Cities._ensureIndex({ country: 1, name: 1 });
  Events._ensureIndex({ 'detail.time': -1 });
  Images._ensureIndex({ associated: 1 });
  Images._ensureIndex({ name: 1, tags: 1 });
  Documents._ensureIndex({ name: 1, tags: 1 });
  Documents._ensureIndex({ associated: 1 });
  Meteor.users._ensureIndex({ username: 1, 'profile.name': 1, 'emails.address': 1 });
});
