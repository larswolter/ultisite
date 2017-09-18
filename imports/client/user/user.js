import { AutoForm } from 'meteor/ultisite:autoform';
import './user.less';
import './user.html';
import './userlist.html';

Meteor.startup(function () {
  Meteor.subscribe('UserDetails');
});

const userHelper = {
  user () {
    return Meteor.users.findOne(FlowRouter.getParam('_id'));
  },
  getAlias () {
    return this.username;
  },
  sexIcon () {
    return this.profile ? this.profile.sex === 'W' ? "fa-female" : "fa-male" : "fa-user";
  },
  isEditable () {
    if (Roles.userIsInRole(Meteor.userId(), ['admin']))          { return true; }
    if (Meteor.userId() === FlowRouter.getParam('_id'))          { return true; }
    return false;
  },
  imagesWithUser () {
    return UltiSite.Images.find({
      associated: this._id,
    });
  },
  contactDetails () {
    if (!this.profile.contactDetails)          { return []; }
    return this.profile.contactDetails.map(function (elem, idx) {
      return _.extend({
            index: idx,
          }, elem);
    });
  },
  email () {
    return this.emails[0];
  },
  userRoles () {
    let self = this;
    if (UltiSite.isAdmin(Meteor.userId()))
          {return Roles.getAllRoles().map(function (r) {
                return {
                    name: r.name,
                    active: Roles.userIsInRole(self, r.name)
                };
            });}
    return self.roles.map(function (r) {
          return {
                  name: r,
                  active: true,
                };
        });
  },
  notificationsStatus () {
    return ("Notification" in window) ? Notification.permission : 'unsupported';
  },
  emailNotificationTypes () {
    let mls = [];
    if (UltiSite.settings())          { mls = UltiSite.settings().mailingListConfigs.map((mc) => ({ type: mc.from.toCamelCase(), name: 'Mailingliste ' + mc.from }));
 }
    return mls.concat([
            { type: 'wiki', name: 'Wiki' },
            { type: 'tournament', name: 'Turnier' },
            { type: 'team', name: 'Team' },
            { type: 'blog', name: 'Artikel' },
            { type: 'files', name: 'Dokumente/Bilder' },
    ]);
  },
  isMailType (status) {
    const user = Meteor.users.findOne(FlowRouter.getParam('_id'));
    return user.settings && user.settings.email && (user.settings.email[this.type] === status);
  },
  hasStatistics () {
    if (UltiSite.Statistics.find({
      target: this._id,
    }).count() > 0)          { return true; }
    return false;
  },
  plannedTournaments () {
    return (UltiSite.Statistics.findOne({
      target: this._id,
      type: "plannedTournaments",
    }) || { data: [] }).data;
  },
  playedTournamentYears () {
    const years = {};
    let unsure = 0;
    let total = 0;
    const data = (UltiSite.Statistics.findOne({
      target: this._id,
      type: "playedTournaments",
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
            if (elem.unsure)                  { unsure++; }
            total++;
            const year = m.format("YYYY");
            if (!years[year])                  { years[year] = []; }
            years[year].push(elem);
          } else console.log("Invalid statistics:", elem);
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
  top10Players () {
    return (UltiSite.Statistics.findOne({
      target: this._id,
      type: "top10Players",
    }) || { data: [] }).data;
  },
    // TODO: add statistics, like top 10 cities
};
Template.userdisplay.helpers(userHelper);
Template.user.helpers(userHelper);
Template.userItem.helpers(userHelper);

Template.user.onCreated(function () {
  const template = this;
  this.autorun(function () {
    template.subscribe('UserDetails', FlowRouter.getParam('_id'));
    template.subscribe('Statistics', FlowRouter.getParam('_id'));
    template.subscribe('Files', [FlowRouter.getParam('_id')]);
  });
});

Template.user.events({
  'click .action-edit-email'(e, t) {
    UltiSite.getTextDialog({ text: this.address, header: 'Neue E-Mail eingeben' }, (newAddress) => {
      const userId = FlowRouter.getParam('_id');
      Meteor.call('userUpdateEmail', userId, this.address, newAddress, (err) => {
            if (err)                  { UltiSite.notify('Konnte E-Mail nicht ändern nicht speicher', 'error'); }
          });
    });
  },
  'click .btn-edit-image' (e, t) {
    e.preventDefault();
    const userId = FlowRouter.getParam('_id');
    UltiSite.fileBrowserShowDialog(userId, function (file) {
      if (file)              { UltiSite.Images.update(file._id, {
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
  'click .user-contacts .btn-remove' (e, t) {
    e.preventDefault();
    UltiSite.confirmDialog("Wollen sie den Eintrag wirklich löschen?", () => {
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
                "profile.contactDetails": null,
              },
            });
    });
  },
  'click .user-contacts .type-selector a' (e, t) {
    e.preventDefault();
    const modifier = {};
    modifier[`profile.contactDetails.${$(e.currentTarget).attr('data-index')}.type`] = $(e.currentTarget).text();
    Meteor.users.update({
      _id: FlowRouter.getParam('_id'),
    }, {
          $set: modifier,
        }, UltiSite.userFeedbackFunction('Kontaktinfo speichern'));
  },
  'click .user-contacts .btn-add-contact' (e, t) {
    e.preventDefault();
    Meteor.users.update({
      _id: FlowRouter.getParam('_id'),
    }, {
          $push: {
            "profile.contactDetails": {
                    type: "",
                    detail: "",
                  },
          },
        });
  },
  'click .action-remove-role' (e) {
    e.preventDefault();
    Roles.removeUsersFromRoles(FlowRouter.getParam('_id'), this.name);
  },
  'click .action-add-role' (e) {
    e.preventDefault();
    Roles.addUsersToRoles(FlowRouter.getParam('_id'), this.name);
  },
  'click .action-immediate' (e) {
    e.preventDefault();
    const user = Meteor.users.findOne(FlowRouter.getParam('_id'));
    const toSet = {};
    toSet[`settings.email.${ this.type}`] = 'immediate';
    if (user.settings && user.settings.email && user.settings.email[this.type] === 'immediate')          { toSet[`settings.email.${  this.type}`] = null; }
    Meteor.users.update(user._id, { $set: toSet }, UltiSite.userFeedbackFunction(`Mail Bencharichtigung für ${this.name } setzen`));
  },
  'click .action-digest' (e) {
    e.preventDefault();
    Meteor.users.update(FlowRouter.getParam('_id'), { $set: { 'settings.noDigestMail': false } }, UltiSite.userFeedbackFunction('Tägliche Mail Bencharichtigung aktivieren'));
  },
  'click .action-no-digest' (e) {
    e.preventDefault();
    Meteor.users.update(FlowRouter.getParam('_id'), { $set: { 'settings.noDigestMail': true } }, UltiSite.userFeedbackFunction('Tägliche Mail Bencharichtigung deaktivieren'));
  },
  'change .user-contacts .opt-editable-field' (e, t) {
    const modifier = {};
    let value = $(e.currentTarget).val();
    if (t.$(e.currentTarget).attr('data-type') === "Adresse")
          {
 value = {
            street: value.split(",")[0],
            postcode: value.split(",")[1],
            city: value.split(",")[2],
          };
 }
    modifier[`profile.contactDetails.${ t.$(e.currentTarget).attr('data-index') }.detail`] = value;
    const userId = FlowRouter.getParam('_id');
    Meteor.users.update({
      _id: userId,
    }, {
          $set: modifier,
        }, UltiSite.userFeedbackFunction('Wert speichern', e.currentTarget, () => {
          if (name === 'username')                  { Meteor.call('correctParticipants', userId); }
        }));
  },
  'click .user-base .dropdown-select-item' (e, t) {
    e.preventDefault();
    const value = t.$(e.currentTarget).attr("data-value");
    const name = t.$(e.currentTarget).attr("data-name");
    const type = t.$(e.currentTarget).attr("data-type");
    const toSet = {};
    if (type && (type === "boolean"))          { toSet[name] = !!value; }    else if (type && (type === "number"))          { toSet[name] = Number(value); }    else            { toSet[name] = value; }
    Meteor.users.update({
      _id: FlowRouter.getParam('_id'),
    }, {
          $set: toSet,
        }, UltiSite.userFeedbackFunction('Wert speichern', e.currentTarget.parentNode));
  },
  'change .user-base .opt-editable-field,.user-base .radio-select' (e, t) {
    const value = t.$(e.currentTarget).val();
    const name = $(e.currentTarget).attr("name");
    const type = $(e.currentTarget).attr("data-type");
    const toSet = {};
    if (type && (type === "boolean"))          { toSet[name] = !!value; }    else if (type && (type === "number"))          { toSet[name] = Number(value); }    else if (type && (type === "date"))          { toSet[name] = moment(value, 'DD.MM.YYYY'); }    else            { toSet[name] = value; }
    const userId = FlowRouter.getParam('_id');

    Meteor.users.update({
      _id: userId,
    }, {
          $set: toSet,
        }, UltiSite.userFeedbackFunction('Wert speichern', e.currentTarget.parentNode, () => {
          if (name === 'profile.sex')                  { Meteor.call('correctParticipants', userId); }
        }));
  },
  'click .action-check-notification-permissions' (e, t) {
    if (!("Notification" in window))          { console.log("This browser does not support desktop notification"); }
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
  const self = this;
  self.setupNeeded = new ReactiveVar(false);
  Meteor.call('setupNeeded', function (err, res) {
    if (res) {
      self.setupNeeded.set(true);
    }
  });
  this.autorun(function () {
    if (self.setupNeeded.get()) { UltiSite.showModal('userCreateDialog'); }
  });
});
Template.userCreateDialog.events({
  'click button[type="submit"]' (evt) {
  },
});

Template.userCreateDialog.helpers({
  setupNeeded () {
    return Template.instance().setupNeeded.get();
  },
  userSchema () {
    if (Meteor.userId() || (UltiSite.settings().siteRegistration !== "password"))
          {return UltiSite.schemas.user.get();}
    return UltiSite.schemas.userRegister.get();
  },
});

AutoForm.hooks({
  userAddForm: {
    onSuccess () {
      $('.modal').modal('hide');
      AutoForm.resetForm("userAddForm");
      UltiSite.notify('Eine E-Mail wurde verschickt, prüfe deinen Posteingang');
    },
    onError (formType, err) {
      console.log(formType, err);
      if (err.error === 'duplicate-email')              { AutoForm.addStickyValidationError('userAddForm', "email", err.reason); }
      if (err.error === 'wrong-password')              { AutoForm.addStickyValidationError('userAddForm', "sitePassword", err.reason); }
      if (err.error === 'duplicate-username')              { AutoForm.addStickyValidationError('userAddForm', "alias", err.reason); }
    },
  },
});