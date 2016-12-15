
var visiblePractice = new ReactiveVar();

Meteor.startup(function () {
    UltiSite.maps = {};
    Tracker.autorun(function(){
       Meteor.subscribe('Practices'); 
    });
});

Template.practice.created = function () {
    this.subscribe(this.data._id);
    this.subscribe("WikiPage", UltiSite.Settings.findOne({}).wikiPractice);
};

Template.practiceEdit.onCreated(function () {});


Template.practiceEdit.helpers({
    mapImage: function () {
        return UltiSite.Images.findOne({
            associated: this._id
        });
    },
    mapClickCallback:function() {
        var template = Template.instance();
        return function(geocoords) {
            template.$('input[name="geocoords"]').val(geocoords);
        };
    },
    mapCaptureCallback: function() {
        var self=this;
        return function(canvas) {
            UltiSite.Images.find({
                associated: self._id
            }).forEach(function (img) {
                img.remove();
            });

            const fsFile = {};
            fsFile.base64 = canvas.toDataURL('image/jpg', 0.5);
            fsFile.associated = [self._id];
            fsFile.name = "practice-" + self._id;
            fsFile.tags = ['Karte', 'Training'];
            fsFile.creator = Meteor.userId();
            UltiSite.Images.insert(fsFile, function (err) {
                if (err) console.log(err);
                else console.log("saved image");
            });
        };
    },
    showState: function () {
        return this.showOnPage;
    },
    weekdayText: function () {
        console.log(this);
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
    },
    visiblePractice: function () {
        return visiblePractice.get();
    }

});

Template.practiceEdit.events({
    'click .action-open-practice': function (e, t) {
        visiblePractice.set(t.data._id);
    },
    'submit form': function (e, t) {
        e.preventDefault();
        var data = t.$(e.currentTarget).serializeObject();
        data.start = moment(data.start + " " + data.startTime, "YYYY-MM-DD HH:mm").toDate();
        data.end = moment(data.end + " " + data.endTime, "YYYY-MM-DD HH:mm").toDate();
        data.endTime = undefined;
        data.startTime = undefined;
        if (!data.geocoords)
            data.geocoords = UltiSite.settings().stadt_geocoords;
        console.log(data);
        UltiSite.Practices.update({
            _id: this._id
        }, {
            $set: data
        });
    },
    'click .btn-remove-practice': function () {
        UltiSite.Practices.remove({
            _id: this._id
        });
    },
    'click .btn-show-here': function (e, t) {
        e.preventDefault();
        console.log("switch");
        if ($(e.currentTarget).hasClass("btn-success"))
            UltiSite.Practices.update({
                _id: t.data._id
            }, {
                showOnPage: false
            });
        else
            UltiSite.Practices.update({
                _id: t.data._id
            }, {
                showOnPage: true
            });
    },
    'click .btn-search-address': function () {},
    'click .btn-cpature-image': function (e, t) {
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
Template.practicesEditing.helpers({
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
Template.practicesEditing.events({
    'click .btn-add-practice': function () {
        UltiSite.Practices.insert({
            hostingTeam: "",
            start: new Date(),
            city: UltiSite.settings().stadt,
            geocoords: UltiSite.settings().stadt_geocoords,
            end: moment().add(90, "Days").toDate()
        });
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
    mapImage: function () {
        var i = UltiSite.Images.findOne({
            associated: this._id
        });
        console.log("Image:" + i);
        return i;
    },
    weekdayText: function () {
        console.log(this);
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

