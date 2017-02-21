
let mapImageFile;
const mapImageUrl = new ReactiveVar();

Meteor.startup(function () {
    UltiSite.maps = {};
    Tracker.autorun(function(){
       Meteor.subscribe('Practices'); 
    });
});

Template.practice.created = function () {
};

Template.practice.helpers ({
    formatedDuration() {
        if(this.duration === 60)
            return 'eine Stunde';
        if(this.duration % 60 === 0)
            return (this.duration/60) + ' Stunden';
        if(this.duration === 90)
            return '1,5 Stunden';
        if(this.duration === 30)
            return 'eine halbe Stunde';
        if(this.duration === 150)
            return '2,5 Stunden';
        return this.duration + ' Minuten';
    }
});

Template.practice.events ({
    'click .action-edit': function(evt, tmpl) {
        UltiSite.showModal('practiceDialog', this);
    }
});

Template.practice.onCreated(function () {
    if(this.data.mapImage)
        mapImageUrl.set('/_image?imageId='+this.data.mapImage);
});

Template.practiceDialog.events({
    'click .action-clear-image': function(evt, tmpl) {
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
    mapClickCallback:function() {
        var template = Template.instance();
        return function(geocoords) {
            template.$('input[name="geocoords"]').val(geocoords);
        };
    },
    getGeocoords() {
        return AutoForm.getFieldValue('address.geocoords');
    },
    mapImage() {
        if(mapImageUrl.get())
            return mapImageUrl.get();
    },
    mapCaptureCallback: function() {
        var template = Template.instance();
        return function(canvas, map) {
            template.$('input[name="imageMapCenter"]').val(map.getView().getCenter());
            template.$('input[name="imageMapZoom"]').val(map.getView().getZoom());
            canvas.toBlob((blob)=>{
                mapImageFile = blob;
            },'image/png');
            mapImageUrl.set(canvas.toDataURL());
        };
    },
});

AutoForm.hooks({
    practiceDialogForm: {
        // Called when any submit operation succeeds
        onSubmit: function (insertDoc, updateDoc, currentDoc) {
            const id = currentDoc && currentDoc._id;
            Meteor.call('updatePractice',id, id?updateDoc:insertDoc, (err, res) => {
                if(mapImageFile) {
                    const fsFile = {
                        file: mapImageFile, 
                        metadata : {
                            _meteorCall: 'updatePracticeImage',
                            associated : [res],
                            tags : ['Karte', 'Training'],
                            creator : Meteor.userId(),
                            name : "Trainingskarte.png",
                            type : 'image/jpg'
                        }
                    };                
                    UltiSite.pushToUploadQueue(fsFile);
                    UltiSite.triggerUpload();
                }
                this.done(err);
            });
            return false;
        },
        onSuccess: function () {
            UltiSite.hideModal();
        },
        // Called when any submit operation fails
        onError: function (formType, error) {
            UltiSite.notify('Fehler beim SPeichern des Trainings:' + error.message, "error");
        }
    }
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
    'click .action-new': function(evt, tmpl) {
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

