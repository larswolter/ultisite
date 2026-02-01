import { moment } from 'meteor/momentjs:moment';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { AutoForm } from 'meteor/ultisite:autoform';
import './team.html';
import './team.less';
import { participantList, stateColor } from '../../../common/teams';

Template.participant.events({
  'click .action-participate': function (evt, tmpl) {
    evt.preventDefault();
    evt.stopPropagation();
    const partValue = Number(tmpl.$(evt.currentTarget).attr('data-participation'));
    const teamId = Template.parentData()._id;
    Meteor.call('participationUpdate', teamId, this.user, partValue);
  },
  'click .action-remove': function (evt, tmpl) {
    evt.preventDefault();
    evt.stopPropagation();
    const teamId = Template.parentData()._id;
    UltiSite.confirmDialog('Willst du wirklich den Spieler löschen?', () => {
      Meteor.call('participationRemove', teamId, this.user);
    });
  },
  'click button.action-comment': function (evt, tmpl) {
    evt.preventDefault();
    const self = this;
    const teamId = Template.parentData()._id;
    UltiSite.getTextDialog({ text: self.comment, header: 'Kommentar eingeben' }, function (comment) {
      Meteor.call('participationComment', teamId, self.user, comment, function (err) {
        if (err) {
          UltiSite.notify('Konnte Kommentar nicht speicher', 'error');
        }
      });
    });
  },
  'keyup input.comment': function (evt, tmpl) {
    tmpl.$('button.comment').removeClass('disabled');
  },
});

Template.team.onCreated(function () {
  const self = this;
  self.searchTerm = new ReactiveVar('');
  self.inviteOther = new ReactiveVar(false);
  this.teamEmails = new ReactiveVar();
  this.autorun(() => {
    if (this.data.participants) {
      Meteor.call(
        'retrieveEmails',
        this.data.participants.filter((p) => p.state > 0).map((p) => p.user),
        (err, res) => {
          this.teamEmails.set(res);
        }
      );
    }
  });
});
Template.team.onRendered(function () {
  if (this.find('#team-participants')) {
    this.find('#team-participants')._uihooks = {
      moveElement(node, next) {
        const $node = $(node);
        $node.hide({
          complete() {
            $node.insertBefore(next);
            $(node).show(400);
          },
        });
      },
    };
  }
});

Template.team.events({
  'click .action-historic-view': function (evt) {
    evt.preventDefault();
    UltiSite.showModal('teamHistoricView', { team: this });
  },
  'click .action-participate': function (evt) {
    evt.preventDefault();
    UltiSite.showModal('participateDialog', { teamId: this._id });
  },
  'click .action-edit-team': function (evt) {
    evt.preventDefault();
    const tournamentId = UltiSite.getTournamentByTeam(this._id)._id;
    UltiSite.showModal('teamUpdate', { tournamentId, teamId: this._id });
  },
  'click .action-edit-remarks': function (evt, tmpl) {
    UltiSite.getHTMLTextDialog({ content: this.remarks, header: 'Anmerkungen zum Team bearbeiten' }, (text) => {
      Meteor.call('teamUpdateRemarks', this._id, text);
    });
  },
  'click .team-remove': function (evt, tmpl) {
    evt.preventDefault();
    UltiSite.confirmDialog('Willst du wirklich das gesamte Team löschen?', () => {
      Meteor.call('teamRemove', this._id, UltiSite.userFeedbackFunction('Team löschen'));
    });
  },
  'click .action-set-state': function (evt, tmpl) {
    evt.preventDefault();
    const state = tmpl.$(evt.currentTarget).attr('data-state');
    if (state === 'dabei') {
      UltiSite.confirmDialog(
        'Sicher, das das Team bestätigt wurde? Jetzt wird auch der Verantwortliche ausgelost!',
        () => {
          Meteor.call('teamUpdateState', this._id, state, UltiSite.userFeedbackFunction('Team Status ändern'));
        }
      );
    } else {
      Meteor.call('teamUpdateState', this._id, state, UltiSite.userFeedbackFunction('Team Status ändern'));
    }
  },
  'click .action-be-responsible': function (evt, tmpl) {
    evt.preventDefault();
    Meteor.call('teamMakeMeResponsible', this._id);
  },
});

Template.participateDialog.onCreated(function () {
  this.selectedUser = new ReactiveVar(undefined);
  this.inserting = new ReactiveVar(false);
  this.dabei = new ReactiveVar();
  this.selectedTeam = new ReactiveVar();
  this.teams = new ReactiveVar([]);
  if (this.data.teamId) {
    const team = UltiSite.getTeam(this.data.teamId);
    this.teams.set([team]);
  } else {
    this.teams.set(this.data.teams);
  }

  if (this.teams.get().length === 1) {
    this.selectedTeam.set(this.teams.get()[0]._id);
  }
  this.autorun(() => {
    const team = UltiSite.getTeam(this.selectedTeam.get());
    if (team) {
      this.dabei.set(_.find(team.participants, (p) => p.userid === Meteor.userId()));
    }
  });
  this.autorun(() => {
    if (this.dabei.get()) {
      this.selectedUser.set(undefined);
    } else {
      this.selectedUser.set(Meteor.user());
    }
  });
});

Template.participateDialog.helpers({
  teams() {
    return Template.instance().teams.get();
  },
  dabei() {
    return Template.instance().dabei.get();
  },
  femaleRequired() {
    const team = UltiSite.getTeam(Template.instance().selectedTeam.get());
    if (!team) {
      return false;
    }
    if (team.minFemale < team.maxPlayers) {
      return false;
    }
    const user = Template.instance().selectedUser.get();
    if (user.sex === 'W') {
      return false;
    }
    return true;
  },
  inviteOther() {
    if (_.find(this.participants, (p) => p.user === Meteor.userId())) {
      return true;
    }
    return Template.instance().inviteOther.get();
  },
  selectedUser() {
    return Template.instance().selectedUser.get();
  },
  selectedTeam() {
    return Template.instance().selectedTeam.get();
  },
  selectUser() {
    const curTemplate = Template.instance();
    return function (elem) {
      if (elem.id) {
        curTemplate.selectedUser.set({ username: elem.name, _id: elem.id, sex: elem.sex });
      } else {
        curTemplate.selectedUser.set({ username: elem.username });
      }
      return true;
    };
  },
  notFound() {
    return function (term) {
      return {
        name: `Das nicht Mitglied ${term} in die Liste eintragen`,
        icon: 'fa-user-plus',
        link: '',
        username: term,
      };
    };
  },
});

Template.participateDialog.events({
  'click .action-switch-invite': function (evt, tmpl) {
    tmpl.inviteOther.set(true);
  },
  'keyup .alias-field': function (evt, tmpl) {
    evt.preventDefault();
    tmpl.$('.user-id').val('');
  },
  'change [name="teamId"]': function (evt, tmpl) {
    tmpl.selectedTeam.set(tmpl.$('[name="teamId"]').val());
  },
  'click .action-insert': function (evt, tmpl) {
    const teamId = tmpl.$('[name="teamId"]').val();
    const comment = tmpl.$('input[name="comment"]').val();
    const state = Number(tmpl.$(evt.currentTarget).data('value'));
    if (state < 100 && state > 0 && !comment) {
      UltiSite.notify('Bitte gib einen Kommentar ein warum du nur vielleicht kannst', 'error');
      return;
    }
    evt.preventDefault();
    const params = {
      state,
      userid: tmpl.selectedUser.get()._id || tmpl.selectedUser.get().username,
      sex: tmpl.$('input[name="female"]')[0] && tmpl.$('input[name="female"]')[0].checked,
      comment,
    };
    tmpl.inserting.set(true);
    console.log('Inserting part:', params);
    Meteor.call(
      'participantInsert',
      params,
      teamId,
      UltiSite.userFeedbackFunction('Spieler eintragen', evt.currentTarget, function () {
        tmpl.$('.user-id').val('');
        tmpl.$('.alias-field').val('');
        $('.modal').modal('hide');
        tmpl.inserting.set(false);
      })
    );
  },
});

Template.teamCountBar.helpers({
  teamCount() {
    let full = 0;
    let half = 0;
    let rest = 0;
    let females = 0;
    if (this.participants) {
      this.participants.forEach(function (participant) {
        if (participant.state > 90) {
          full += 1;
        } else if (participant.state > 50) {
          half += 1;
        } else if (participant.state > 10) {
          rest += 1;
        }
        if (participant.sex === 'W') {
          females += 1;
        }
      });
    }
    if (full + half + rest === 0) {
      return undefined;
    }
    const max = Math.max(this.maxPlayers, full + half + rest);
    if (full > this.maxPlayers) {
      full = this.maxPlayers;
      rest = 0;
      half = 0;
    }
    if (full + half > this.maxPlayers) {
      half = this.maxPlayers - full;
      rest = 0;
    }
    if (full + half + rest > this.maxPlayers) {
      rest = this.maxPlayers - full - half;
    }

    return {
      percentFull: full * (100 / max),
      percentHalf: half * (100 / max),
      percentRest: rest * (100 / max),
      percentOver: (max - this.maxPlayers) * (100 / max),
      over: max - this.maxPlayers,
      full,
      all: full + half,
      half,
      rest,
      spots: this.maxPlayers - full,
      females,
      percentFemales: females * (100 / this.minFemale),
      missingFemales: Math.max(0, this.minFemale - females),
    };
  },
});

Template.team.helpers({
  teamColorState() {
    return stateColor(this.state);
  },
  participantMails() {
    return Template.instance().teamEmails.get();
  },
  notAvailable() {
    return _.filter(this.participants, (p) => p.state === 0).map(function (participant) {
      const user = Meteor.users.findOne(participant.user);
      const partUser = _.extend({}, user, participant);
      return partUser;
    });
  },
  async participantUsers() {
    return await participantList(this._id);
  },
  teamRemovable() {
    if (_.find(this.participants, (p) => p.state === 100)) {
      return false;
    }
    return true;
  },
  saveRemarks() {
    const teamId = this._id;
    return function (text, finished) {
      Meteor.call('teamUpdateRemarks', teamId, text, UltiSite.userFeedbackFunction('Team Anmerkung speichern'));
    };
  },
  currentUserAlias() {
    if (_.find(this.participants, (p) => p.user === Meteor.userId())) {
      return '';
    }
    return Meteor.user().username;
  },
  iamParticipating() {
    if (_.find(this.participants, (p) => p.user === Meteor.userId())) {
      return true;
    }
    return false;
  },
  isMyTeam() {
    if (!Meteor.userId()) {
      return false;
    }
    if (this.clubTeam) {
      return true;
    }
    if (this.responsible === Meteor.userId()) {
      return true;
    }
    if (UltiSite.isAdmin()) {
      return true;
    }
    if (_.find(this.participants, (p) => p.user === Meteor.userId())) {
      return true;
    }
    return false;
  },
  isResponsible() {
    if (!Meteor.userId()) {
      return false;
    }
    if (this.clubTeam) {
      return true;
    }
    if (UltiSite.isAdmin()) {
      return true;
    }
    return this.responsible === Meteor.userId();
  },
});

Template.participant.helpers({
  isWoman() {
    if (this.profile) {
      return this.profile.sex === 'W';
    }
    if (this.sex === 'W') {
      return true;
    }
    return false;
  },
  isUser() {
    return !this.dummy;
  },
  textState() {
    return UltiSite.textState(this.state);
  },
  noChangeRights() {
    if (!Meteor.userId()) {
      return true;
    }
    if (this.user === Meteor.userId()) {
      return false;
    }
    if (UltiSite.isAdmin()) {
      return false;
    }
    if (this.responsible === Meteor.userId()) {
      return false;
    }
    return true;
  },
});

AutoForm.hooks({
  teamUpdateForm: {
    onSubmit(insertDoc, updateDoc, currentDoc, form) {
      console.log('teamUpdateForm onSubmit', insertDoc, updateDoc, currentDoc);
      if (currentDoc && currentDoc._id) {
        updateDoc.$set.lastChange = new Date();
        Meteor.call(
          'teamUpdate',
          currentDoc._id,
          insertDoc,
          UltiSite.userFeedbackFunction('Team editieren', null, () => UltiSite.hideModal())
        );
      } else {
        Meteor.call(
          'addTeam',
          insertDoc,
          form.tournamentId,
          UltiSite.userFeedbackFunction('Team hinzufügen', null, () => UltiSite.hideModal())
        );
      }
    },
  },
});

Template.teamUpdate.onCreated(function () {});

Template.teamUpdate.helpers({
  teamSchema() {
    return UltiSite.schemas.team.get();
  },
  tournamentDivisions() {
    const tournament = UltiSite.getTournamentByTeam(Template.instance().data.teamId);
    console.log(tournament);
    return tournament.divisions || [];
  },
  team() {
    const team = UltiSite.getTeam(Template.instance().data.teamId);
    if (team) {
      return team;
    }
    let division;
    let maxPlayers = 12;
    let minFemale = 0;
    const tmpl = UltiSite.getTournamentByTeam(Template.instance().data.teamId);
    if (tmpl && tmpl.divisions) {
      division = tmpl.divisions[0];
      if (_.contains(tmpl.divisions, 'Mixed')) {
        minFemale = 6;
      }
      if (_.contains(tmpl.divisions, 'Soft Mixed')) {
        minFemale = 4;
      }
      if (_.contains(tmpl.surfaces, 'Sand') || _.contains(tmpl.surfaces, 'Halle')) {
        minFemale -= 1;
        maxPlayers -= 2;
      }
      if (_.find(tmpl.divisions, (d) => d.indexOf('Damen') >= 0)) {
        minFemale = maxPlayers;
      }
    }
    return {
      name: UltiSite.settings().teamname,
      teamType: 'Verein - Auslosung',
      maxPlayers,
      minFemale,
      division,
    };
  },
});

Template.teamUpdate.events({});
Template.teamReport.onCreated(function () {});
Template.teamReport.events({
  'click .action-add-me': function (evt, tmpl) {
    evt.preventDefault();

    const params = {
      state: 100,
      userid: Meteor.userId(),
      alias: UltiSite.getAlias(Meteor.userId()),
      comment: '',
    };
    if (_.find(tmpl.data.participants, (p) => p.user === Meteor.userId())) {
      Meteor.call(
        'participationUpdate',
        tmpl.data._id,
        Meteor.userId(),
        100,
        UltiSite.userFeedbackFunction('Mich hinzufügen', evt.currentTarget)
      );
    } else {
      Meteor.call(
        'participantInsert',
        params,
        tmpl.data._id,
        UltiSite.userFeedbackFunction('Mich hinzufügen', evt.currentTarget)
      );
    }
  },
  'click .action-remove-team': function (evt, tmpl) {
    evt.preventDefault();
    Meteor.call('teamUpdateState', this._id, 'geplant', UltiSite.userFeedbackFunction('Team Status ändern'));
  },
  'click .action-delete-team': function (evt, tmpl) {
    evt.preventDefault();
    UltiSite.confirmDialog('Willst du wirklich das gesamte Team löschen?', () => {
      Meteor.call('teamRemove', this._id, UltiSite.userFeedbackFunction('Team löschen'));
    });
  },
  'click .action-add-team': function (evt, tmpl) {
    evt.preventDefault();
    Meteor.call('teamUpdateState', this._id, 'dabei', UltiSite.userFeedbackFunction('Team Status ändern'));
  },
  'click .action-remove-me': function (evt, tmpl) {
    evt.preventDefault();
    const params = {
      userid: Meteor.userId(),
    };
    Meteor.call(
      'participantRemove',
      params,
      tmpl.data._id,
      UltiSite.userFeedbackFunction('Mich entfernen', evt.currentTarget)
    );
  },
  'click .action-show-team-image': function (evt) {
    evt.preventDefault();
    const tournament = UltiSite.getTournamentByTeam(this._id);
    FlowRouter.go('image', {
      _id: this.image,
      associated: tournament._id,
    });
  },
  'click .action-team-image': function (evt) {
    const teamId = this._id;
    const tournament = UltiSite.getTournamentByTeam(this._id);
    UltiSite.fileBrowserShowDialog(tournament._id, function (file) {
      if (file) {
        UltiSite.Images.update(file._id, {
          $addToSet: {
            associated: teamId,
            tags: 'Teamfoto',
          },
        });
      } else {
        const img = UltiSite.Images.findOne({
          associated: teamId,
        });
        UltiSite.Images.update(img._id, {
          $pull: {
            associated: teamId,
          },
        });
      }

      Meteor.call('teamUpdateImage', teamId, file && file._id, UltiSite.userFeedbackFunction('Team Bild ändern'));
      UltiSite.fileBrowserHideDialog();
    });
  },
  'change .team-report .form-control': function (evt, tmpl) {
    const value = tmpl.$(evt.currentTarget).val();
    const name = $(evt.currentTarget).attr('name');
    Meteor.call('teamUpdateResults', this._id, name, value, UltiSite.userFeedbackFunction('Speichern der Ergebnisse'));
  },
});

Template.teamReport.helpers({
  myTeamState() {
    return !!_.find(this.participants, (p) => p.user === Meteor.userId() && p.state === 100);
  },
  teamRemovable() {
    if (_.find(this.participants, (p) => p.state === 100)) {
      return false;
    }
    return true;
  },
  noChangeRights() {
    if (!Meteor.userId()) {
      return true;
    }
    if (_.find(this.participants, (p) => p.user === Meteor.userId())) {
      return false;
    }
    if (UltiSite.isAdmin()) {
      return false;
    }
    if (this.responsible === Meteor.userId()) {
      return false;
    }
    return true;
  },
  selectUser() {
    const teamId = this._id;
    return function (elem) {
      const params = {
        state: 100,
        userid: elem.id,
        alias: elem.name,
        sex: elem.female ? 'W' : 'M',
        comment: '',
      };
      Meteor.call('participantInsert', params, teamId);
      return true;
    };
  },
});

Template.teamHistoricView.helpers({
  participants() {
    return Template.instance().data.team.participants;
  },
  marks() {
    const team = Template.instance().data.team;
    if (!team) {
      return [];
    }
    const earlyReg = _.sortBy(team.participants, 'entryDate');
    const turnier = UltiSite.getTournamentByTeam(team._id);
    let start = moment();
    if (earlyReg.length > 0) {
      start = moment(earlyReg[0].entryDate);
    }

    const ende = moment(turnier.date);
    const drawing = moment(team.drawingDate);
    const diff = 100.0 / start.diff(ende, 'minutes') || 1;
    const marks = [
      {
        stateClass: 'mark-left',
        width: 25,
        offset: 0,
        text: start.format('DD.MM HH:mm'),
      },
    ];
    if (team.drawingDate) {
      const offset = start.diff(drawing, 'minutes') * diff;
      marks.push({
        stateClass: offset < 60 ? 'mark-left' : 'mark-right',
        width: 30,
        offset: offset >= 60 ? offset - 30 : offset,
        text: 'Auslosung',
      });
    }
    marks.push({
      stateClass: 'mark-right',
      width: 25,
      offset: 75,
      text: ende.format('DD.MM HH:mm'),
    });
    return marks;
  },
  historicBlocks() {
    const team = Template.instance().data.team;
    if (!team) {
      return [];
    }
    const earlyReg = _.sortBy(team.participants, 'entryDate');
    const turnier = UltiSite.getTournamentByTeam(team._id);
    let start = moment();
    if (earlyReg.length > 0) {
      start = moment(earlyReg[0].entryDate);
    }
    const ende = moment(turnier.date);
    const diff = 100.0 / start.diff(ende, 'minutes');
    const entryDate = moment(this.entryDate).clone();
    let last = entryDate.clone();
    const results =
      (this.history &&
        this.history.map(function (block) {
          const width = last.diff(moment(block.until).clone(), 'minutes');
          const startOffset = start.diff(entryDate, 'minutes');
          last = moment(block.until).clone();
          return {
            stateClass: ` ${
              block.state < 10
                ? 'bg-muted'
                : block.state < 70
                ? 'bg-danger'
                : block.state < 100
                ? 'bg-warning'
                : 'bg-success'
            }`,
            width: width * diff,
            offset: startOffset * diff,
          };
        })) ||
      [];
    const width = last.diff(ende, 'minutes');
    const offset = start.diff(last, 'minutes');
    results.push({
      stateClass: ` ${
        this.state < 10 ? 'bg-muted' : this.state < 70 ? 'bg-danger' : this.state < 100 ? 'bg-warning' : 'bg-success'
      }`,
      width: width * diff,
      offset: offset * diff,
    });
    return results;
  },
});
