Template.wikipage.onCreated(function () {
  this.insertingDiscussion = new ReactiveVar(false);
  this.withoutControls = false;
  this.activeTab = new ReactiveVar();
  this.contentVersion = new ReactiveVar();
  this.activePage = new ReactiveVar();
  this.wysiwygLoaded = new ReactiveVar(false);
  this.autorun((comp) => {
    const tab = this.activeTab.get() === 'edit';
    const user = Meteor.user();
    if (!tab || !user) { return; }
    import('/imports/client/forms/wysiwyg.js').then(() => this.wysiwygLoaded.set(true));
  });
  if (this.data.pageName) {
    this.withoutControls = true;
    this.subscribe('WikiPage', this.data.pageName);
  } else {
    this.autorun(() => {
      if (this.activeTab.get() === 'history') {
        Meteor.subscribe('ContentVersion', this.contentVersion.get());
      }
      this.subscribe('WikiPage', FlowRouter.getParam('_id'));
    });
  }
  this.autorun(() => {
    if (!this.withoutControls) {
      const page = UltiSite.WikiPages.findOne({
        $or: [{
          name: FlowRouter.getParam('_id'),
        }, {
          _id: FlowRouter.getParam('_id'),
        }],
      });
      if (page) {
        this.subscribe('WikiPageDiscussions', page._id);
        this.subscribe('ContentVersions', page._id);
      }
    }
  });
  this.autorun(() => {
    const page = UltiSite.WikiPages.findOne({
      $or: [{
        name: this.data.pageName || FlowRouter.getParam('_id'),
      }, {
        _id: this.data.pageName || FlowRouter.getParam('_id'),
      }],
    });
    const contentVersion = UltiSite.ContentVersions.findOne({ _id: this.contentVersion.get() });
    if (contentVersion && this.activeTab.get() === 'history') {
      page.content = contentVersion.content;
      page.historic = true;
      page.contentId = contentVersion._id;
    }
    this.activePage.set(page);
  });
  this.autorun(() => {
    if (!this.activePage.get()) { return; }
    if (this.activeTab.get() === 'edit') {
      UltiSite.WikiPages.update({
        _id: this.activePage.get()._id,
      }, {
          $set: {
            locked: Meteor.userId(),
            lockedName: Meteor.user().username,
          },
        });
    } else {
      UltiSite.WikiPages.update({
        _id: this.activePage.get()._id,
      }, {
          $unset: {
            locked: 0,
          },
        });
    }
  });
});

Template.wikipage.onDestroyed(function () {
});

Template.wikipage.events({
  'click .action-select-version'(e, t) {
    e.preventDefault();
    t.contentVersion.set(this._id);
  },
  'click .wikipage-nav a'(e, t) {
    const target = t.$(e.target).attr('aria-controls');
    if (!target) {
      return;
    }
    e.preventDefault();
    if (target === 'docs') {
      import('/imports/client/files/files.js').then(() => {
        t.activeTab.set(target);
      });
    } else {
      t.activeTab.set(target);
    }
  },
  'click .action-add-discussion'(e, t) {
    e.preventDefault();
    UltiSite.getHTMLTextDialog({ content: '', header: 'Diskussionsbeitrag hinzufügen' }, (text) => {
      Meteor.call('addWikiPageDiscussion', t.activePage.get()._id, text,
        UltiSite.userFeedbackFunction("Beitrag hinzufügen", null),
      );
    });
  },
  'click .action-remove'(e, t) {
    e.preventDefault();
    t.activeTab.set(undefined);
  },
  'click .action-save'(e, t) {
    const newContent = t.$('textarea.wysiwyg-textarea').val();

    UltiSite.WikiPages.update({
      _id: t.activePage.get()._id,
    }, {
        $set: {
          editor: Meteor.userId(),
          content: newContent,
          lastChange: new Date(),
        },
      }, UltiSite.userFeedbackFunction("Inhalt speichern", null, function () {
        Meteor.call("storeContentVersion", t.activePage.get()._id, newContent);
        console.log("saved wikipage content");
        t.activeTab.set(undefined);
      }));
  },

});

Template.wikipage.helpers({
  insertingDiscussion() {
    return Template.instance().insertingDiscussion.get();
  },
  showEditStuff() {
    return !!Template.instance().activeTab.get();
  },
  showDiscussions() {
    return Template.instance().activeTab.get() === 'discussion';
  },
  showDocs() {
    return Template.instance().activeTab.get() === 'docs';
  },
  showHistory() {
    return Template.instance().activeTab.get() === 'history';
  },
  editMode() {
    return Template.instance().activeTab.get() === 'edit';
  },
  withoutControls() {
    if (!Meteor.userId()) { return true; }
    return Template.instance().withoutControls;
  },
  discussions() {
    return UltiSite.WikiPageDiscussions.find({ pageId: (Template.instance().activePage.get() || {})._id }, { sort: { date: -1 } }).fetch();
  },
  lastDiscussionDate() {
    return (UltiSite.WikiPageDiscussions.findOne({ pageId: (Template.instance().activePage.get() || {})._id }, { sort: { date: -1 } }) || {}).date;
  },
  histories() {
    return UltiSite.ContentVersions.find({ associated: (Template.instance().activePage.get() || {})._id }, { sort: { date: -1 } }).fetch();
  },
  wikiPages() {
    return UltiSite.WikiPages.find();
  },
  canEdit() {
    if (!Template.instance().wysiwygLoaded.get()) { return false; }
    const page = Template.instance().activePage.get();
    if (!page) { return false; }
    return !page.locked || page.locked === Meteor.userId();
  },
  wikiEntry() {
    return Template.instance().activePage.get();
  },
});

Template.wikipageOverview.onCreated(function () {
  Meteor.call("getWikiPageNames", function (err, res) {
    UltiSite.State.set("wikiPageNames", res);
  });
});

Template.wikipageOverview.events({
  'submit form'(e) {
    e.preventDefault();
    UltiSite.WikiPages.insert({
      name: $('.wiki-page-name').val(),
      owner: Meteor.userId(),
      editor: Meteor.userId(),
      lastChange: new Date(),
      content: "",
    }, UltiSite.userFeedbackFunction("Wikiseite Anlegen", e.currentTarget, function () {
      Meteor.call("getWikiPageNames", function (err, res) {
        UltiSite.State.set("wikiPageNames", res);
      });
    }));
  },
  'click .action-remove-page'(e) {
    UltiSite.confirmDialog("Wikiseite löschen?", () => {
      UltiSite.WikiPages.remove($(e.currentTarget).attr('data-id'),
        UltiSite.userFeedbackFunction("Wikiseite Entfernen", e.currentTarget, function () {
          Meteor.call("getWikiPageNames", function (err, res) {
            UltiSite.State.set("wikiPageNames", res);
          });
        }),
      );
    });
  },
});
Template.wikipageOverview.helpers({
  wikiPages() {
    return UltiSite.State.get("wikiPageNames");
  },
  canRemove() {
    if (this.owner === Meteor.userId()) { return true; }
    if (UltiSite.isAdmin()) { return true; }
    return false;
  },
});

