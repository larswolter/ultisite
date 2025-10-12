import { moment } from 'meteor/momentjs:moment';
import './practiceView.html';
import './practice.less';

const mapImageUrl = new ReactiveVar();

Template.practices.onCreated(function () {
  this.subscribe('Practices');
});

Template.practices.helpers({
  clubPractices() {
    return UltiSite.Practices.find(
      {},
      {
        sort: {
          weekday: 1,
          start: 1,
          club: -1,
          hostingTeam: 1,
        },
      }
    );
  },
});

Template.practice.helpers({
  hideHostingTeam() {
    return _.uniq(UltiSite.Practices.find({}).map((x) => x.hostingTeam)).length === 1;
  },
  formatedDuration() {
    if (this.duration === 60) {
      return 'eine Stunde';
    }
    if (this.duration % 60 === 0) {
      return `${this.duration / 60} Stunden`;
    }
    if (this.duration === 90) {
      return '1,5 Stunden';
    }
    if (this.duration === 30) {
      return 'eine halbe Stunde';
    }
    if (this.duration === 150) {
      return '2,5 Stunden';
    }
    return `${this.duration} Minuten`;
  },
  planned() {
    const planned = _.find(
      this.planned || [],
      (p) => p.day === moment().format('DD.MM.') || p.day === moment().add(1, 'day').format('DD.MM.')
    );
    if (planned && planned.yes > 3) {
      return planned;
    }
    return undefined;
  },
  weekdayText() {
    switch (Number(this.weekday)) {
      case 0:
        return 'Sonntags';
      case 1:
        return 'Montags';
      case 2:
        return 'Dienstags';
      case 3:
        return 'Mittwochs';
      case 4:
        return 'Donnerstags';
      case 5:
        return 'Freitags';
      case 6:
        return 'Samstags';
      default:
        return 'Nulltag';
    }
  },
});

Template.practice.events({
  'click .action-edit': function () {
    UltiSite.showModal('practiceDialog', this);
  },
  'click .action-delete': function () {
    UltiSite.confirmDialog('Willst du wirklich das Training löschen?', () => {
      Meteor.call('removePractice', this._id);
    });
  },
});

Template.practice.onCreated(function () {
  if (this.data.mapImage) {
    mapImageUrl.set(`/_image?imageId=${this.data.mapImage}`);
  }
});
