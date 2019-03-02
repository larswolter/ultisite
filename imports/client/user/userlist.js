import { moment } from 'meteor/momentjs:moment';

import './user.scss';
import './userlist.html';

const usersOverview = new Meteor.Collection('usersOverview');
const paginationEntries = 20;
UltiSite.usersOverview = usersOverview;

Template.userList.onCreated(function () {
  this.users = new ReactiveVar([]);
  const self = this;
  self.sortOpts = new ReactiveVar({
    username: 1,
  });
  self.pagination = new ReactiveVar(0);
  self.totalUsers = new ReactiveVar(0);
  self.autorun(() => {
    self.subscribe('usersOverview', {
      sort: self.sortOpts.get(),
      skip: self.pagination.get(),
      limit: paginationEntries,
    });
    Meteor.call('totalUsers', (err, res) => {
      this.totalUsers.set(res);
    });
  });
});

Template.userList.events({
  'click .action-create-user': function (evt, tmpl) {
    evt.preventDefault();
    UltiSite.showModal('userCreateDialog', {}, { dynamicImport: '/imports/client/user/user.js' });
  },
  'click .action-more-users': function (evt, tmpl) {
    evt.preventDefault();
    tmpl.pagination.set(tmpl.pagination.get() + paginationEntries);
    $(window).scrollTop();
  },
  'click .action-less-users': function (evt, tmpl) {
    evt.preventDefault();
    tmpl.pagination.set(Math.max(0, tmpl.pagination.get() - paginationEntries));
    $(window).scrollTop();
  },
  'click .user-list-header .fa-sort': function (evt, tmpl) {
    tmpl.$('.user-list-header .fa').removeClass().addClass('fa fa-sort');
    tmpl.$(evt.currentTarget).removeClass('fa-sort');
    tmpl.$(evt.currentTarget).addClass('fa-sort-asc');
    const sort = {};
    sort[tmpl.$(evt.currentTarget).attr('data-sort')] = -1;
    tmpl.sortOpts.set(sort);
  },
  'click .user-list-header .fa-sort-asc': function (evt, tmpl) {
    tmpl.$('.user-list-header .fa').removeClass().addClass('fa fa-sort');
    tmpl.$(evt.currentTarget).removeClass('fa-sort');
    tmpl.$(evt.currentTarget).addClass('fa-sort-desc');
    const sort = {};
    sort[tmpl.$(evt.currentTarget).attr('data-sort')] = 1;
    tmpl.sortOpts.set(sort);
  },
  'click .user-list-header .fa-sort-desc': function (evt, tmpl) {
    tmpl.$('.user-list-header .fa').removeClass().addClass('fa fa-sort');
    const sort = {};
    tmpl.sortOpts.set(sort);
  },
});

Template.userList.helpers({
  totalPages() {
    return Math.ceil(Template.instance().totalUsers.get() / paginationEntries);
  },
  users() {
    return usersOverview.find();
  },
  paginationPos() {
    return Math.floor(Template.instance().pagination.get() / paginationEntries) + 1;
  },
});

Template.userItem.helpers({
  currentDFV() {
    return this.club && this.club.dfv && this.club.dfv.includes(moment().year());
  },
  lastDFV() {
    const res = (this.club && this.club.dfv && this.club.dfv.length && this.club.dfv.sort().reverse()[0]) || 'nie';
    return res;
  },
});

Template.userItem.events({
  'click .action-club-state': function (evt, tmpl) {
    evt.preventDefault();

    if (tmpl.data.club && tmpl.data.club.state) {
      Meteor.users.update({
        _id: tmpl.data._id,
      }, {
        $unset: { 'club.state': 1 },
      }, UltiSite.userFeedbackFunction('Vereinszugehörigkeit speichern'));
    } else {
      Meteor.users.update({
        _id: tmpl.data._id,
      }, {
        $set: { 'club.state': 'Mitglied' },
      }, UltiSite.userFeedbackFunction('Vereinszugehörigkeit speichern'));
    }
  },
  'click .action-club-dfv': function (evt, tmpl) {
    evt.preventDefault();

    if (tmpl.data.club && tmpl.data.club.dfv.includes(moment().year())) {
      Meteor.users.update({
        _id: tmpl.data._id,
      }, {
        $pull: { 'club.dfv': moment().year() },
      }, UltiSite.userFeedbackFunction('DFV Anmeldestatus speichern'));
    } else {
      Meteor.users.update({
        _id: tmpl.data._id,
      }, {
        $addToSet: { 'club.dfv': moment().year() },
      }, UltiSite.userFeedbackFunction('DFV Anmeldestatus speichern'));
    }
  },
  'click .action-debit': function (evt, tmpl) {
    evt.preventDefault();
    UltiSite.getTextDialog({ text: this.profile.debit, header: 'Schulden eingeben (0 = keine)' }, function (text) {
      const debit = Number(text);
      if (debit > 0) {
        Meteor.users.update(tmpl.data._id, {
          $set: { 'profile.debit': debit },
        }, UltiSite.userFeedbackFunction('Schulden speichern'));
      } else {
        Meteor.users.update(tmpl.data._id, {
          $unset: { 'profile.debit': 0 },
        }, UltiSite.userFeedbackFunction('Schulden entfernen'));
      }
    });
  },
});
