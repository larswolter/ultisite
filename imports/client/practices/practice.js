
import { AutoForm } from 'meteor/ultisite:autoform';
import '../forms/address.js';
import '../files/files.js';
import './practice.less';
import './practice.html';

let mapImageFile;
const mapImageUrl = new ReactiveVar();

Meteor.startup(function () {
  UltiSite.maps = {};
});


Template.practiceDialog.events({
  'click .action-clear-image': function (evt, tmpl) {
    evt.preventDefault();
    tmpl.$('input[name="imageMapCenter"]').val('');
    tmpl.$('input[name="imageMapZoom"]').val('');
    mapImageUrl.set(undefined);
    mapImageFile = undefined;
  }
});
Template.practiceDialog.helpers({
  practiceSchema() {
    return UltiSite.schemas.practice.get();
  },
  getGeocoords() {
    return AutoForm.getFieldValue('address.geocoords', 'practiceDialogForm');
  },
  mapImage() {
    if (mapImageUrl.get())
      return mapImageUrl.get();
  },
  mapCaptureCallback: function () {
    var template = Template.instance();
    return function (canvas, map) {
      template.$('input[name="imageMapCenter"]').val(map.getView().getCenter());
      template.$('input[name="imageMapZoom"]').val(map.getView().getZoom());
      canvas.toBlob((blob) => {
        mapImageFile = blob;
      }, 'image/png');
      mapImageUrl.set(canvas.toDataURL('image/jpeg',0.75));
    };
  },
});

AutoForm.hooks({
  practiceDialogForm: {
        // Called when any submit operation succeeds
    onSubmit: function (insertDoc, updateDoc, currentDoc) {
      const id = currentDoc && currentDoc._id;
      Meteor.call('updatePractice', id, id ? updateDoc : insertDoc, (err, res) => {
        if (mapImageFile) {
          const fsFile = {
              file: mapImageFile,
              metadata: {
                  _meteorCall: 'updatePracticeImage',
                  associated: [res],
                  tags: ['Karte', 'Training'],
                  creator: Meteor.userId(),
                  name: "Trainingskarte.png",
                  type: 'image/jpg'
                }
            };
          UltiSite.pushToUploadQueue(fsFile);
          UltiSite.triggerUpload();
        }
        if (err)
          UltiSite.notify('Fehler beim Speichern des Trainings:' + err.message, "error");
        else
                    UltiSite.hideModal();
      });
      return false;
    },
  }
});

Template.practicesDetailed.onCreated(function () {
  this.subscribe('Practices');
});

Template.practicesDetailed.helpers({
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

Template.practicesDetailed.events({
  'click .action-new': function (evt, tmpl) {
    UltiSite.showModal('practiceDialog');
  }
});

Template.practiceCalendar.helpers({
  practices: function (selWeekday) {
    return UltiSite.Practices.find({
      weekday: selWeekday
    });
  },
  selPractice: function () {
    return UltiSite.Practices.findOne(Session.get("clickedPractice"));
  }
});

Template.practiceSmall.helpers({
  practiceTime: function () {
    return moment(this.start).format("HH:mm");
  }
});

Template.practiceSmall.events({
  'click .btn': function (e) {
    Session.set("clickedPractice", $(e.currentTarget).data("id"));
    $('#practice-dialog').modal('show');
  }
});


Template.practice.helpers({
  weekdayText: function () {
    switch (Number(this.weekday)) {
    case 0:
      return "Sonntags";
    case 1:
      return "Montags";
    case 2:
      return "Dienstags";
    case 3:
      return "Mittwochs";
    case 4:
      return "Donnerstags";
    case 5:
      return "Freitags";
    case 6:
      return "Samstags";
    default:
      return "Nulltag";
    }
  }
});

