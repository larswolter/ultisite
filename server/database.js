import {
  Cities,
  Countries,
  Documents,
  Events,
  Folders,
  Images,
  isAdmin,
  Practices,
  Settings,
  settings,
  Teams,
  Tournaments,
  WikiPages,
} from '../common/lib/ultisite';

const handleStuff = async function() {
  await Folders.upsertAsync(
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
    rows.forEach(async function(entry) {
      await Countries.upsertAsync(entry.cca2, {
        _id: entry.cca2,
        name: (entry.translations.deu && entry.translations.deu.common) || entry.name.common,
        coordinates: entry.latlng,
        area: entry.area,
      });
    });

    // read cities
    if ((await Cities.find().countAsync()) === 0) {
      console.log('Recreating cities database');
      const cities = Assets.getText('cities5000.csv');
      let count = 0;
      cities.split('\n').forEach(async function(line) {
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
          await Cities.upsertAsync(city._id, city);
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
  if (!(await settings())) {
    await Settings.insertAsync({
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
  async createDatabases() {
    if (!(await isAdmin())) {
      return;
    }
    if ((await settings()) && (await settings()).databaseCreated) {
      return;
    }
    Tracker.nonreactive(async function() {
      await handleStuff();
    });
  },

  async cleanDatabases() {
    if (!(await isAdmin())) {
      return;
    }
    Tracker.nonreactive(async function() {
      console.log('Start cleaning all databases');
      await Settings.removeAsync({});
      await Meteor.users.removeAsync({});
      await Tournaments.removeAsync({});
      await WikiPages.removeAsync({});
      await Practices.removeAsync({});
      await Teams.removeAsync({});
      await Events.removeAsync({});
      await Images.removeAsync({});
      await Documents.removeAsync({});
      console.log('Finished cleaning all databases');
    });
  },
  async recreateCitiesCountries() {
    if (!(await isAdmin(this.userId))) {
      return;
    }
    await handleStuff();
  },
  async setupNeeded() {
    return !(await Meteor.users.findOneAsync());
  },
});

Meteor.startup(async function() {
  await Meteor.callAsync('createDatabases');
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
