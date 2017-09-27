import { AutoForm } from 'meteor/ultisite:autoform';

FlowRouter.route('/hat/:_id?/:confirmed?', {
  name: "hatinfo",
  action () {
    UltiSite.baseLayoutData.set({
      content: "hatInfos",
    });
  },
});

FlowRouter.route('/hat_confirm/:accessKey?', {
  name: "hatinfoConfirm",
  triggersEnter: [function (context, redirect) {
    const accessKey = context.params.accessKey;
    if (accessKey) { Meteor.call('hatConfirmParticipant', accessKey); }
    redirect(`/hat/${accessKey}/confirmed`);
  }],
});

Meteor.startup(function () {
  UltiSite.registerAdminPageTemplate('hatInfoSettings', 'HAT Anmeldung');
});


Template.hatInfoSettings.helpers({
  wikiPages () {
    return Session.get("wikiPageNames");
  },
  wikiPageName (id) {
    let name = "";
    if (Session.get("wikiPageNames")) {
      Session.get("wikiPageNames").forEach(function (page) {
        if (page._id == id) { name = page.name; }
      });
    }
    return name;
  },
});

Template.hatInfos.onCreated(function () {
  this.limit = new ReactiveVar(25);
  this.filter = new ReactiveVar('');
  this.autorun(() => {
    this.subscribe('hatParticipant', FlowRouter.getParam('_id'));
    this.subscribe('hatParticipants', this.limit.get(), this.filter.get());
  });
});
function hatSort() {
  const sort = {};
  if (UltiSite.settings().hatSort) { sort[UltiSite.settings().hatSort] = 1; }
  sort.createdAt = 1;
  return sort;
}

Template.hatInfos.helpers({
  allParticipants() {
    if (Template.instance().filter.get()) {
      return UltiSite.HatInfo.HatParticipants.find({
        $or: [
                    { name: new RegExp(Template.instance().filter.get(), 'i') },
                    { email: new RegExp(Template.instance().filter.get(), 'i') },
   ],
      }, { sort: hatSort() });
    }
    return UltiSite.HatInfo.HatParticipants.find({}, { sort: hatSort() });
  },
  activeFilter() {
    return !!Template.instance().filter.get();
  },
  hatParticipants() {
    return UltiSite.HatInfo.HatParticipants.find({}, { sort: hatSort(), limit: Number(UltiSite.settings().hatNumPlayers) });
  },
  hatWaiting() {
    return UltiSite.HatInfo.HatParticipants.find({}, { sort: hatSort(), skip: Number(UltiSite.settings().hatNumPlayers) });
  },
  payedParticipants() {
    return UltiSite.HatInfo.HatParticipants.find({}, { sort: hatSort(), limit: Number(UltiSite.settings().hatNumPlayers) }).fetch().filter(p => moment(p.payed).isBefore(moment())).length;
  },
  payedWaiting() {
    return UltiSite.HatInfo.HatParticipants.find({}, { sort: hatSort(), skip: Number(UltiSite.settings().hatNumPlayers) }).fetch().filter(p => moment(p.payed).isBefore(moment())).length;
  },
  emails() {
    return UltiSite.HatInfo.HatParticipants.find().map(p => p.email).join(',');
  },
  emailsParticipate() {
    return UltiSite.HatInfo.HatParticipants.find({}, { sort: hatSort(), limit: Number(UltiSite.settings().hatNumPlayers) }).map(p => p.email).join(',');
  },
  emailsWaiting() {
    return UltiSite.HatInfo.HatParticipants.find({}, { sort: hatSort(), skip: Number(UltiSite.settings().hatNumPlayers) }).map(p => p.email).join(',');
  },
  activeEntry() {
    if (FlowRouter.getParam('_id')) { return UltiSite.HatInfo.HatParticipants.findOne({ accessKey: FlowRouter.getParam('_id') }); }
  },
});

Template.hatParticipant.helpers({
  strengthPercent () {
    return (Number(this.strength) + 1) * 10;
  },
  accessKey () {
    return FlowRouter.getParam('_id');
  },
  hasPayed() {
    return moment(this.payed).isBefore(moment());
  },
  activeEntry() {
    return this.accessKey && this.accessKey === FlowRouter.getParam('_id');
  },
});
Template.hatParticipant.events({
  'click .action-remove' (evt) {
    evt.preventDefault();
    UltiSite.confirmDialog(`Willst du ${this.name} wirklich austragen?`, () => {
      Meteor.call('hatRemoveParticipation', this.accessKey, UltiSite.userFeedbackFunction("Vom HAT austragen"));
      FlowRouter.go("hatinfo");
    });
  },
  'click .action-participate' (evt) {
    evt.preventDefault();
    UltiSite.showModal('hatParticipateDialog', this);
  },
  'click .action-payed' (evt) {
    evt.preventDefault();
    Meteor.call('hatParticipationPayed', this.accessKey, UltiSite.userFeedbackFunction("Zahlungsstatus ändern", evt.currentTarget));
  },
});

Template.hatInfos.events({
  'keyup .participant-filter' (evt, tmpl) {
    tmpl.filter.set(tmpl.$(evt.currentTarget).val());
  },
  'click .action-participate' (evt) {
    evt.preventDefault();
    UltiSite.showModal('hatParticipateDialog');
  },
  'click .participant-entry' (evt) {
    evt.preventDefault();
    if (FlowRouter.getParam('_id') === this.accessKey) { FlowRouter.go('hatinfo'); } else { FlowRouter.go('hatinfo', { _id: this.accessKey }); }
  },
});

Template.hatParticipateDialog.helpers({
  existing() {
    if (FlowRouter.getParam('_id')) {
      return UltiSite.HatInfo.HatParticipants.findOne({ accessKey: FlowRouter.getParam('_id') }); 
}
  },
  schema() {
    return UltiSite.HatInfo.schema;
  },
  error() {
    return Session.get('hatParticipateError');
  },
  method() {
    if (FlowRouter.getParam('_id')) {
      return 'hatUpdateParticipation'; 
}
    return 'hatParticipate';
  },
});

AutoForm.hooks({
  hatParticipantForm: {
    onSuccess (formType, result) {
      console.log(result);
      UltiSite.hideModal();
      if (result !== 'updated') {
        UltiSite.showModal('hatParticipateDialogSuccess');
      }
    },
    onError (formType, error) {
      console.log('hatParticipantForm:', error);
      UltiSite.hideModal();
      Session.set('hatParticipateError', error.message);
      UltiSite.showModal('hatParticipateDialogError');
    },
  },
});
