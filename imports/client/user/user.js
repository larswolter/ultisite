import { AutoForm } from 'meteor/ultisite:autoform';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Roles } from 'meteor/alanning:roles';
import { moment } from 'meteor/momentjs:moment';

import './user.scss';
import './user.html';
import './userlist.html';

Meteor.startup(function () {
  Meteor.subscribe('UserDetails', Meteor.userId());
});

const userHelper = {
  user() {
    return Meteor.users.findOne(FlowRouter.getParam('_id'));
  },
  currentYear() {
    return moment().format('YYYY');
  },
  getAlias() {
    return this.username;
  },
  sexIcon() {
    return this.profile ? this.profile.sex === 'W' ? 'fa-female' : 'fa-male' : 'fa-user';
  },
  isEditable() {
    if (UltiSite.isAdmin()) { return true; }
    if (Meteor.userId() === FlowRouter.getParam('_id')) { return true; }
    return false;
  },
  imagesWithUser() {
    return UltiSite.Images.find({
      associated: this._id,
    });
  },
  contactDetails() {
    if (!this.profile.contactDetails) { return []; }
    return this.profile.contactDetails.map(function (elem, idx) {
      return _.extend({
        index: idx,
      }, elem);
    });
  },
  email() {
    return this.emails[0];
  },
  userRoles() {
    const self = this;
    if (UltiSite.isAdmin(Meteor.userId())) {
      return Roles.getAllRoles().map(function (r) {
        return {
          name: r.name,
          active: Roles.userIsInRole(self, r.name),
        };
      });
    }
    return self.roles.map(function (r) {
      return {
        name: r,
        active: true,
      };
    });
  },
  notificationsStatus() {
    return ('Notification' in window) ? Notification.permission : 'unsupported';
  },
  emailNotificationTypes() {
    let mls = [];
    if (UltiSite.settings()) {
      mls = UltiSite.settings().mailingListConfigs.map(mc => ({ type: mc.from.toCamelCase(), name: 'Mailingliste ' + mc.from }));
    }
    return mls.concat([
      { type: 'wiki', name: 'Wiki' },
      { type: 'tournament', name: 'Turnier' },
      { type: 'team', name: 'Team' },
      { type: 'blog', name: 'Artikel' },
      { type: 'files', name: 'Dokumente/Bilder' },
    ]);
  },
  isMailType(status) {
    const user = Meteor.users.findOne(FlowRouter.getParam('_id'));
    return user.settings && user.settings.email && (user.settings.email[this.type] === status);
  },
  hasStatistics() {
    if (UltiSite.Statistics.find({
      target: this._id,
    }).count() > 0) { return true; }
    return false;
  },
  plannedTournaments() {
    return (UltiSite.Statistics.findOne({
      target: this._id,
      type: 'plannedTournaments',
    }) || { data: [] }).data;
  },
  playedTournamentYears() {
    const years = {};
    let unsure = 0;
    let total = 0;
    const data = (UltiSite.Statistics.findOne({
      target: this._id,
      type: 'playedTournaments',
    }, {
      sort: {
        'data.date': -1,
      },
    }) || {
        data: [],
      }).data;
    data.forEach(function (elem) {
      const m = moment(elem.date);
      if (m.isValid()) {
        if (elem.unsure) { unsure += 1; }
        total += 1;
        const year = m.format('YYYY');
        if (!years[year]) { years[year] = []; }
        years[year].push(elem);
      } else console.log('Invalid statistics:', elem);
    });
    return {
      count: total - unsure,
      total,
      years: Object.keys(years).map(function (year) {
        return {
          t: years[year],
          y: year,
        };
      }).reverse(),
    };
  },
  top10Players() {
    return (UltiSite.Statistics.findOne({
      target: this._id,
      type: 'top10Players',
    }) || { data: [] }).data;
  },
  // TODO: add statistics, like top 10 cities
};
Template.userdisplay.helpers(userHelper);
Template.user.helpers(userHelper);

Template.user.onCreated(function () {
  this.autorun(() => {
    const userId = FlowRouter.getParam('_id');
    if (!userId) {
      return;
    }
    this.subscribe('UserRoles');
    this.subscribe('UserDetails', FlowRouter.getParam('_id'));
    this.subscribe('Statistics', FlowRouter.getParam('_id'));
    this.subscribe('Files', [FlowRouter.getParam('_id')]);
  });
});

Template.user.events({
  'click .action-remove-user': function (evt) {
    evt.preventDefault();
    UltiSite.confirmDialog('Nutzer wirklich löschen?', () => {
      const userId = FlowRouter.getParam('_id');
      Meteor.call('userRemove', userId, (err, res) => {
        if (err) {
          UltiSite.notify('Konnte E-Mail nicht ändern nicht speicher', 'error');
        } else {
          FlowRouter.go('users');
        }
      });
    });
  },
  'click .action-block-user': function (evt) {
    evt.preventDefault();
    const userId = FlowRouter.getParam('_id');
    Meteor.call('userToggleBlocked', userId);
  },
  'click .action-edit-email': function (e, t) {
    UltiSite.getTextDialog({ text: this.address, header: 'Neue E-Mail eingeben' }, (newAddress) => {
      const userId = FlowRouter.getParam('_id');
      Meteor.call('userUpdateEmail', userId, this.address, newAddress, (err) => {
        if (err) {
          UltiSite.notify('Konnte E-Mail nicht ändern nicht speicher', 'error');
        }
      });
    });
  },
  'click .btn-edit-image': function (e, t) {
    e.preventDefault();
    const userId = FlowRouter.getParam('_id');
    UltiSite.fileBrowserShowDialog(userId, function (file) {
      if (file) {
        UltiSite.Images.update(file._id, {
          $addToSet: {
            associated: userId,
            tags: 'Mitglieder',
          },
        });
      }
      Meteor.users.update(userId, { $set: { 'profile.avatar': file && file._id } });
      UltiSite.fileBrowserHideDialog();
    });
  },
  'click .user-contacts .btn-remove': function (e, t) {
    e.preventDefault();
    UltiSite.confirmDialog('Wollen sie den Eintrag wirklich löschen?', () => {
      const modifier = {};

      modifier[`profile.contactDetails.${$(e.currentTarget).attr('data-index')}`] = null;
      Meteor.users.update({
        _id: FlowRouter.getParam('_id'),
      }, {
        $set: modifier,
      });

      Meteor.users.update({
        _id: FlowRouter.getParam('_id'),
      }, {
        $pull: {
          'profile.contactDetails': null,
        },
      });
    });
  },
  'click .user-contacts .type-selector a': function (e, t) {
    e.preventDefault();
    const modifier = {};
    modifier[`profile.contactDetails.${$(e.currentTarget).attr('data-index')}.type`] = $(e.currentTarget).text();
    Meteor.users.update({
      _id: FlowRouter.getParam('_id'),
    }, {
      $set: modifier,
    }, UltiSite.userFeedbackFunction('Kontaktinfo speichern'));
  },
  'click .user-contacts .btn-add-contact': function (e, t) {
    e.preventDefault();
    Meteor.users.update({
      _id: FlowRouter.getParam('_id'),
    }, {
      $push: {
        'profile.contactDetails': {
          type: '',
          detail: '',
        },
      },
    });
  },
  'click .action-remove-role': function (evt) {
    evt.preventDefault();
    Roles.removeUsersFromRoles(FlowRouter.getParam('_id'), this.name);
  },
  'click .action-add-role': function (evt) {
    evt.preventDefault();
    Roles.addUsersToRoles(FlowRouter.getParam('_id'), this.name);
  },
  'click .action-immediate': function (evt) {
    evt.preventDefault();
    const user = Meteor.users.findOne(FlowRouter.getParam('_id'));
    const toSet = {};
    toSet[`settings.email.${this.type}`] = 'immediate';
    if (user.settings && user.settings.email && user.settings.email[this.type] === 'immediate') { toSet[`settings.email.${this.type}`] = null; }
    Meteor.users.update(user._id, { $set: toSet }, UltiSite.userFeedbackFunction(`Mail Bencharichtigung für ${this.name} setzen`));
  },
  'click .action-digest': function (e) {
    e.preventDefault();
    Meteor.users.update(FlowRouter.getParam('_id'), { $set: { 'settings.noDigestMail': false } }, UltiSite.userFeedbackFunction('Tägliche Mail Bencharichtigung aktivieren'));
  },
  'click .action-no-digest': function (e) {
    e.preventDefault();
    Meteor.users.update(FlowRouter.getParam('_id'), { $set: { 'settings.noDigestMail': true } }, UltiSite.userFeedbackFunction('Tägliche Mail Bencharichtigung deaktivieren'));
  },
  'change .user-contacts .opt-editable-field': function (e, t) {
    const modifier = {};
    let value = $(e.currentTarget).val();
    if (t.$(e.currentTarget).attr('data-type') === 'Adresse') {
      value = {
        street: value.split(',')[0],
        postcode: value.split(',')[1],
        city: value.split(',')[2],
      };
    }
    modifier[`profile.contactDetails.${t.$(e.currentTarget).attr('data-index')}.detail`] = value;
    const userId = FlowRouter.getParam('_id');
    Meteor.users.update({
      _id: userId,
    }, {
      $set: modifier,
    }, UltiSite.userFeedbackFunction('Wert speichern', e.currentTarget, () => {
      if (name === 'username') {
        Meteor.call('correctParticipants', userId);
      }
    }));
  },
  'click .user-base .dropdown-select-item': function (e, t) {
    e.preventDefault();
    const value = t.$(e.currentTarget).attr('data-value');
    const name = t.$(e.currentTarget).attr('data-name');
    const type = t.$(e.currentTarget).attr('data-type');
    const toSet = {};
    if (type && (type === 'boolean')) {
      toSet[name] = !!value;
    } else if (type && (type === 'number')) { toSet[name] = Number(value); } else { toSet[name] = value; }
    Meteor.users.update({
      _id: FlowRouter.getParam('_id'),
    }, {
      $set: toSet,
    }, UltiSite.userFeedbackFunction('Wert speichern', e.currentTarget.parentNode));
  },
  'change .dfv-select': function (evt, tmpl) {
    evt.preventDefault();
    const value = tmpl.$(evt.currentTarget).val();
    const userId = FlowRouter.getParam('_id');
    const update = {};
    if (value) {
      update.$addToSet = { 'club.dfv': moment().year() };
    } else {
      update.$pull = { 'club.dfv': moment().year() };
    }
    Meteor.users.update({
      _id: userId,
    }, update, UltiSite.userFeedbackFunction('Wert speichern', evt.currentTarget.parentNode));
  },
  'change .user-base .opt-editable-field,.user-base .radio-select': function (e, t) {
    const value = t.$(e.currentTarget).val();
    const name = $(e.currentTarget).attr('name');
    const type = $(e.currentTarget).attr('data-type');
    const toSet = {};
    if (type && (type === 'boolean')) {
      toSet[name] = !!value;
    } else if (type && (type === 'number')) {
      toSet[name] = Number(value);
    } else if (type && (type === 'date')) {
      toSet[name] = moment(value, 'DD.MM.YYYY');
    } else { toSet[name] = value; }
    const userId = FlowRouter.getParam('_id');

    Meteor.users.update({
      _id: userId,
    }, {
      $set: toSet,
    }, UltiSite.userFeedbackFunction('Wert speichern', e.currentTarget.parentNode, () => {
      if (name === 'profile.sex') {
        Meteor.call('correctParticipants', userId);
      }
    }));
  },
  'click .action-check-notification-permissions': function (e, t) {
    if (!('Notification' in window)) { console.log('This browser does not support desktop notification'); }
    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== 'denied') {
      Notification.requestPermission(function (permission) {
        console.log(`Requested permission to show notifications:${permission}`);
        UltiSite.notifyUser('Hinweis', 'Die Seite ist jetzt geladen');
      });
    }
  },
});


Template.userCreateDialog.onCreated(function () {
});
Template.userCreateDialog.events({
  'click button[type="submit"]': function (evt) {
  },
});

Template.userCreateDialog.helpers({
  setupNeeded() {
    return Template.instance().data && Template.instance().data.setupNeeded;
  },
  userSchema() {
    if (Meteor.userId() || (UltiSite.settings().siteRegistration !== 'password')) { return UltiSite.schemas.user.get(); }
    return UltiSite.schemas.userRegister.get();
  },
});

AutoForm.hooks({
  userAddForm: {
    onSuccess() {
      $('.modal').modal('hide');
      AutoForm.resetForm('userAddForm');
      UltiSite.notify('Eine E-Mail wurde verschickt, prüfe deinen Posteingang');
    },
    onError(formType, err) {
      console.log(formType, err);
      if (err.error === 'duplicate-email') { AutoForm.addStickyValidationError('userAddForm', 'email', err.reason); }
      if (err.error === 'wrong-password') { AutoForm.addStickyValidationError('userAddForm', 'sitePassword', err.reason); }
      if (err.error === 'duplicate-username') { AutoForm.addStickyValidationError('userAddForm', 'alias', err.reason); }
    },
  },
});
