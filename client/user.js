import { AutoForm } from 'meteor/ultisite:autoform';

Meteor.startup(function () {
    Meteor.subscribe('UserDetails');
});

var userHelper = {
    user: function () {
        return Meteor.users.findOne(FlowRouter.getParam('_id'));
    },
    getAlias: function () {
        return this.username;
    },
    sexIcon: function () {
        return this.profile ? this.profile.sex === 'W' ? "fa-female" : "fa-male" : "fa-user";
    },
    isEditable: function () {
        if (Roles.userIsInRole(Meteor.userId(), ['admin']))
            return true;
        if (Meteor.userId() === FlowRouter.getParam('_id'))
            return true;
        return false;
    },
    imagesWithUser: function () {
        return UltiSite.Images.find({
            associated: this._id
        });
    },
    contactDetails: function () {
        if (!this.profile.contactDetails)
            return [];
        return this.profile.contactDetails.map(function (elem, idx) {
            return _.extend({
                index: idx
            }, elem);
        });
    },
    email: function () {
        return this.emails[0];
    },
    userRoles: function () {
        var self = this;
        if (UltiSite.isAdmin(Meteor.userId()))
            return Roles.getAllRoles().map(function (r) {
                return {
                    name: r.name,
                    active: Roles.userIsInRole(self, r.name)
                };
            });
        else
            return self.roles.map(function (r) {
                return {
                    name: r,
                    active: true
                };
            });
    },
    notificationsStatus: function () {
        return ("Notification" in window) ? Notification.permission : 'unsupported';
    },
    emailNotificationTypes: function () {
        let mls = [];
        if (UltiSite.settings())
            mls = UltiSite.settings().mailingListConfigs.map((mc) => {
                return { type: mc.from.toCamelCase(), name: 'Mailingliste ' + mc.from };
            });
        return mls.concat([
            { type: 'wiki', name: 'Wiki' },
            { type: 'tournament', name: 'Turnier' },
            { type: 'team', name: 'Team' },
            { type: 'blog', name: 'Artikel' },
            { type: 'files', name: 'Dokumente/Bilder' }
        ]);
    },
    isMailType: function (status) {
        var user = Meteor.users.findOne(FlowRouter.getParam('_id'));
        return user.settings && user.settings.email && (user.settings.email[this.type] === status);
    },
    hasStatistics: function () {
        if (UltiSite.Statistics.find({
            target: this._id
        }).count() > 0)
            return true;
        return false;
    },
    plannedTournaments: function () {
        return (UltiSite.Statistics.findOne({
            target: this._id,
            type: "plannedTournaments"
        }) || { data: [] }).data;
    },
    playedTournamentYears: function () {
        var years = {};
        var unsure = 0;
        var total = 0;
        var data = (UltiSite.Statistics.findOne({
            target: this._id,
            type: "playedTournaments"
        }, {
                sort: {
                    'data.date': -1
                }
            }) || {
                data: []
            }).data;
        data.forEach(function (elem) {
            var m = moment(elem.date);
            if (m.isValid()) {
                if (elem.unsure)
                    unsure++;
                total++;
                var year = m.format("YYYY");
                if (!years[year])
                    years[year] = [];
                years[year].push(elem);
            } else console.log("Invalid statistics:", elem);

        });
        return {
            count: total - unsure,
            total: total,
            years: Object.keys(years).map(function (year) {
                return {
                    t: years[year],
                    y: year
                };
            }).reverse()
        };
    },
    top10Players: function () {
        return (UltiSite.Statistics.findOne({
            target: this._id,
            type: "top10Players"
        }) || { data: [] }).data;
    }
    // TODO: add statistics, like top 10 cities
};
Template.userdisplay.helpers(userHelper);
Template.user.helpers(userHelper);
Template.userItem.helpers(userHelper);

Template.user.onCreated(function () {
    var template = this;
    this.autorun(function () {
        template.subscribe('UserDetails', FlowRouter.getParam('_id'));
        template.subscribe('Statistics', FlowRouter.getParam('_id'));
        template.subscribe('Files', [FlowRouter.getParam('_id')]);
    });
});

Template.user.events({
    'click .btn-edit-image': function (e, t) {
        e.preventDefault();
        const userId = FlowRouter.getParam('_id');
        UltiSite.fileBrowserShowDialog(userId, function (file) {
            if (file)
                UltiSite.Images.update(file._id, {
                    $addToSet: {
                        associated: userId,
                        tags: 'Mitglieder'
                    }
                });
            Meteor.users.update(userId, { $set: { 'profile.avatar': file && file._id } });
            UltiSite.fileBrowserHideDialog();
        });
    },
    'click .user-contacts .btn-remove': function (e, t) {
        e.preventDefault();
        UltiSite.confirmDialog("Wollen sie den Eintrag wirklich löschen?", () => {
            var modifier = {};

            modifier["profile.contactDetails." + $(e.currentTarget).attr('data-index')] = null;
            Meteor.users.update({
                _id: FlowRouter.getParam('_id')
            }, {
                    $set: modifier
                });

            Meteor.users.update({
                _id: FlowRouter.getParam('_id')
            }, {
                    $pull: {
                        "profile.contactDetails": null
                    }
                });
        });
    },
    'click .user-contacts .type-selector a': function (e, t) {
        e.preventDefault();
        var modifier = {};
        modifier["profile.contactDetails." + $(e.currentTarget).attr('data-index') + ".type"] = $(e.currentTarget).text();
        Meteor.users.update({
            _id: FlowRouter.getParam('_id')
        }, {
                $set: modifier
            }, UltiSite.userFeedbackFunction('Kontaktinfo speichern'));
    },
    'click .user-contacts .btn-add-contact': function (e, t) {
        e.preventDefault();
        Meteor.users.update({
            _id: FlowRouter.getParam('_id')
        }, {
                $push: {
                    "profile.contactDetails": {
                        type: "",
                        detail: ""
                    }
                }
            });
    },
    'click .action-remove-role': function (e) {
        e.preventDefault();
        Roles.removeUsersFromRoles(FlowRouter.getParam('_id'), this.name);
    },
    'click .action-add-role': function (e) {
        e.preventDefault();
        Roles.addUsersToRoles(FlowRouter.getParam('_id'), this.name);
    },
    'click .action-immediate': function (e) {
        e.preventDefault();
        var user = Meteor.users.findOne(FlowRouter.getParam('_id'));
        var toSet = {};
        toSet['settings.email.' + this.type] = 'immediate';
        if (user.settings && user.settings.email && user.settings.email[this.type] === 'immediate')
            toSet['settings.email.' + this.type] = null;
        Meteor.users.update(user._id, { $set: toSet }, UltiSite.userFeedbackFunction('Mail Bencharichtigung für ' + this.name + ' setzen'));
    },
    'click .action-digest': function (e) {
        e.preventDefault();
        Meteor.users.update(FlowRouter.getParam('_id'), { $set: { 'settings.noDigestMail': false } }, UltiSite.userFeedbackFunction('Tägliche Mail Bencharichtigung aktivieren'));
    },
    'click .action-no-digest': function (e) {
        e.preventDefault();
        Meteor.users.update(FlowRouter.getParam('_id'), { $set: { 'settings.noDigestMail': true } }, UltiSite.userFeedbackFunction('Tägliche Mail Bencharichtigung deaktivieren'));
    },
    'change .user-contacts .opt-editable-field': function (e, t) {
        var modifier = {};
        var value = $(e.currentTarget).val();
        if (t.$(e.currentTarget).attr('data-type') === "Adresse")
            value = {
                street: value.split(",")[0],
                postcode: value.split(",")[1],
                city: value.split(",")[2]
            };
        modifier["profile.contactDetails." + t.$(e.currentTarget).attr('data-index') + ".detail"] = value;
        var userId = FlowRouter.getParam('_id');
        Meteor.users.update({
            _id: userId
        }, {
                $set: modifier
            }, UltiSite.userFeedbackFunction('Wert speichern', e.currentTarget, () => {
                if (name === 'username')
                    Meteor.call('correctParticipants', userId);
            }));
    },
    'click .user-base .dropdown-select-item': function (e, t) {
        e.preventDefault();
        var value = t.$(e.currentTarget).attr("data-value");
        var name = t.$(e.currentTarget).attr("data-name");
        var type = t.$(e.currentTarget).attr("data-type");
        var toSet = {};
        if (type && (type === "boolean"))
            toSet[name] = !!value;
        else if (type && (type === "number"))
            toSet[name] = Number(value);
        else
            toSet[name] = value;
        Meteor.users.update({
            _id: FlowRouter.getParam('_id')
        }, {
                $set: toSet
            }, UltiSite.userFeedbackFunction('Wert speichern', e.currentTarget.parentNode));
    },
    'change .user-base .opt-editable-field,.user-base .radio-select': function (e, t) {
        var value = t.$(e.currentTarget).val();
        var name = $(e.currentTarget).attr("name");
        var type = $(e.currentTarget).attr("data-type");
        var toSet = {};
        if (type && (type === "boolean"))
            toSet[name] = !!value;
        else if (type && (type === "number"))
            toSet[name] = Number(value);
        else
            toSet[name] = value;
        var userId = FlowRouter.getParam('_id');

        Meteor.users.update({
            _id: userId
        }, {
                $set: toSet
            }, UltiSite.userFeedbackFunction('Wert speichern', e.currentTarget.parentNode, () => {
                if (name === 'profile.sex')
                    Meteor.call('correctParticipants', userId);
            }));
    },
    'click .action-check-notification-permissions': function (e, t) {
        if (!("Notification" in window))
            console.log("This browser does not support desktop notification");
        // Otherwise, we need to ask the user for permission
        else if (Notification.permission !== 'denied') {
            Notification.requestPermission(function (permission) {
                console.log('Requested permission to show notifications:' + permission);
                UltiSite.notifyUser('Hinweis', 'Die Seite ist jetzt geladen');
            });
        }

    }
});

Template.userCreateDialog.onCreated(function () {
    var self = this;
    self.setupNeeded = new ReactiveVar(false);
    Meteor.call('setupNeeded', function (err, res) {
        if (res) {
            self.setupNeeded.set(true);
        }
    });
    this.autorun(function () {
        if (self.setupNeeded.get())
            UltiSite.showModal('userCreateDialog');
    });
});
Template.userCreateDialog.events({
    'click button[type="submit"]': function (evt) {
    }
});

Template.userCreateDialog.helpers({
    setupNeeded: function () {
        return Template.instance().setupNeeded.get();
    },
    userSchema: function () {
        if (Meteor.userId() || (UltiSite.settings().siteRegistration !== "password"))
            return UltiSite.schemas.user.get();
        else
            return UltiSite.schemas.userRegister.get();
    }
});

AutoForm.hooks({
    userAddForm: {
        onSuccess: function () {
            $('.modal').modal('hide');
            AutoForm.resetForm("userAddForm");
            UltiSite.notify('Eine E-Mail wurde verschickt, prüfe deinen Posteingang');
        },
        onError: function (formType, err) {
            console.log(formType, err);
            if (err.error === 'duplicate-email')
                AutoForm.addStickyValidationError('userAddForm', "email", err.reason);
            if (err.error === 'wrong-password')
                AutoForm.addStickyValidationError('userAddForm', "sitePassword", err.reason);
            if (err.error === 'duplicate-username')
                AutoForm.addStickyValidationError('userAddForm', "alias", err.reason);

        }
    }
});