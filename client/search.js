import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

Template.searchField.onCreated(function () {
  this.results = new ReactiveVar([]);
});

Template.searchField.events({
  'shown.bs.dropdown .dropdown-menu': function (e, t) {
    t.$('.search-field').val('');
    t.results.set(['Mind. zwei Zeichen']);
    t.$('.dropdown-menu input').focus();
  },
  'keyup .search-field': function (e, t) {
    t.$('.dropdown-menu').show();
    if ($(e.currentTarget).val().length > 1) {
      t.results.set(['<span class="fa fa-spinner fa-spin"></span>']);

      console.log('Search for ' + t.data.searchType);
      Meteor.call('search', $(e.currentTarget).val(), t.data.searchType.split(','), function (err, res) {
        if (t.data.notFoundContent) {
          res = res.concat(t.data.notFoundContent($(e.currentTarget).val()));
        }
        t.results.set(res);
      });
    } else {
      t.results.set(['Mind. zwei Zeichen']);
    }
  },
  'click a': function (e, t) {
    if (t.data.onResultClick) {
      e.preventDefault();
      if (t.data.onResultClick(this)) {
        t.$('.search-field').val('');
        t.results.set(['Mind. zwei Zeichen']);
        t.$('[data-toggle="dropdown"]').dropdown('toggle');
      }
    } else if (this.link) {
      FlowRouter.go(this.link);
    }
  },
});

Template.searchField.helpers({
  fileSearchResults() {
    return Template.instance().results.get();
  },
  numFileSearchResults() {
    return Template.instance().results.get().length;
  },
  placeHolder() {
    const searchTypes = Template.instance().data.searchType.split(',');
    if (searchTypes.length === 1) {
      return '' + searchTypeMapping(searchTypes[0]);
    } else if (searchTypes.length === 2) {
      return '' + searchTypeMapping(searchTypes[0]) + ' und ' + searchTypeMapping(searchTypes[1]);
    }
    return 'Suche...';
  },
});

function searchTypeMapping(searchType) {
  switch (searchType) {
    case 'Users':
      return UltiSite.settings().multiplePlayers;
    case 'Tournaments':
      return 'Turniere';
    case 'Documents':
      return 'Dateien';
    case 'Images':
      return 'Bilder';
    default:
      return searchType;
  }
}
