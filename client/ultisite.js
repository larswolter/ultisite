
UltiSite.screenSize = new ReactiveVar(window.innerWidth);

Meteor.startup(function () {
    window.onresize = function () {
        UltiSite.screenSize.set(window.innerWidth);
    };
});
Template.baseLayout.helpers({
    dialogTemplates() {
        return UltiSite.dialogTemplates.find();
    }
});

Template.offlineInfo.helpers({
    nextTry() {
        return moment.duration(Meteor.status().retryTime - (new Date()).getTime()).humanize(true);
    }
});

Template.baseLayout.events({
    'click .content-overlay': function (e) {
        e.preventDefault();
        e.stopPropagation();
        UltiSite.toggleSidebar(false);
    },
    'scroll .content-overlay': function (e) {
        e.preventDefault();
        e.stopPropagation();
    },
    'click .action-reconnect': function (e) {
        e.preventDefault();
        e.stopPropagation();
        Meteor.reconnect();
    },
});

_.extend(UltiSite, {
    impersonateUser: function(username) {
        var u = Meteor.users.findOne({username:username});
        console.log('impersonating '+u.username);
        Meteor.connection.setUserId(u._id);        
    },
    toggleSidebar: function (override) {
        if (override === true) {
            $('.navbar-header').addClass('open-sidebar');
            $('.navigation-area').addClass('active');
            $('.content-overlay').fadeIn(200);
        } else if (override === false) {
            $('.navbar-header').removeClass('open-sidebar');
            $('.navigation-area').removeClass('active');
            $('.content-overlay').fadeOut(200);
        } else {
            $('.navbar-header').toggleClass('open-sidebar');
            $('.navigation-area').toggleClass('active');
            $('.content-overlay').fadeToggle(200);
        }
        if ($('.navigation-area').hasClass('active')) {}

    },
    startPageTemplates: new Meteor.Collection(null),
    adminPageTemplates: new Meteor.Collection(null),
    dialogTemplates: new Meteor.Collection(null),
    registerDialogTemplate: function (template) {
        this.dialogTemplates.insert({
            _id: template,
            template: template,
        });
    },
    registerStartPageTemplate: function (template, name) {
        this.startPageTemplates.insert({
            _id: template,
            template: template,
            name: name
        });
    },
    registerAdminPageTemplate: function (template, name) {
        this.adminPageTemplates.insert({
            _id: template,
            template: template,
            name: name
        });
    },
    userFeedbackFunction: function (text, element, successCallback) {
        if (!text)
            text = "Aktion";
        return function (err) {
            if (err) {
                UltiSite.notify(text + " fehlgeschlagen:" + err, "error");
            } else {
                UltiSite.notify(text + " erfolgreich", "success");
                if (successCallback)
                    successCallback();
            }
        };
    },
    notifyUser: function (title, text, options) {
        if (("Notification" in window) && Notification.permission === 'granted') {
            new Notification(title, _.extend({
                body: text
            }, options));
        }
    },
});