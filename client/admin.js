
Template.adminPanel.onCreated(function () {
    Meteor.call("getWikiPageNames", function (err, res) {
        Session.set("wikiPageNames", res);
    });
    Session.set("adminPanel.viewAll", false);
});

Template.adminPanel.rendered = function () {
    Tracker.autorun(function () {
        var gesamt =
            UltiSite.Tournaments.find().count() +
            UltiSite.Teams.find().count() +
            UltiSite.WikiPages.find().count() +
            UltiSite.Practices.find().count() +
            Meteor.users.find().count();

        Meteor.call("queryCollectionStatus", function (err, res) {
            res.push({
                name: "Gesamt",
                count: gesamt
            });
            Session.set("collectionStatus", res);
        });
    });
};

Template.linksEditDialog.helpers({
    jsonLinks: function () {
        return JSON.stringify(UltiSite.settings().objectHeaderLinks, null, 2);
    }
});
Template.linksEditDialog.events({
    'click button[type="submit"]': function (e, t) {
        e.preventDefault();
        try {
            const links = JSON.parse(t.$('textarea').val());
            UltiSite.Settings.update(UltiSite.settings()._id, { $set: { objectHeaderLinks: links } });
            t.$('.modal').modal('hide');
        } catch (err) {
            t.$('textarea').notify('Fehlerhafte Syntax:' + err, 'error');
        }
    }
});

Template.mailServerDialog.onCreated(function () {
    this.activeConfig = new ReactiveVar(0);
});
Template.mailServerDialog.helpers({
    schema: function () {
        return UltiSite.schemas.emailServerSchema.get();
    },
    mailConfig: function () {
        if (UltiSite.settings().mailingListConfigs.length > Template.instance().activeConfig.get())
            return UltiSite.settings().mailingListConfigs[Template.instance().activeConfig.get()];
    }
});
Template.mailServerDialog.events({
    'show.bs.modal .modal': function (e, t) {
        var button = $(e.relatedTarget);
        t.activeConfig.set(Number(button.attr('data-index')));
    },
    'click button[type="submit"]': function (e, t) {
        e.preventDefault();
        t.$('#mailServerForm').submit();
    }
});

Template.adminPanel.helpers({
    AdminNotifications: function () {
        return UltiSite.AdminNotifications.find();
    },
    imageProperties: function () {
        return Object.keys(UltiSite.settings()).filter(function (entry) {
            return entry.indexOf("image") === 0;
        }).map(function (entry) {
            return {
                name: entry.substr(5),
                id: UltiSite.settings()[entry]
            };
        });
    },
    additionalAdminPageTemplates: function () {
        return UltiSite.adminPageTemplates.find();
    },
    viewAll: function () {
        return Session.get("adminPanel.viewAll");
    },
    designs: function () {
        return ['hallunken', 'default'];
    },
    wikiPages: function () {
        return Session.get("wikiPageNames");
    },
    wikiPageName: function (id) {
        var name = "";
        if (Session.get("wikiPageNames"))
            Session.get("wikiPageNames").forEach(function (page) {
                if (page._id == id)
                    name = page.name;
            });
        return name;
    },
    settingsForm: function () {
        if (!UltiSite.settings())
            return [];
        return $.map(UltiSite.settings(), function (element, key) {
            return {
                label: key,
                value: element
            };
        }).filter(function (setting) {
            if (setting.label.indexOf("col_") === 0)
                return false;
            if (setting.label.indexOf("image") === 0)
                return false;
            if (setting.label.indexOf("object") === 0)
                return false;
            if (setting.label.indexOf("array") === 0)
                return false;
            if (setting.label === "_id")
                return false;
            return true;
        });
    },
    collectionStatus: function () {
        return Session.get("collectionStatus");
    }
});

Template.adminPanel.events({
    'click .btn-call-method': function (e, t) {
        e.preventDefault();
        var method = t.$(e.currentTarget).attr('data-method');
        var id = t.$(e.currentTarget).attr('data-id');
        var value = t.$(e.currentTarget).attr('data-value');
        Meteor.call(method, id, value === "true");
    },
    'click .wiki-association a': function (e, t) {
        e.preventDefault();
        var val = {};
        val[t.$(e.currentTarget).attr('data-name')] = t.$(e.currentTarget).attr('data-id');
        UltiSite.Settings.update(UltiSite.settings()._id, {
            $set: val
        });
    },
    'click .action-select-design': function (e, t) {
        e.preventDefault();
        UltiSite.Settings.update(UltiSite.settings()._id, {
            $set: { design: this + '' }
        });
    },
    'click .image-setting': function (e, t) {
        var name = "image" + t.$(e.currentTarget).attr('data-name');
        UltiSite.fileBrowserShowDialog(UltiSite.fileRootFolder()._id, function (fileObj) {
            var val = {};
            val[name] = fileObj ? fileObj._id : null;
            UltiSite.Settings.update(UltiSite.settings()._id, {
                $set: val
            });
            if (name === 'imageIcon') {

            }
            UltiSite.fileBrowserHideDialog();
        });
    },
    'change .direct-admin input': function (e, t) {
        var settings = UltiSite.settings();
        var name = t.$(e.currentTarget).attr('name');
        var value = t.$(e.currentTarget).val();
        if (name.indexOf("array") === 0)
            value = value.split(",");
        var val = {};

        val[name] = value;
        console.log("Updating:", val);
        UltiSite.Settings.update(settings._id, {
            $set: val
        });
    },
    'click .btn-update-mailserver': function () {
        Meteor.call("updateMailserver", UltiSite.userFeedbackFunction("Update Mail Konfiguration"));
    },
    'click .btn-recreate-collections': function () {
        Meteor.call("recreateCollections");
    },
    'click .action-add-setting': function () {
        var name = window.prompt("Setting Name", "");
        if (name) {
            var upd = {};
            upd[name] = "";
            UltiSite.Settings.update(UltiSite.settings()._id, {
                $set: upd
            });
        }
    },
    'click .all-settings-header': function () {
        Session.set("adminPanel.viewAll", !Session.get("adminPanel.viewAll"));
    },
    'click .action-add-mailinglist': function (e, t) {
        e.preventDefault();
        UltiSite.Settings.update(UltiSite.settings()._id, { $push: { mailingListConfigs: { id: Random.id() } } });
    },
    'click .action-remove-mailinglist': function (e, t) {

        UltiSite.Settings.update(UltiSite.settings()._id, { $pull: { mailingListConfigs: { id: this.id } } });
    }
});

AutoForm.hooks({
    mailServerForm: {
        // Called when any submit operation succeeds
        onSubmit: function (insertDoc, updateDoc, currentDoc) {
            console.log(insertDoc, currentDoc);
            UltiSite.Settings.update(UltiSite.settings()._id, { $pull: { mailingListConfigs: { id: currentDoc.id } } });
            UltiSite.Settings.update(UltiSite.settings()._id, { $push: { mailingListConfigs: insertDoc } }, (err, res) => {
                this.done(err);
            });
            return false;
        },
        onSuccess: function () {
            $('.modal').modal('hide');
            AutoForm.resetForm("mailServerForm");
        },
        // Called when any submit operation fails
        onError: function (formType, error) {
            $.notify('Fehler Mail server speichern:' + error.message, "error");
        }
    },
});
