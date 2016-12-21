
$.notify.addStyle('ultisite', {
    html: "<div>" +
        "<div class='symbol'>" +
        "<span class='fa fa-check text-success'></span>" +
        "<span class='fa fa-exclamation-triangle text-warning'></span>" +
        "<span class='fa fa-close text-danger'></span>" +
        "<span class='fa fa-exclamation-circle text-info'></span>" +
        "</div>" +
        "<span data-notify-text/>" +
        "</div>"
});
$.notify.defaults({
    autoHide: true,
    autoHideDelay: 4000,
    showAnimation: "fadeIn",
    hideAnimation: "fadeOut",
    hideDuration: 300,
    showDuration: 300,
    style: "ultisite"
});

UltiSite.screenSize = new ReactiveVar(window.innerWidth);

Meteor.startup(function () {

    Tracker.autorun(function () {
        console.log("doing initial subscriptions for ");
        Meteor.subscribe("AdminNotifications");
    });

    window.onresize = function () {
        UltiSite.screenSize.set(window.innerWidth);
    };

    $( window ).scroll(()=> {
        const imgHeight = Number(UltiSite.settings().titleImageHeight || 150);
        if (UltiSite.screenSize.get() >= 768) {
            const titleHeight = Math.max(0,imgHeight - $(window).scrollTop());
            $('.page-content').css('padding-top',imgHeight + 90);
            $('.title-image').css('height',titleHeight);
        }
        else {
            $('.page-content').css('padding-top',60);
            $('.title-image').css('height',0);
        }
    });
    Tracker.autorun(()=>{
        const imgHeight = Number(UltiSite.settings().titleImageHeight || 150);
        if (UltiSite.screenSize.get() >= 768) {
            const titleHeight = Math.max(0,imgHeight - $(window).scrollTop());
            $('.page-content').css('padding-top', imgHeight+ 90);
            $('.title-image').css('height',titleHeight);
        }
        else {
            $('.page-content').css('padding-top',60);
            $('.title-image').css('height',0);
        }
    });
});
Template.baseLayout.helpers({
    dialogTemplates() {
        return UltiSite.dialogTemplates.find();
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
        if (element) {
            return function (err) {
                if (err) {
                    $(element).notify(text + " fehlgeschlagen:" + err, "error");
                } else {
                    $(element).notify(text + " erfolgreich", "success");
                    if (successCallback)
                        successCallback();
                }
            }
        } else {
            return function (err) {
                if (err) {
                    $.notify(text + " fehlgeschlagen:" + err, "error");
                } else {
                    $.notify(text + " erfolgreich", "success");
                    if (successCallback)
                        successCallback();
                }
            };
        }
    },
    notifyUser: function (title, text, options) {
        if (("Notification" in window) && Notification.permission === 'granted') {
            var notification = new Notification(title, _.extend({
                body: text
            }, options));
        }
    },
    AdminNotifications: new Meteor.Collection("AdminNotifications")
});