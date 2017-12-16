import './team.js';
import './tournament.js';
import './tournament.less';
import './tournamentList.html';

const months = new Meteor.Collection(null);
const integratedTournamentList = new Meteor.Collection(null);
const prefillData = new ReactiveVar(undefined);
const tournamentQuery = new ReactiveVar({});
const tournamentFilter = new ReactiveVar({
  surface: "Alle",
  category: "Alle",
  division: "Alle",
  type: "Alle",
  withTeams: true,
  year: 'Kommende',
});
const currentMonth = new ReactiveVar(moment().startOf('month'));
const tabSelection = new ReactiveVar([]);
const filterMap = {
  division: 'divisions',
  surface: 'surfaces',
  category: 'category',
};

Meteor.startup(function () {
  UltiSite.integratedTournamentList = integratedTournamentList;
  Tracker.autorun(function () {
    if (UltiSite.screenSize.get() > 767) {
      if (tabSelection.get().length !== 3) { tabSelection.set(['played', 'planned', 'month']); }
    } else if (tabSelection.get().length !== 1) {
      if (Meteor.userId()) { tabSelection.set(['planned']); } else { tabSelection.set(['month']); }
    }
    console.log("adjusting to screensize....");
  });
  Tracker.autorun(function () {
    const myteams = UltiSite.Teams.find({
      $or: [
        { 'participants.user': Meteor.userId() },
        { clubTeam: true },
      ],
    }).map(function (t) {
      return t._id;
    });
    UltiSite.myTeamIds.set(myteams);
  });
});


Template.tournamentList.events({
  'click .action-add-tournament'(e, tmpl) {
    e.preventDefault();
    UltiSite.showModal('tournamentUpdate', { type: 'insert', tournament: prefillData.get() }, { dynamicImport: '/imports/client/tournaments/tournament.js' });
  },
  'click .action-toggle-filter'(e, tmpl) {
    e.preventDefault();
    tmpl.showFilter.set(!tmpl.showFilter.get());
  },
  'click .btn-more'(e) {
    e.preventDefault();
    let neu = null;
    let last = null;
    if (!_.contains(tabSelection.get(), "past")) {
      last = months.findOne({}, {
        sort: {
          year: -1,
          code: -1,
        },
      });
      neu = moment().year(last.year).month(last.month).startOf('month').add(1, "month");
    } else {
      last = months.findOne({}, {
        sort: {
          year: 1,
          code: 1,
        },
      });
      neu = moment().year(last.year).month(last.month).startOf('month').subtract(1, "month");
    }
    console.log(`additional month:${neu.format("MM.YYYY")}`);
    months.insert({
      unix: neu.unix(),
      code: neu.format("MM.YYYY"),
      month: neu.format("MMMM"),
      year: neu.format("YYYY"),
    });
    console.log("months", months.find().fetch());
  },
  'click .action-prev-month'(e, t) {
    e.preventDefault();
    currentMonth.set(currentMonth.get().subtract(1, 'month'));
  },
  'click .action-next-month'(e, t) {
    e.preventDefault();
    currentMonth.set(currentMonth.get().add(1, 'month'));
  },
  'click .action-use-filter'(e, t) {
    e.preventDefault();
    tabSelection.set(_.union(_.without(tabSelection.get(), 'month', 'map'), ['filter']));
  },
  'click .action-use-map'(e, t) {
    e.preventDefault();
    tabSelection.set(_.union(_.without(tabSelection.get(), 'filter', 'month'), ['map']));
  },
  'click .action-use-month'(e, t) {
    e.preventDefault();
    tabSelection.set(_.union(_.without(tabSelection.get(), 'filter', 'map'), ['month']));
  },
  'click .tournament-tabs a'(e, t) {
    e.preventDefault();
    tabSelection.set([t.$(e.currentTarget).attr('data-target')]);
  },
  'click .btn-add-tournament'(e) {
    prefillData.set({
      date: new Date(),
      address: {
        country: "DE",
      },
      divisions: [],
      surfaces: [],
      category: "Turnier",
      numDays: 2,
    });
  },
});

Template.tournamentList.onCreated(function () {
  this.showFilter = new ReactiveVar(false);
  this.topListEntries = new ReactiveVar();
  this.autorun(() => {
    const lastSync = moment(localStorage.getItem('offlineLastSync'));
    this.subscribe("Tournaments", lastSync.toDate());
  });
  Meteor.defer(() => {
    this.autorun(() => {
      UltiSite.offlineTournamentDependency.depend();
      integratedTournamentList.update({ fromOfflineStore: true }, { $set: { removeMe: true } }, { multi: true });
      UltiSite.offlineTournaments.forEach((t) => {
        let exists;
        Tracker.nonreactive(() => {
          exists = integratedTournamentList.findOne(t._id);
        });
        if (!exists) { integratedTournamentList.insert(_.extend({ fromOfflineStore: true, removeMe: false }, t)); } else { integratedTournamentList.update({ _id: t._id, lastChange: { $lte: t.lastChange } }, _.extend({ fromOfflineStore: true, removeMe: false }, t)); }
      });
      integratedTournamentList.remove({ fromOfflineStore: true, removeMe: true });
    });
  });
  this.autorun(() => {
    if (this.subscriptionsReady()) {
      UltiSite.Tournaments.find().forEach(t => integratedTournamentList.upsert(t._id, t));
    }
  });

  this.autorun(() => {
    const query = {};
    const filter = tournamentFilter.get();
    Object.keys(filter).forEach((key) => {
      if (key === 'withTeams') {
        if (filter[key]) {
          query.teams = { $exists: true, $ne: [] };
        }
      } else if (key === 'year' && filter[key] === 'Kommende') {
        query.date = {
          $gte: moment().subtract(1, 'day').toDate(),
        };
      } else if (key === 'year' && filter[key]) {
        query.date = {
          $gte: moment().year(filter[key]).startOf('year').toDate(),
          $lte: moment().year(filter[key]).endOf('year').toDate(),
        };
      } else if (filter[key] !== 'Alle') { query[filterMap[key]] = { $regex: filter[key], $options: 'i' }; }
    });
    if (filter.year && (filter.year !== moment().format('YYYY')) && (filter.year !== 'Kommende')) {
      console.log('Rebuilding query:', filter);
      this.subscribe('Tournaments', false, query);
      UltiSite.notify('Alte Turniere werden geladen...', 'info');
    }
    tournamentQuery.set(query);
  });

  UltiSite.offlineCheck();
});

Template.tournamentList.helpers({
  filterAsText() {
    const filter = tournamentFilter.get();
    let text = 'Kommende ';
    if (filter.year !== 'Kommende') { text = `In ${filter.year} stattfindende `; }
    if (filter.division !== 'Alle') { text += `${filter.division} `; }

    if (filter.category !== 'Alle') { text += filter.category + (filter.category.indexOf('urnier') > 0 ? 'e' : ''); } else { text += 'Turniere'; }
    if (filter.surface !== 'Alle') { text += ` auf ${filter.surface}`; }
    if (filter.withTeams) { text += ' mit Teams'; }
    return text;
  },
  showFilter() {
    return Template.instance().showFilter.get();
  },
  newestTournament() {
    return UltiSite.Tournaments.findOne({
      date: {
        $gte: moment().toDate(),
      },
      lastChanged: {
        $gte: moment().subtract(1, 'day').toDate(),
      },

    }, { limit: 1, sort: { lastChanged: -1 } });
  },
  hasPast() {
    return moment(this.date).isBefore(moment().subtract(this.numDays));
  },
  plannedTournaments() {
    const cursor = integratedTournamentList.find(tournamentQuery.get());
    Template.instance().topListEntries.set(cursor.count());
    const grouped = _.groupBy(_.sortBy(cursor.fetch(), 'date'), t => moment(t.date).format('MMMM YYYY'));
    return Object.keys(grouped).map(key => ({
      _id: key,
      header: key,
      elements: grouped[key],
    }));
  },
  playedTournaments() {
    if (Template.instance().topListEntries.get()) {
      const count = 0;

      return integratedTournamentList.find({ date: { $lte: new Date() }, teams: { $exists: true } }, { $sort: { date: -1, name: 1 } }).map((tourney) => {
        if (count === Template.instance().topListEntries.get()) {
          return undefined;
        }
        if (_.find(tourney.teams || [], (t) => {
          const team = UltiSite.getTeam(t);
          return team && team.state === 'dabei';
        })) { return tourney; }
      }).filter(x => !!x);
    }
    return [];
  },
  showTournamentsFilter() {
    return _.contains(tabSelection.get(), "filter");
  },
  showTournamentsMonth() {
    return _.contains(tabSelection.get(), "month");
  },
  showTournamentsMap() {
    return _.contains(tabSelection.get(), "map");
  },
  showPlayed() {
    return _.contains(tabSelection.get(), "played");
  },
  showPlanned() {
    return _.contains(tabSelection.get(), "planned");
  },
  activeMonth() {
    return {
      month: currentMonth.get().format("MMMM"),
      year: currentMonth.get().format("YYYY"),
    };
  },
  formatMonth(month) {
    return moment().month(month).format("MMMM");
  },
});

Template.tournamentFilter.events({
  "click a"(e) {
    e.preventDefault();
    console.log(`${$(e.currentTarget).data('target')}->${$(e.currentTarget).text()}`);
    const filter = tournamentFilter.get();
    filter[$(e.currentTarget).data('target')] = $(e.currentTarget).text();
    tournamentFilter.set(filter);
  },
  "click .btn-mit-teams"(e) {
    e.preventDefault();
    $(e.currentTarget).toggleClass("checked");
    const filter = tournamentFilter.get();
    filter[$(e.currentTarget).data('target')] = $(e.currentTarget).hasClass("checked");
    tournamentFilter.set(filter);
  },
});

Template.tournamentFilter.helpers({
  filter() {
    return tournamentFilter.get();
  },
  tournamentYears() {
    return [moment().format("YYYY"),
      moment().subtract(1, "year").format("YYYY"),
      moment().subtract(2, "year").format("YYYY"),
      moment().subtract(3, "year").format("YYYY"),
      moment().subtract(4, "year").format("YYYY"),
      moment().subtract(5, "year").format("YYYY"),
      moment().subtract(6, "year").format("YYYY"),
      moment().subtract(7, "year").format("YYYY"),
    ];
  },
});

const helpers = {
  tournament() {
    return Template.instance().data._id;
  },
  over() {
    if (!Template.instance().data) { return false; }
    if (moment(Template.instance().data.date).isBefore(moment(), "day")) { return true; }
    return false;
  },
  dateState() {
    if (moment(Template.instance().data.date).clone().add(Template.instance().data.days, 'days').isBefore(moment())) { return 'text-muted'; }
    if (moment(Template.instance().data.date).isAfter(moment())) { return ''; }
    return 'text-info';
  },
  tags() {
    const tags = [];
    this.divisions.forEach(function (elem) {
      if (elem.indexOf("Damen") > -1) {
        tags.push({
          icon: "venus",
          text: elem,
        });
      }
      if (elem.indexOf("Open") > -1) {
        tags.push({
          icon: "mars",
          text: elem,
        });
      }
      if (elem.indexOf("Mixed") > -1) {
        tags.push({
          icon: "venus-mars",
          text: elem,
        });
      }
      if (elem.indexOf("Masters") > -1) {
        tags.push({
          icon: "user-secret",
          text: elem,
        });
      }
      if (elem.indexOf("Junioren") > -1) {
        tags.push({
          icon: "child",
          text: elem,
        });
      }
    });
    this.surfaces.forEach(function (elem) {
      if (elem === "Sand") {
        tags.push({
          icon: "sun-o",
          text: elem,
        });
      }
      if (elem === "Halle") {
        tags.push({
          icon: "home",
          text: elem,
        });
      }
    });
    if (this.category === "HAT-Turnier") {
      tags.push({
        icon: "graduation-cap",
        text: "HAT",
      });
    } else if (this.category === "Veranstaltung") {
      tags.push({
        icon: "birthday-cake",
        text: "Event",
      });
    } else if (this.category === "DFV-Turnier") {
      tags.push({
        img: "/dfv.png",
        text: "DFV Turnier",
      });
    }
    return _.unique(tags, false, function (item) {
      return item.text;
    });
  },
  divisionIcon() {
    if (!this.division) { return 'question'; }
    if (this.division.indexOf("Damen") >= 0) { return "venus"; }
    if (this.division.indexOf("Mixed") >= 0) { return "venus-mars"; }
    if (this.division.indexOf("Open") >= 0) { return "mars"; }
    return "question";
  },
  myTeamState() {
    return (_.find(this.participants, p => p.user === Meteor.userId()));
  },
  teaminfo() {
    const teams = this.teams || [];

    return teams.map(function (id) {
      const teamObj = UltiSite.getTeam(id) || { name: '-unbekannt-' };
      return _.extend({
        stateColor: UltiSite.stateColor(teamObj.state),
      }, teamObj);
    });
  },
};
Template.tournamentListItem.helpers(helpers);
Template.detailedTournamentListItem.helpers(helpers);
Template.pastTournamentListItem.helpers({
  teamImages() {
    return (this.teams || []).map(function (team) {
      const teamObj = UltiSite.getTeam(team);
      return teamObj && teamObj.image;
    }).filter(t => !!t);
  },
  teamNames() {
    let iamIn = false;
    let names = (this.teams || []).map((team) => {
      const teamObj = UltiSite.getTeam(team);
      if (!teamObj) { return '-'; }
      if (teamObj.state !== 'dabei') { return '-'; }
      iamIn = iamIn || !!_.find(teamObj.participants, p => (p.user === Meteor.userId()) && (p.state === 100));
      return teamObj.name + (teamObj.results && teamObj.results.placement ? ` machten Platz ${teamObj.results.placement}` : ' waren dabei ');
    }).filter(x => x !== '-');
    if (iamIn) {
      names = ['Ich'].concat(names);
    }
    if (names.length === 0) {
      return '';
    } else if (names.length === 1) {
      return names[0];
    }

    const last = names.pop();
    return `${names.join(',')} und ${last}`;
  },
});
