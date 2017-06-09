import './practiceView.html';
import './practice.less';

const mapImageUrl = new ReactiveVar();

Template.practices.onCreated(function () {
  this.subscribe('Practices');
});

Template.practices.helpers({
  clubPractices: function () {
    return UltiSite.Practices.find({}, {
      sort: {
        weekday: 1,
        start: 1,
        club: -1,
        hostingTeam: 1
      }
    });
  }
});

Template.practice.helpers({
  formatedDuration() {
    if (this.duration === 60)
      return 'eine Stunde';
    if (this.duration % 60 === 0)
      return (this.duration / 60) + ' Stunden';
    if (this.duration === 90)
      return '1,5 Stunden';
    if (this.duration === 30)
      return 'eine halbe Stunde';
    if (this.duration === 150)
      return '2,5 Stunden';
    return this.duration + ' Minuten';
  }
});

Template.practice.events({
  'click .action-edit': function (evt, tmpl) {
    UltiSite.showModal('practiceDialog', this);
  }
});

Template.practice.onCreated(function () {
  if (this.data.mapImage)
    mapImageUrl.set('/_image?imageId=' + this.data.mapImage);
});
