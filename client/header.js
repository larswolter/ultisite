var lastConnectedStatus = true;

Meteor.startup(function () {
    UltiSite.State.set("searchResults", ['Mind. drei Zeichen']);
    UltiSite.State.setDefault("message", {});
    document.title = UltiSite.settings().siteTitle +
        (UltiSite.settings().siteSubTitle ? ' - ' + UltiSite.settings().siteSubTitle : '');
    $('meta[name=application-name]').attr('content', UltiSite.settings().siteTitle);
    $('meta[name=msapplication-tooltip]').attr('content', UltiSite.settings().siteSubTitle || UltiSite.settings().siteTitle);
    $('meta[name=apple-mobile-web-app-name]').attr('content', UltiSite.settings().siteTitle);

    $(window).scroll(() => {
        const imgHeight = Number(UltiSite.settings().titleImageHeight || 150);
        if (UltiSite.screenSize.get() >= 768) {
            const titleHeight = Math.max(0, imgHeight - $(window).scrollTop());
            $('.page-content').css('padding-top', imgHeight + 90);
            $('.title-image').css('height', titleHeight);
        }
        else {
            $('.page-content').css('padding-top', 60);
            $('.title-image').css('height', 0);
        }
    });
});

Template.header.onRendered(function () {
    $('iframe').fadeOut(500, () => $('iframe').remove());
    this.autorun(() => {
        const imgHeight = Number(UltiSite.settings().titleImageHeight || 150);
        if (UltiSite.screenSize.get() >= 768) {
            const titleHeight = Math.max(0, imgHeight - $(window).scrollTop());
            $('.page-content').css('padding-top', imgHeight + 90);
            $('.title-image').css('height', titleHeight);
        }
        else {
            $('.page-content').css('padding-top', 60);
            $('.title-image').css('height', 0);
        }
    });
});

Template.header.events({
    'click .btn-login-link': function (e) {
        e.preventDefault();
        $('#loginDialog').modal('show');
    },
    'click .action-logout': function (e) {
        e.preventDefault();
        Meteor.logout((err) => {
            if (err)
                UltiSite.notify('Abmelden fehlgeschlagen', 'error');
            else
                UltiSite.notify('Erfolgreich abgemeldet', 'success');
            FlowRouter.go('/');
        });
    },
    'click .action-offline-fetch': function (e) {
        e.preventDefault();
        UltiSite.offlineFetch();
    },
    'click .action-search': function (e) {
        e.preventDefault();
        UltiSite.showModal('searchDialog');
    },
    'click .action-toggle-sidebar': function (e) {
        e.preventDefault();
        UltiSite.toggleSidebar(true);
    }
});

Template.userHeader.events({
    'click .action-reconnect': function (e) {
        e.preventDefault();
        Meteor.reconnect();
    }
});

Template.header.helpers({
    searchResults: function () {
        return UltiSite.State.get("searchResults");
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
                UltiSite.notify('Abmelden fehlgeschlagen', 'error');
            else
                UltiSite.notify('Erfolgreich abgemeldet', 'success');
            FlowRouter.go('/');
        });
    },
    'click .action-offline-fetch': function (e) {
        e.preventDefault();
        UltiSite.offlineFetch();
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
        const matcher = this.activeMatch || this.target;
        FlowRouter.getRouteName();
        FlowRouter.getParam('_id');
        if (matcher === '/')
            return decodeURI(location.pathname) === '/';
        return 0 === decodeURI(location.pathname).indexOf(matcher);
    }
};

Template.navLinks.helpers(linkHelper);
Template.sidebar.helpers(linkHelper);
