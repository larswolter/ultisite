import './user.scss';
import './userlist.html';

const usersOverview = new Meteor.Collection("usersOverview");
const paginationEntries = 20;

Template.userList.onCreated(function () {
  this.users = new ReactiveVar([]);
  const self = this;
  self.sortOpts = new ReactiveVar({
    username: 1,
  });
  self.pagination = new ReactiveVar(0);
  self.totalUsers = new ReactiveVar(0);
  self.autorun(() => {
    self.subscribe("usersOverview", {
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
  'click .action-create-user' (e, t) {
    e.preventDefault();
    UltiSite.showModal('userCreateDialog', {}, { dynamicImport: '/imports/client/user/user.js' });
  },
  'click .action-more-users' (e, t) {
    e.preventDefault();
    t.pagination.set(t.pagination.get() + paginationEntries);
    $(window).scrollTop();
  },
  'click .action-less-users' (e, t) {
    e.preventDefault();
    t.pagination.set(Math.max(0, t.pagination.get() - paginationEntries));
    $(window).scrollTop();
  },
  'click .h5 .fa-sort' (e, t) {
    t.$('.h5 .fa').removeClass().addClass('fa fa-sort');
    t.$(e.currentTarget).removeClass('fa-sort');
    t.$(e.currentTarget).addClass('fa-sort-asc');
    const sort = {};
    sort[t.$(e.currentTarget).attr('data-sort')] = -1;
    t.sortOpts.set(sort);
  },
  'click .h5 .fa-sort-asc' (e, t) {
    t.$('.h5 .fa').removeClass().addClass('fa fa-sort');
    t.$(e.currentTarget).removeClass('fa-sort');
    t.$(e.currentTarget).addClass('fa-sort-desc');
    const sort = {};
    sort[t.$(e.currentTarget).attr('data-sort')] = 1;
    t.sortOpts.set(sort);
  },
  'click .h5 .fa-sort-desc' (e, t) {
    t.$('.h5 .fa').removeClass().addClass('fa fa-sort');
    const sort = {};
    t.sortOpts.set(sort);
  },
});

Template.userList.helpers({
  totalPages () {
    return Math.ceil(Template.instance().totalUsers.get() / paginationEntries);
  },
  users () {
    return usersOverview.find();
  },
  paginationPos () {
    return Math.floor(Template.instance().pagination.get() / paginationEntries) + 1;
  },
});

Template.userItem.events({
  'click .action-club-state' (e, t) {
    e.preventDefault();

    const modifier = {};
    modifier['club.state'] = t.$(e.currentTarget).attr('data-value');

    Meteor.users.update({
      _id: t.data._id,
    }, {
      $set: modifier,
    }, UltiSite.userFeedbackFunction('Kontaktinfo speichern'));
  },
  'click .action-debit' (e, t) {
    e.preventDefault();
    UltiSite.getTextDialog({ text: this.profile.debit, header: "Schulden eingeben (0 = keine)" }, function (text) {
      const debit = Number(text);
      if (debit > 0) {
        Meteor.users.update(t.data._id, {
   $set: { 'profile.debit': debit },
 }, UltiSite.userFeedbackFunction('Schulden speichern'));
      } else {
        Meteor.users.update(t.data._id, {
          $unset: { 'profile.debit': 0 },
        }, UltiSite.userFeedbackFunction('Schulden entfernen'));
      }
    });
  },
});
