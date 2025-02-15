import { moment } from 'meteor/momentjs:moment';

import './team.js';
import './tournament.js';
import './tournament.scss';
import './tournamentList.html';

const months = new Meteor.Collection(null);
const prefillData = new ReactiveVar(undefined);
const tournamentQuery = new ReactiveVar({});
const tournamentFilter = new ReactiveVar({
  surface: 'Alle',
  category: 'Alle',
  division: 'Alle',
  type: 'Alle',
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
  Tracker.autorun(function () {
    if (UltiSite.screenSize.get() > 767) {
      if (tabSelection.get().length !== 3) {
        tabSelection.set(['played', 'planned', 'month']);
      }
    } else if (tabSelection.get().length !== 1) {
      if (Meteor.userId()) {
        tabSelection.set(['planned']);
      } else {
        tabSelection.set(['month']);
      }
    }
    console.log('adjusting to screensize....');
  });
});

Template.tournamentList.events({
  'click .action-add-tournament': function (evt) {
    evt.preventDefault();
    UltiSite.showModal(
      'tournamentUpdate',
      { type: 'insert', tournament: prefillData.get() },
      { dynamicImport: '/imports/client/tournaments/tournament.js' }
    );
  },
  'click .action-toggle-filter': function (evt, tmpl) {
    evt.preventDefault();
    tmpl.showFilter.set(!tmpl.showFilter.get());
  },
  'click .btn-more': function (evt) {
    evt.preventDefault();
    let neu = null;
    let last = null;
    if (!_.contains(tabSelection.get(), 'past')) {
      last = months.findOne(
        {},
        {
          sort: {
            year: -1,
            code: -1,
          },
        }
      );
      neu = moment().year(last.year).month(last.month).startOf('month').add(1, 'month');
    } else {
      last = months.findOne(
        {},
        {
          sort: {
            year: 1,
            code: 1,
          },
        }
      );
      neu = moment().year(last.year).month(last.month).startOf('month').subtract(1, 'month');
    }
    console.log(`additional month:${neu.format('MM.YYYY')}`);
    months.insert({
      unix: neu.unix(),
      code: neu.format('MM.YYYY'),
      month: neu.format('MMMM'),
      year: neu.format('YYYY'),
    });
    console.log('months', months.find().fetch());
  },
  'click .action-prev-month': function (evt) {
    evt.preventDefault();
    currentMonth.set(currentMonth.get().subtract(1, 'month'));
  },
  'click .action-next-month': function (evt) {
    evt.preventDefault();
    currentMonth.set(currentMonth.get().add(1, 'month'));
  },
  'click .action-use-filter': function (evt) {
    evt.preventDefault();
    tabSelection.set(_.union(_.without(tabSelection.get(), 'month', 'map'), ['filter']));
  },
  'click .action-use-map': function (evt) {
    evt.preventDefault();
    tabSelection.set(_.union(_.without(tabSelection.get(), 'filter', 'month'), ['map']));
  },
  'click .action-use-month': function (evt) {
    evt.preventDefault();
    tabSelection.set(_.union(_.without(tabSelection.get(), 'filter', 'map'), ['month']));
  },
  'click .tournament-tabs a': function (evt, tmpl) {
    evt.preventDefault();
    tabSelection.set([tmpl.$(evt.currentTarget).attr('data-target')]);
  },
  'click .btn-add-tournament': function () {
    prefillData.set({
      date: new Date(),
      address: {
        country: 'DE',
      },
      divisions: [],
      surfaces: [],
      category: 'Turnier',
      numDays: 2,
    });
  },
});

Template.tournamentList.onCreated(function () {
  this.showFilter = new ReactiveVar(false);
  this.topListEntries = new ReactiveVar(10);

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
      } else if (filter[key] !== 'Alle') {
        query[filterMap[key]] = { $regex: filter[key], $options: 'i' };
      }
    });
    console.log('Rebuilding query:', filter);
    this.subscribe('Tournaments', false, query);
    tournamentQuery.set(query);
  });

  UltiSite.offlineCheck();
});

Template.tournamentList.helpers({
  filterAsText() {
    const filter = tournamentFilter.get();
    let text = 'Kommende ';
    if (filter.year !== 'Kommende') {
      text = `In ${filter.year} stattfindende `;
    }
    if (filter.division !== 'Alle') {
      text += `${filter.division} `;
    }

    if (filter.category !== 'Alle') {
      text += filter.category + (filter.category.indexOf('urnier') > 0 ? 'e' : '');
    } else {
      text += 'Turniere';
    }
    if (filter.surface !== 'Alle') {
      text += ` auf ${filter.surface}`;
    }
    if (filter.withTeams) {
      text += ' mit Teams';
    }
    return text;
  },
  showFilter() {
    return Template.instance().showFilter.get();
  },
  newestTournament() {
    return UltiSite.Tournaments.findOne(
      {
        date: {
          $gte: moment().toDate(),
        },
        lastChange: {
          $gte: moment().subtract(1, 'day').toDate(),
        },
      },
      { limit: 1, sort: { lastChange: -1 } }
    );
  },
  hasPast() {
    return moment(this.date).isBefore(moment().subtract(this.numDays));
  },
  plannedTournaments() {
    const cursor = UltiSite.Tournaments.find(tournamentQuery.get());
    Template.instance().topListEntries.set(Math.max(cursor.count(), 10));
    const grouped = _.groupBy(_.sortBy(cursor.fetch(), 'date'), (t) => moment(t.date).format('MMMM YYYY'));
    return Object.keys(grouped).map((key) => ({
      _id: key,
      header: key,
      elements: grouped[key],
    }));
  },
  playedTournaments() {
    if (Template.instance().topListEntries.get()) {
      return UltiSite.Tournaments.find({
        date: { $lte: new Date() },
        'teams.state': 'dabei',
      });
    }
    return [];
  },
  showTournamentsFilter() {
    return _.contains(tabSelection.get(), 'filter');
  },
  showTournamentsMonth() {
    return _.contains(tabSelection.get(), 'month');
  },
  showTournamentsMap() {
    return _.contains(tabSelection.get(), 'map');
  },
  showPlayed() {
    return _.contains(tabSelection.get(), 'played');
  },
  showPlanned() {
    return _.contains(tabSelection.get(), 'planned');
  },
  activeMonth() {
    return {
      month: currentMonth.get().format('MMMM'),
      year: currentMonth.get().format('YYYY'),
    };
  },
  formatMonth(month) {
    return moment().month(month).format('MMMM');
  },
});

Template.tournamentFilter.events({
  'click a': function (evt) {
    evt.preventDefault();
    console.log(`${$(evt.currentTarget).data('target')}->${$(evt.currentTarget).text()}`);
    const filter = tournamentFilter.get();
    filter[$(evt.currentTarget).data('target')] = $(evt.currentTarget).text();
    tournamentFilter.set(filter);
  },
  'click .btn-mit-teams': function (evt) {
    evt.preventDefault();
    $(evt.currentTarget).toggleClass('checked');
    const filter = tournamentFilter.get();
    filter[$(evt.currentTarget).data('target')] = $(evt.currentTarget).hasClass('checked');
    tournamentFilter.set(filter);
  },
});

Template.tournamentFilter.helpers({
  filter() {
    return tournamentFilter.get();
  },
  tournamentYears() {
    return [
      moment().format('YYYY'),
      moment().subtract(1, 'year').format('YYYY'),
      moment().subtract(2, 'year').format('YYYY'),
      moment().subtract(3, 'year').format('YYYY'),
      moment().subtract(4, 'year').format('YYYY'),
      moment().subtract(5, 'year').format('YYYY'),
      moment().subtract(6, 'year').format('YYYY'),
      moment().subtract(7, 'year').format('YYYY'),
    ];
  },
});

const helpers = {
  tournament() {
    return Template.instance().data._id;
  },
  over() {
    if (!Template.instance().data) {
      return false;
    }
    if (moment(Template.instance().data.date).isBefore(moment(), 'day')) {
      return true;
    }
    return false;
  },
  dateState() {
    if (moment(Template.instance().data.date).clone().add(Template.instance().data.days, 'days').isBefore(moment())) {
      return 'text-muted';
    }
    if (moment(Template.instance().data.date).isAfter(moment())) {
      return '';
    }
    return 'text-info';
  },
  tags() {
    const tags = [];
    this.divisions.forEach(function (elem) {
      if (elem.indexOf('Damen') > -1) {
        tags.push({
          icon: 'venus',
          text: elem,
        });
      }
      if (elem.indexOf('Open') > -1) {
        tags.push({
          icon: 'mars',
          text: elem,
        });
      }
      if (elem.indexOf('Mixed') > -1) {
        tags.push({
          icon: 'venus-mars',
          text: elem,
        });
      }
      if (elem.indexOf('Masters') > -1) {
        tags.push({
          icon: 'user-secret',
          text: elem,
        });
      }
      if (elem.indexOf('Junioren') > -1) {
        tags.push({
          icon: 'child',
          text: elem,
        });
      }
    });
    this.surfaces.forEach(function (elem) {
      if (elem === 'Sand') {
        tags.push({
          icon: 'sun-o',
          text: elem,
        });
      }
      if (elem === 'Halle') {
        tags.push({
          icon: 'home',
          text: elem,
        });
      }
    });
    if (this.category === 'HAT-Turnier') {
      tags.push({
        icon: 'graduation-cap',
        text: 'HAT',
      });
    } else if (this.category === 'Veranstaltung') {
      tags.push({
        icon: 'birthday-cake',
        text: 'Event',
      });
    } else if (this.category === 'DFV-Turnier') {
      tags.push({
        img: '/dfv.png',
        text: 'DFV Turnier',
      });
    }
    return _.unique(tags, false, function (item) {
      return item.text;
    });
  },
  divisionIcon() {
    if (!this.division) {
      return 'question';
    }
    if (this.division.indexOf('Damen') >= 0) {
      return 'venus';
    }
    if (this.division.indexOf('Mixed') >= 0) {
      return 'venus-mars';
    }
    if (this.division.indexOf('Open') >= 0) {
      return 'mars';
    }
    return 'question';
  },
  myTeamState() {
    return _.find(this.participants, (p) => p.user === Meteor.userId());
  },
  teaminfo() {
    const teams = this.teams || [];

    return teams.map((team) => {
      return _.extend(
        {
          participants: this.participants.filter((p) => p.team === team._id),
          stateColor: UltiSite.stateColor(team.state),
        },
        team
      );
    });
  },
};
Template.tournamentListItem.helpers(helpers);
Template.detailedTournamentListItem.helpers(helpers);
Template.pastTournamentListItem.helpers({
  teamImages() {
    return (this.teams || []).map((t) => t.image).filter((i) => !!i);
  },
  teamNames() {
    let iamIn = false;
    let names = (this.teams || [])
      .map((team) => {
        if (!team) {
          return '-';
        }
        if (team.state !== 'dabei') {
          return '-';
        }
        iamIn = iamIn || !!_.find(team.participants, (p) => p.user === Meteor.userId() && p.state === 100);
        return (
          team.name +
          (team.results && team.results.placement ? ` machten Platz ${team.results.placement}` : ' waren dabei ')
        );
      })
      .filter((x) => x !== '-');
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
