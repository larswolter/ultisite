var lastConnectedStatus = true;

Meteor.startup(function () {
    Session.set("searchResults", ['Mind. drei Zeichen']);
    Session.setDefault("message", {});
    Tracker.autorun(function () {
        if (UltiSite.Settings.findOne({})) {
            document.title = UltiSite.settings().siteTitle +
                (UltiSite.settings().siteSubTitle ? ' - ' + UltiSite.settings().siteSubTitle : '');
            $('meta[name=application-name]').attr('content', document.title);
            $('meta[name=apple-mobile-web-app-name]').attr('content', document.title);
        }
    });

});

Template.header.events({
    'click .action-logout': function () {
        Meteor.logout((err) => {
            if (err)
                $.notify('Abmelden fehlgeschlagen', 'error');
            else
                $.notify('Erfolgreich abgemeldet', 'success');
            FlowRouter.go('/');
        });
    },
    'click .action-toggle-sidebar': function () {
        UltiSite.toggleSidebar(true);
    }
});

Template.userHeader.events({
    'click .btn-login-link': function (e) {
        e.preventDefault();
        $('#loginDialog').modal('show');
    },
    'click .action-reconnect': function (e) {
        e.preventDefault();
        Meteor.reconnect();
    }
});

Template.header.helpers({
    searchResults: function () {
        return Session.get("searchResults");
    },
    AdminNotifications: function () {
        return UltiSite.AdminNotifications.find();
    }
});



Template.sidebar.helpers({
    userImageUrl: function () {
        return UltiSite.Images.findOne().url({
            store: 'previews'
        });
    },
    AdminNotifications: function () {
        return UltiSite.AdminNotifications.find();
    }
});

Template.sidebar.events({
    'click .action-toggle-sidebar': function () {
        UltiSite.toggleSidebar(false);
    },
    'click .sublinks': function (e) {
        $(e.currentTarget).next('div').toggle(200);
    },
    'click .action-logout': function (e, t) {
        Meteor.logout((err) => {
            if (err)
                $.notify('Abmelden fehlgeschlagen', 'error');
            else
                $.notify('Erfolgreich abgemeldet', 'success');
            FlowRouter.go('/');
            t.$('.list-group.link-list').addClass('visible-actions');
        });
    },
    'click .toggle-user-menu': function (e, t) {
        t.$('.list-group.link-list').toggleClass('visible-actions');
    },

    'click .action-reconnect': function (e) {
        e.preventDefault();
        Meteor.reconnect();
    },
    'click a': function (e) {
        if (!$(e.currentTarget).hasClass('sublinks'))
            UltiSite.toggleSidebar(false);
    }
});
var linkHelper = {
    showMenuEntry: function () {
        return Meteor.userId() ? this.loggedIn : this.loggedOut;
    },
    isActive: function () {
        FlowRouter.getRouteName();
        FlowRouter.getParam('_id');
        return 0 === decodeURI(location.pathname).indexOf(this.target);
    }
};

Template.navLinks.helpers(linkHelper);
Template.sidebar.helpers(linkHelper);
