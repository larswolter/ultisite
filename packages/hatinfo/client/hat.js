import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { moment } from 'meteor/momentjs:moment';
import { AutoForm } from 'meteor/ultisite:autoform';

const activeEntry = new ReactiveVar();

FlowRouter.route('/hat/:_id?/:confirmed?', {
  name: 'hatinfo',
  action() {
    UltiSite.baseLayoutData.set({
      content: 'hatInfos',
    });
  },
});

FlowRouter.route('/hat_confirm/:accessKey?', {
  name: 'hatinfoConfirm',
  triggersEnter: [
    function (context, redirect) {
      const { accessKey } = context.params;
      if (accessKey) {
        Meteor.call('hatConfirmParticipant', accessKey);
        activeEntry.set(accessKey);
      }
      redirect('/hat');
    },
  ],
});

Meteor.startup(function () {
  UltiSite.registerAdminPageTemplate('hatInfoSettings', 'HAT Anmeldung');
});

Template.hatInfoSettings.helpers({
  wikiPages() {
    return UltiSite.State.get('wikiPageNames');
  },
  wikiPageName(id) {
    let name = '';
    if (UltiSite.State.get('wikiPageNames')) {
      UltiSite.State.get('wikiPageNames').forEach(function (page) {
        if (page._id === id) {
          name = page.name;
        }
      });
    }
    return name;
  },
});

Template.hatInfos.onCreated(function () {
  this.limit = new ReactiveVar(25);
  this.filter = new ReactiveVar('');
  this.autorun(() => {
    activeEntry.get() && this.subscribe('hatParticipant', activeEntry.get());
  });
  this.autorun(() => {
    this.subscribe('hatParticipants', this.limit.get(), this.filter.get());
  });
});
function hatSort() {
  const sort = {};
  if (UltiSite.settings().hatSort) {
    sort[UltiSite.settings().hatSort] = 1;
  }
  sort.createdAt = 1;
  return sort;
}

Template.hatInfos.helpers({
  allParticipants() {
    if (Template.instance().filter.get()) {
      return UltiSite.HatInfo.HatParticipants.find(
        {
          $or: [
            { name: new RegExp(Template.instance().filter.get(), 'i') },
            { email: new RegExp(Template.instance().filter.get(), 'i') },
          ],
        },
        { sort: hatSort() }
      );
    }
    return UltiSite.HatInfo.HatParticipants.find({}, { sort: hatSort() });
  },
  spotsAvailable() {
    return Math.max(
      0,
      UltiSite.settings().hatNumPlayers -
        UltiSite.HatInfo.HatParticipants.find({ confirmed: true, payed: { $lte: new Date() } }).count()
    );
  },
  activeFilter() {
    return !!Template.instance().filter.get();
  },
  stats() {
    const stats = {};
    UltiSite.HatInfo.HatParticipants.find(
      { confirmed: true, payed: { $lte: new Date() } },
      { sort: hatSort(), limit: Number(UltiSite.settings().hatNumPlayers) }
    ).forEach((part) => {
      ['tested', 'sleepFriday', 'sleepSaturday', 'breakfastSaturday', 'breakfastSunday'].forEach((val) => {
        if (part[val]) stats[val] = (stats[val] || 0) + 1;
      });
    });
    return stats;
  },
  hatParticipants() {
    return UltiSite.HatInfo.HatParticipants.find(
      { confirmed: true, payed: { $lte: new Date() } },
      { sort: hatSort(), limit: Number(UltiSite.settings().hatNumPlayers) }
    );
  },
  hatWaiting() {
    return UltiSite.HatInfo.HatParticipants.find(
      { confirmed: true, payed: { $lte: new Date() } },
      { sort: hatSort(), skip: Number(UltiSite.settings().hatNumPlayers) }
    );
  },
  hatNotPaid() {
    return UltiSite.HatInfo.HatParticipants.find(
      { $or: [{ payed: { $gt: new Date() } }, { confirmed: { $ne: true } }] },
      { sort: hatSort() }
    );
  },
  emails() {
    return UltiSite.HatInfo.HatParticipants.find()
      .map((p) => p.email)
      .join(',');
  },
  emailsParticipate() {
    return UltiSite.HatInfo.HatParticipants.find(
      { confirmed: true, payed: { $lte: new Date() } },
      { sort: hatSort(), limit: Number(UltiSite.settings().hatNumPlayers) }
    )
      .map((p) => p.email)
      .join(',');
  },
  emailsWaiting() {
    return UltiSite.HatInfo.HatParticipants.find(
      { confirmed: true, payed: { $lte: new Date() } },
      { sort: hatSort(), skip: Number(UltiSite.settings().hatNumPlayers) }
    )
      .map((p) => p.email)
      .join(',');
  },
  myPosition() {
    let pos = -1;
    UltiSite.HatInfo.HatParticipants.find(
      { confirmed: true, payed: { $lte: new Date() } },
      { sort: hatSort() }
    ).forEach((part, idx) => {
      if (part.accessKey === activeEntry.get()) {
        pos = idx;
      }
    });
    if (pos > -1 && pos <= Number(UltiSite.settings().hatNumPlayers)) return `Spielerliste Platz ${pos + 1}`;
    else if (pos > -1) {
      return `Warteliste Platz ${pos - UltiSite.settings().hatNumPlayers + 1}`;
    }
    return 'Noch nicht bezahlt oder E-Mail nicht bestätigt';
  },
  activeEntry() {
    if (activeEntry.get()) {
      return UltiSite.HatInfo.HatParticipants.findOne({ accessKey: activeEntry.get() });
    }
  },
});

Template.hatParticipant.helpers({
  strengthPercent() {
    return Number(this.strength) * 20;
  },
  experiencePercent() {
    return Number(this.experience) * 20;
  },
  fitnessPercent() {
    return Number(this.fitness) * 20;
  },
  accessKey() {
    return activeEntry.get();
  },
  hasPayed() {
    return moment(this.payed).isBefore(moment());
  },
  activeEntry() {
    return this.accessKey && this.accessKey === activeEntry.get();
  },
});
Template.hatParticipant.events({
  'click .action-remove': function (evt) {
    evt.preventDefault();
    UltiSite.confirmDialog(`Willst du ${this.name} wirklich austragen?`, () => {
      Meteor.call('hatRemoveParticipation', this.accessKey, UltiSite.userFeedbackFunction('Vom HAT austragen'));
      FlowRouter.go('hatinfo');
    });
  },
  'click .action-participate': function (evt) {
    evt.preventDefault();
    UltiSite.showModal('hatParticipateDialog', this);
  },
  'click .action-resend-mail': function (evt) {
    evt.preventDefault();
    Meteor.call('hatResendMail', this.accessKey, UltiSite.userFeedbackFunction('Mail verschicken', evt.currentTarget));
  },
  'click .action-payed': function (evt) {
    evt.preventDefault();
    Meteor.call(
      'hatParticipationPayed',
      this.accessKey,
      UltiSite.userFeedbackFunction('Zahlungsstatus ändern', evt.currentTarget)
    );
  },
});

Template.hatInfos.events({
  'keyup .participant-filter': function (evt, tmpl) {
    tmpl.filter.set(tmpl.$(evt.currentTarget).val());
  },
  'click .action-participate': function (evt) {
    evt.preventDefault();
    UltiSite.showModal('hatParticipateDialog');
  },
  'click .participant-entry': function (evt) {
    evt.preventDefault();
    if (activeEntry.get() === this.accessKey) {
      activeEntry.set(undefined);
    } else {
      activeEntry.set(this.accessKey);
    }
  },
});

Template.hatParticipateDialog.helpers({
  existing() {
    if (activeEntry.get()) {
      return UltiSite.HatInfo.HatParticipants.findOne({ accessKey: activeEntry.get() });
    }
  },
  schema() {
    return UltiSite.HatInfo.schema;
  },
  error() {
    return UltiSite.State.get('hatParticipateError');
  },
  method() {
    if (activeEntry.get()) {
      return 'hatUpdateParticipation';
    }
    return 'hatParticipate';
  },
});

Template.hatParticipateDialogError.helpers({
  error() {
    return UltiSite.State.get('hatParticipateError');
  },
});

AutoForm.hooks({
  hatParticipantForm: {
    onSuccess(formType, result) {
      console.log(result);
      UltiSite.hideModal(() => {
        if (result !== 'updated') {
          UltiSite.showModal('hatParticipateDialogSuccess');
        }
      });
    },
    onError(formType, error) {
      console.log('hatParticipantForm:', error);
      UltiSite.hideModal(() => {
        UltiSite.State.set('hatParticipateError', error.message);
        UltiSite.showModal('hatParticipateDialogError');
      });
    },
  },
});
