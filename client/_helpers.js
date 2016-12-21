
Meteor.startup(function () {
    Template.registerHelper("pathFor", function (params, params2, params3) {
        //console.log("pathFor:", params, params2, params3);
        if (params.hash)
            return FlowRouter.path(params.hash.route, params.hash);
        else if (typeof (params) === "string")
            return FlowRouter.path(params, (params2 || {}).hash);
        else
            console.log("pathFor Error:", params);
    });
    Template.registerHelper("subsReady", function (type) {
        var sub = UltiSite[type + "Ready"].get();
        console.log("checkin sub:", sub);
        return sub;
    });
    Template.registerHelper("meteorStatus", function () {
        return Meteor.status();
    });

    Template.registerHelper("screenSizeMobile", function () {

        return UltiSite.screenSize.get() < 768;
    });

    Template.registerHelper("settings", function () {
        return UltiSite.settings();
    });
    Template.registerHelper("dayOfDate", function (date) {
        return moment(date).format("DD");
    });
    Template.registerHelper("monthOfDate", function (date) {
        return moment(date).format("MM");
    });
    Template.registerHelper("yearOfDate", function (date) {
        return moment(date).format("YY");
    });
    Template.registerHelper("timeOfDate", function (date) {
        return moment(date).format("HH:mm");
    });
    Template.registerHelper("formatDate", function (date) {
        return date && moment(date).isValid() && moment(date).format("DD.MM.YYYY");
    });
    Template.registerHelper("formatDateInput", function (date) {
        return date && moment(date).isValid() && moment(date).format("YYYY-MM-DD");
    });
    Template.registerHelper("formatTime", function (date) {
        return date && moment(date).isValid() && moment(date).format("HH:mm");
    });
    Template.registerHelper("formatDateTime", function (date) {
        return date && moment(date).format("DD.MM.YYYY HH:mm");
    });
    Template.registerHelper("formatDateRelative", function (date) {
        return date && moment(date).isValid() && moment(date).fromNow();
    });
    Template.registerHelper("imageLookup", function (id) {
        return UltiSite.Images.findOne(id);
    });
    Template.registerHelper("imageUrl", function (id, size) {
        return '/_image?imageId='+id+(isNaN(size)?'':'&size='+size);
    });
    Template.registerHelper("getPageSearch", function (id) {
        if (!Meteor.userId())
            return false;

        var name = FlowRouter.getRouteName();
        switch (name) {
            case "tournaments":
                return "Tournaments";
            case "users":
                return "Users";
            case "files":
                return "Images,Documents";
            case "blogs":
                return "Blogs";
        }
    });
    Template.registerHelper("sitePageHeader", function () {
        var name = FlowRouter.getRouteName();
        switch (name) {
            case "tournaments": return { name: "Turniere", link: "/" };
            case "practices": return { name: "Trainingszeiten", link: "/" };
            case "admin": return { name: "Administrierung", link: "/" };
            case "blog": return { name: "Administrierung", link: "/" };
            case "tweets": return { name: "Blabla", link: "/" };
            case "wikipage":
                var wiki = UltiSite.WikiPages.findOne({
                    $or: [
                        { _id: FlowRouter.getParam('_id') }, { title: FlowRouter.getParam('_id') }]
                });
                if (wiki)
                    return { name: wiki.name, link: "/wikipage", back: 'Wikiseiten' };
                return { name: "Wikiseiten", link: "/" };
            case "user":
                var user = Meteor.users.findOne(FlowRouter.getParam('_id'));
                if (user)
                    return { name: user.username, back: "Mitglieder", link: "/users" };
                return { name: "Mitglieder", link: "/" };
            case "tournament":
                var tournament = UltiSite.Tournaments.findOne(FlowRouter.getParam('_id'));
                if (tournament)
                    return { name: tournament.name, back: "Turniere", link: "/tournaments" };
                return { name: "Turnier", back: "Turniere", link: "/tournaments" };
            case undefined:
                return { name: UltiSite.settings().teamname };
            default:
                return { back: UltiSite.settings().teamname, link: '/' };
        }
    });

    Template.registerHelper("colorState", function (state) {
        if (state === 100)
            return "success";
        else if (state >= 50)
            return "warning";
        else if (state >= 10)
            return "default";
        else
            return "muted";
    });

    Template.registerHelper("isAdmin", function () {
        return UltiSite.isAdmin();
    });

    Template.registerHelper("formatFileSize", function (size) {
        if (size > 1024 * 1024 * 1024 * 1024)
            return (size / (1024 * 1024 * 1024 * 1024)).toFixed(2) + "T";
        else if (size > 1024 * 1024 * 1024)
            return (size / (1024 * 1024 * 1024)).toFixed(2) + "G";
        else if (size > 1024 * 1024)
            return (size / (1024 * 1024)).toFixed(2) + "M";
        else if (size > 1024)
            return (size / (1024)).toFixed(2) + "K";
        else
            return (size) + "";
    });


    Template.registerHelper("equals", function (a, b) {
        return a == b;
    });
    Template.registerHelper("or", function (a, b) {
        return a || b;
    });
    Template.registerHelper("and", function (a, b) {
        return a && b;
    });
    Template.registerHelper("gte", function (a, b) {
        return a >= b;
    });
    Template.registerHelper("not", function (a) {
        return !a;
    });

    Template.registerHelper("getAlias", function (aliase) {
        return UltiSite.getAlias(aliase);
    });

});

Template.wysiwygEditor.rendered = function () {
    var self = this;
    Tracker.autorun(function () {
        if (self.enabled.get())
            initEditor(self);
    });
};

Template.wysiwygEditor.created = function () {
    //if (this.data.light)
    this.enabled = new ReactiveVar(false);
    var self = this;
    if (self.data.startEnabled)
        self.enabled.set(true);
};

Template.wysiwygEditor.helpers({
    editingEnabled: function () {
        return Template.instance().enabled.get();
    }
});

Template.wysiwygEditor.events({
    'click .btn-edit': function (e, t) {
        t.enabled.set(true);
    },
    'dblclick .editing-container': function (e, t) {
        t.enabled.set(true);
    },
    'click .wysiwyg-editor a > img': function (e, t) {
        e.preventDefault();
        e.stopPropagation();
    }
});

$.fn.serializeObject = function () {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function () {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

var initEditor = function (template) {
    var self = template;
    if (self.$('.wysiwyg-container')[0]) {
        self.$('.wysiwyg-container').show();
        console.log("Bringing Editor to the foreground");
        return;
    }
    var buttons = {
        bold: {
            title: 'Fett (Ctrl+F)',
            image: '\uf032', // <img src="path/to/image.png" width="16" height="16" alt="" />
            hotkey: 'f',
            showselection: true
        },
        italic: {
            title: 'Kursiv (Ctrl+K)',
            image: '\uf033', // <img src="path/to/image.png" width="16" height="16" alt="" />
            hotkey: 'k',
            showselection: true
        },
        underline: {
            title: 'Unterstrichen (Ctrl+U)',
            image: '\uf0cd', // <img src="path/to/image.png" width="16" height="16" alt="" />
            hotkey: 'u',
            showselection: true

        },
        strikethrough: {
            title: 'Durchgestrichen (Ctrl+S)',
            image: '\uf0cc', // <img src="path/to/image.png" width="16" height="16" alt="" />
            hotkey: 's',
            showselection: true
        },
        header: {
            title: 'Überschriften',
            image: '\uf1dc', // <img src="path/to/image.png" width="16" height="16" alt="" />
            popup: function ($popup) {
                var list_headers = {
                    // Name : Font
                    'Header 1': '<h1>',
                    'Header 2': '<h2>',
                    'Header 3': '<h3>',
                    'Header 4': '<h4>',
                    'Header 5': '<h5>',
                    'Header 6': '<h6>',
                    'Code': '<pre>'
                };
                var $list = $('<div/>').addClass('wysiwyg-plugin-list')
                    .attr('unselectable', 'on');
                $.each(list_headers, function (name, format) {
                    var $link = $(format)
                        .css('cursor', 'pointer')
                        .html(name)
                        .click(function (event) {
                            self.$('.ulti-editor').wysiwyg('shell').format(format).closePopup();
                            // prevent link-href-#
                            event.stopPropagation();
                            event.preventDefault();
                            return false;
                        });
                    $list.append($link);
                });
                $popup.append($list);
            }
            //showstatic: true,    // wanted on the toolbar
            //showselection: false    // wanted on selection
        },
        forecolor: {
            title: 'Text Farbe',
            image: '\uf1fc',
            showselection: true
        },
        highlight: {
            title: 'Hintergrundfarbe',
            image: '\uf043' // <img src="path/to/image.png" width="16" height="16" alt="" />
        },
        insertlink: {
            title: 'Link einfügen',
            image: '\uf0c1'
        },
        orderedList: {
            title: 'Nummerierte Liste',
            image: '\uf0cb', // <img src="path/to/image.png" width="16" height="16" alt="" />
            //showstatic: true,    // wanted on the toolbar
            showselection: false // wanted on selection
        },
        unorderedList: {
            title: 'Liste',
            image: '\uf0ca', // <img src="path/to/image.png" width="16" height="16" alt="" />
            //showstatic: true,    // wanted on the toolbar
            showselection: false // wanted on selection
        }
    };
    if (self.data.onSave)
        buttons = _.extend({
            close: {
                title: 'Close (Esc)',
                image: '\uf00d',
                hotkey: 'esc',
                click: function () {
                    self.$('.wysiwyg-container').hide();
                    self.enabled.set(false);
                }
            },
            save: {
                title: 'Save (Ctrl+S)',
                image: '\uf0c7', // <img src="path/to/image.png" width="16" height="16" alt="" />
                hotkey: 's',
                click: function () {
                    var newHTML = self.$('.ulti-editor').wysiwyg('shell').getHTML();
                    self.data.onSave(newHTML, function (err) {
                        if (err)
                            self.$("button[data-name='state'] .fa").removeClass().addClass("fa fa-close text-danger");
                        else {
                            self.$("button[data-name='state'] .fa").removeClass().addClass("fa fa-check text-success");
                            self.$('.wysiwyg-container').hide();
                            self.enabled.set(false);
                        }
                    });
                }
            },
        }, buttons);
    if (!self.data.light) {
        buttons.image = {
            title: 'Bild einfügen',
            image: '\uf03e', // <img src="path/to/image.png" width="16" height="16" alt="" />
            click: function () {
                UltiSite.fileBrowserShowDialog(self.data.source._id, function (fileObj) {
                    if (fileObj)
                        self.$('.ulti-editor').wysiwyg('shell').insertHTML('<div class="editable-image"><a href="' +
                            FlowRouter.path("image", {
                                _id: fileObj._id
                            }) +
                            '"><img src="' + (fileObj.url(120)) + '"></a></div>');
                    UltiSite.fileBrowserHideDialog();
                });
            }
        };
        buttons.insertvideo = {
            title: 'Video einfügen',
            image: '\uf03d'
        },
            buttons.alignleft = {
                title: 'Links ausgerichtet',
                image: '\uf036' // <img src="path/to/image.png" width="16" height="16" alt="" />
            };
        buttons.aligncenter = {
            title: 'Mittig ausgerichtet',
            image: '\uf037', // <img src="path/to/image.png" width="16" height="16" alt="" />
            //showstatic: true,    // wanted on the toolbar
            showselection: false // wanted on selection
        };
        buttons.alignright = {
            title: 'Rechts ausgerichtet',
            image: '\uf038', // <img src="path/to/image.png" width="16" height="16" alt="" />
            //showstatic: true,    // wanted on the toolbar
            showselection: false // wanted on selection
        };
        buttons.alignjustify = {
            title: 'Blocksatz',
            image: '\uf039', // <img src="path/to/image.png" width="16" height="16" alt="" />
            //showstatic: true,    // wanted on the toolbar
            showselection: false // wanted on selection
        };
        buttons.removeformat = {
            title: 'Formatierung entfernen',
            image: '\uf12d' // <img src="path/to/image.png" width="16" height="16" alt="" />
        };
    }
    self.$('.ulti-editor').wysiwyg({
        toolbar: 'top',
        buttons: buttons,
        submit: {
            title: 'Übernehmen',
            image: '\uf14a'
        }
    });
    if (self.data.onInit)
        self.data.onInit();
    console.log("Finished initializing editor");
};

Template.Loading.events({
    'click .action-reconnect': function (e) {
        e.preventDefault();
        Meteor.reconnect();
    }
});

Template.popoverIcon.onRendered(function () {
    this.$('[data-toggle="tooltip"]').tooltip();
});

notifyUser = function (text) {
    console.log("notifying:" + text);
    // Let's check if the browser supports notifications
    if (!("Notification" in window)) {
        return;
    }

    // Let's check if the user is okay to get some notification
    else if (Notification.permission === "granted") {
        // If it's okay let's create a notification
        var notification = new Notification(text);
    }

    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
            // If the user is okay, let's create a notification
            if (permission === "granted") {
                var notification = new Notification(text);
            }
        });
    }

}
