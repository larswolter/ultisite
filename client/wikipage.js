Template.wikipage.onCreated(function () {
    this.insertingDiscussion = new ReactiveVar(false);
    this.withoutControls = false;
    this.activeTab = new ReactiveVar('article');
    this.contentVersion = new ReactiveVar();
    this.activePage = new ReactiveVar();
    this.wysiwygLoaded = new ReactiveVar(false);
    this.autorun((comp) => {
        const tab = this.activeTab.get()==='edit';
        const user = Meteor.user() 
        if (!tab || !user)
            return;        
        import('/imports/client/forms/wysiwyg.js').then(() => this.wysiwygLoaded.set(true));
    });
    if (this.data.pageName) {
        this.withoutControls = true;
        this.subscribe('WikiPage', this.data.pageName);
    } else
        this.autorun(() => {
            if (this.activeTab.get() === 'history')
                Meteor.subscribe('ContentVersion', this.contentVersion.get());
            this.subscribe('WikiPage', FlowRouter.getParam('_id'));
        });
    this.autorun(() => {
        if (!this.withoutControls) {
            let page = UltiSite.WikiPages.findOne({
                $or: [{
                    name: FlowRouter.getParam('_id')
                }, {
                    _id: FlowRouter.getParam('_id')
                }]
            });
            if (page) {
                this.subscribe('WikiPageDiscussions', page._id);
                this.subscribe('ContentVersions', page._id);
            }
        }
    });
    this.autorun(() => {
        let page = UltiSite.WikiPages.findOne({
            $or: [{
                name: this.data.pageName || FlowRouter.getParam('_id')
            }, {
                _id: this.data.pageName || FlowRouter.getParam('_id')
            }]
        });
        let contentVersion = UltiSite.ContentVersions.findOne({ _id: this.contentVersion.get() });
        if (contentVersion && this.activeTab.get() === 'history') {
            page.content = contentVersion.content;
            page.historic = true;
            page.contentId = contentVersion._id;
        }
        this.activePage.set(page);
    });
    this.autorun(() => {
        if (!this.activePage.get())
            return;
        if (this.activeTab.get() === 'edit')
            UltiSite.WikiPages.update({
                _id: this.activePage.get()._id
            }, {
                    $set: {
                        locked: Meteor.userId()
                    }
                });
        else
            UltiSite.WikiPages.update({
                _id: this.activePage.get()._id
            }, {
                    $unset: {
                        locked: 0
                    }
                });
    });
});

Template.wikipage.onDestroyed(function () {
});

Template.wikipage.events({
    'click .action-select-version': function (e, t) {
        e.preventDefault();
        t.contentVersion.set(this._id);
    },
    'click .wikipage-nav a': function (e, t) {
        e.preventDefault();
        t.activeTab.set(t.$(e.target).attr('aria-controls'));
        t.$('.wikipage-nav li').removeClass('active');
        t.$(e.target).parent().addClass('active');
    },
    'click .action-add-discussion': function (e, t) {
        e.preventDefault();
        UltiSite.getHTMLTextDialog({ content: '', header: 'Diskussionsbeitrag hinzufügen' }, (text) => {
            Meteor.call('addWikiPageDiscussion', t.activePage.get()._id, text,
                UltiSite.userFeedbackFunction("Beitrag hinzufügen", null)
            );
        });
    },
    'click .action-save': function (e, t) {
        let newContent = t.$('textarea.wysiwyg-textarea').val();

        UltiSite.WikiPages.update({
            _id: t.activePage.get()._id
        }, {
                $set: {
                    editor: Meteor.userId(),
                    content: newContent,
                    lastChange: new Date
                }
            }, UltiSite.userFeedbackFunction("Inhalt speichern", null, function () {
                Meteor.call("storeContentVersion", t.activePage.get()._id, newContent);
                console.log("saved wikipage content");
                t.activeTab.set('article');
                t.$('.wikipage-nav li').removeClass('active');
                t.$('[aria-controls="article"]').parent().addClass('active');
            }));
    }

});

Template.wikipage.helpers({
    insertingDiscussion: function () {
        return Template.instance().insertingDiscussion.get();
    },
    showDiscussions: function () {
        return Template.instance().activeTab.get() === 'discussion';
    },
    showHistory: function () {
        return Template.instance().activeTab.get() === 'history';
    },
    editMode: function () {
        return Template.instance().activeTab.get() === 'edit';
    },
    withoutControls: function () {
        if (!Meteor.userId())
            return true;
        return Template.instance().withoutControls;
    },
    discussions: function () {
        return UltiSite.WikiPageDiscussions.find({ pageId: (Template.instance().activePage.get() || {})._id }, { sort: { date: -1 } }).fetch();
    },
    lastDiscussionDate: function () {
        return (UltiSite.WikiPageDiscussions.findOne({ pageId: (Template.instance().activePage.get() || {})._id }, { sort: { date: -1 } }) || {}).date;
    },
    histories: function () {
        return UltiSite.ContentVersions.find({ associated: (Template.instance().activePage.get() || {})._id }, { sort: { date: -1 } }).fetch();
    },
    wikiPages: function () {
        return UltiSite.WikiPages.find();
    },
    canEdit: function () {
        if (!Template.instance().wysiwygLoaded.get())
            return false;
        let page = Template.instance().activePage.get();
        if (!page)
            return false;
        return !page.locked || page.locked === Meteor.userId();
    },
    wikiEntry: function () {
        return Template.instance().activePage.get();
    }
});

Template.wikipageOverview.onCreated(function () {
    Meteor.call("getWikiPageNames", function (err, res) {
        Session.set("wikiPageNames", res);
    });
});

Template.wikipageOverview.events({
    'submit form': function (e) {
        e.preventDefault();
        UltiSite.WikiPages.insert({
            name: $('.wiki-page-name').val(),
            owner: Meteor.userId(),
            editor: Meteor.userId(),
            lastChange: new Date(),
            content: ""
        }, UltiSite.userFeedbackFunction("Wikiseite Anlegen", e.currentTarget, function () {
            Meteor.call("getWikiPageNames", function (err, res) {
                Session.set("wikiPageNames", res);
            });
        }));
    },
    'click .action-remove-page': function (e) {
        UltiSite.confirmDialog("Wikiseite löschen?", () => {
            UltiSite.WikiPages.remove($(e.currentTarget).attr('data-id'),
                UltiSite.userFeedbackFunction("Wikiseite Entfernen", e.currentTarget, function () {
                    Meteor.call("getWikiPageNames", function (err, res) {
                        Session.set("wikiPageNames", res);
                    });
                })
            );
        });
    }
});
Template.wikipageOverview.helpers({
    wikiPages: function () {
        return Session.get("wikiPageNames");

    },
    canRemove: function () {
        if (this.owner === Meteor.userId())
            return true;
        if (UltiSite.isAdmin())
            return true;
        return false;
    },
});

