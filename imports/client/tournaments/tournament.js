import { AutoForm } from 'meteor/ultisite:autoform';
import './tournament.less';
import './tournament.html';
import './team.js';
import '../forms/address.js';
import '../files/files.js';

Template.tournament.onCreated(function () {
  this.bodyVisible = new ReactiveVar(!Meteor.user());

  this.autorun(() => {
    if (FlowRouter.getRouteName() === 'tournament') {
      this.subscribe('tournamentDetails', FlowRouter.getParam('_id'), (err) => {
      });
    }
  });

  this.autorun(() => {
    const t = UltiSite.getTournament(FlowRouter.getParam('_id'));
    if (!t) { return; }

    const from = moment(t.date).clone().subtract(1, 'days').toDate();
    const to = moment(t.date).clone().add(t.numDays + 1, 'days').toDate();
    this.subscribe('Tournaments', null, {
      date: {
        $gte: from,
        $lte: to,
      },
    });

    if (((!t.teams) || (t.teams.length === 0)) && this.bodyVisible.get() === null) { this.bodyVisible.set(true); }
  });
});


Template.tournament.events({
  'click .action-add-team': function (e) {
    e.preventDefault();
    UltiSite.showModal('teamUpdate', { tournamentId: this._id });
  },
  'click .action-edit-tournament': function (e) {
    e.preventDefault();
    UltiSite.showModal('tournamentUpdate', { tournament: this, type: 'update' });
  },

  'click .action-participate': function (e) {
    e.preventDefault();
    UltiSite.showModal('participateDialog', this);
  },
  'click .preview-content': function (e) {
    $(e.currentTarget).toggleClass('active');
  },
  'click .toggle-tournament-body': function (e, t) {
    t.bodyVisible.set(!t.bodyVisible.get());
  },
  'click .tournament-remove': function (e) {
    e.preventDefault();
    UltiSite.confirmDialog('Willst du das Turnier wirklich löschen?', () => {
      UltiSite.Tournaments.remove(FlowRouter.getParam('_id'), UltiSite.userFeedbackFunction('Turnier löschen'));
      UltiSite.offlineRemoveTournament(FlowRouter.getParam('_id'));
      FlowRouter.go('tournaments');
    });
  },
  'click .action-show-files': function (e) {
    e.preventDefault();
    UltiSite.fileBrowserShowDialog(FlowRouter.getParam('_id'));
  },
  'click .action-add-infos': function (e) {
    e.preventDefault();
    UltiSite.getHTMLTextDialog({ content: '' }, function (text) {
      UltiSite.Tournaments.update({
        _id: FlowRouter.getParam('_id'),
      }, {
        $set: {
            lastChange: new Date(),
          },
        $push: {
            description: {
              $each: [{
                _id: Random.id(),
                content: text,
                date: new Date(),
                editor: Meteor.userId(),
              }],
              $position: 0,
            },
          },
      });
    });
  },
  'click .action-edit-infos': function (e) {
    e.preventDefault();
    const self = this;
    UltiSite.getHTMLTextDialog({ content: self.content }, function (text) {
      Meteor.call('tournamentUpdateInfos', FlowRouter.getParam('_id'), self._id, text);
    });
  },
  'click .action-remove-infos': function (e, t) {
    UltiSite.confirmDialog('Sollen diese Informationen endgültig gelöscht werden?', () => {
      UltiSite.Tournaments.update({
        _id: FlowRouter.getParam('_id'),
      }, {
        $set: {
            lastChange: new Date(),
          },
        $pull: {
            description: {
              _id: this._id,
            },
          },
      });
    });
  },
  'click .action-edit-report': function (e) {
    e.preventDefault();
    const self = this;
    UltiSite.getHTMLTextDialog({ content: self.content }, function (text) {
      Meteor.call('tournamentUpdateReport', FlowRouter.getParam('_id'), self._id, text);
    });
  },
  'click .action-remove-report': function (e, t) {
    const id = t.$(e.currentTarget).attr('data-id');
    UltiSite.confirmDialog('Soll dieser Bericht endgültig gelöscht werden?', () => {
      UltiSite.Tournaments.update({
        _id: FlowRouter.getParam('_id'),
      }, {
        $set: {
            lastChange: new Date(),
          },
        $pull: {
            reports: {
              _id: id,
            },
          },
      });
    });
  },
  'click .action-add-report': function (e) {
    e.preventDefault();
    UltiSite.getHTMLTextDialog({ content: '' }, function (text) {
      Meteor.call('tournamentAddReport', FlowRouter.getParam('_id'), {
        _id: Random.id(),
        content: text,
        date: new Date(),
        editor: Meteor.userId(),
      });
    });
  },

});

Template.tournamentUpdate.helpers({
  tournamentSchema() {
    return UltiSite.schemas.tournament.get();
  },
});


Template.tournament.helpers({
  parallelTournaments() {
    const from = moment(this.date).clone().subtract(2, 'days').toDate();
    const to = moment(this.date).clone().add(this.numDays + 1, 'days').toDate();
    return UltiSite.Tournaments.find({
      _id: {
        $not: this._id,
      },
      date: {
        $gte: from,
        $lte: to,
      },
    }, {
      fields: {
          _id: 1,
          name: 1,
        },
    });
  },
  over() {
    const t = UltiSite.getTournament(FlowRouter.getParam('_id'));

    if (t && moment(t.date).isBefore(moment(), 'day')) { return true; }
    return false;
  },
  mapsLink() {
    return `https://www.google.de/maps/@${this.address.geocoords.split(',').reverse().join(',')},11z`;
  },
  tournament() {
    if (!FlowRouter.getParam('_id')) { return; }
    return UltiSite.getTournament(FlowRouter.getParam('_id'));
  },
  tournamentBodyVisible() {
    return Template.instance().bodyVisible.get();
  },
  noDescription() {
    return (this.description == undefined) || this.description.isEmpty;
  },
  saveDescription() {
    const self = this;
    const tournamentId = FlowRouter.getParam('_id');
    return function (newContent, finished) {
      UltiSite.Tournaments.update({
        _id: tournamentId,
      }, {
        $set: {
            lastChange: new Date(),
          },
        $pull: {
            description: {
              _id: self._id,
            },
          },
      });
      UltiSite.Tournaments.update({
        _id: tournamentId,
      }, {
        $set: {
            lastChange: new Date(),
          },
        $push: {
            description: {
              $each: [{
                _id: self._id,
                content: newContent.trim(),
                date: self.date,
                editDate: new Date(),
                editor: Meteor.userId(),
              }],
              $position: 0,
            },
          },

      },
        finished);
    };
  },
  saveReport() {
    const self = this;
    const tournamentId = FlowRouter.getParam('_id');
    return function (newContent, finished) {
      UltiSite.Tournaments.update({
        _id: tournamentId,
      }, {
        $pull: {
            reports: {
              _id: self._id,
            },
          },
      });
      UltiSite.Tournaments.update({
        _id: tournamentId,
      }, {
        $set: {
            lastChange: new Date(),
          },
        $push: {
            reports: {
              $each: [{
                _id: self._id,
                content: newContent.trim(),
                date: self.date,
                editDate: new Date(),
                editor: Meteor.userId(),
              }],
              $position: 0,
            },
          },

      },
        finished);
    };
  },
  isEmpty() {
    if (this.content.length === 0) { return true; }
    return false;
  },
  fileCount() {
    return UltiSite.Images.find({
      associated: FlowRouter.getParam('_id'),
    }).count() + UltiSite.Documents.find({
      associated: FlowRouter.getParam('_id'),
    }).count();
  },
  myContent() {
    return !!Meteor.userId();
  },
  address() {
    const t = UltiSite.getTournament(FlowRouter.getParam('_id')) || {};
    return t.address;
  },
  contact() {
    const t = UltiSite.getTournament(FlowRouter.getParam('_id')) || {};
    let address = {};
    if (t.contactDetails) {
      t.contactDetails.forEach(function (elem) {
        if (elem.type == 'email') { address = elem; }
      });
    }
    return address;
  },
  teamObjects() {
    const teams = this.teams || [];

    return teams.map((team) => {
      return _.extend({
        participants: this.participants.filter(p => p.team === team._id),
        stateColor: UltiSite.stateColor(team.state),
      }, team);
    });
  },
});

AutoForm.hooks({
  tournamentUpdateForm: {
    // Called when any submit operation succeeds
    onSuccess(formType, result) {
      console.log('tournamentUpdateForm success');
      UltiSite.hideModal();
      if (formType === 'insert') {
        FlowRouter.go('tournament', {
          _id: result,
        });
      }
    },
    // Called when any submit operation fails
    onError(formType, error) {
      console.log('tournamentUpdateForm:', error);
      if (formType === 'insert') { UltiSite.notify(`Fehler beim Turnier anlegen:${error.message}`, 'error'); } else { UltiSite.notify(`Fehler beim Turnier ändern:${error.message}`, 'error'); }
    },
  },
});

Template.tournamentUpdate.events({
  'shown.bs.modal #tournamentUpdateDialog': function (e, t) {
    t.visible.set(true);
  },
  'hide.bs.modal #tournamentUpdateDialog': function (e, t) {
    // t.visible.set(false);
  },
});
Template.tournamentUpdate.helpers({
  isVisible() {
    return false;// Template.instance().visible.get();
  },
});
Template.tournamentUpdate.onCreated(function () {
  this.visible = new ReactiveVar(false);
});
