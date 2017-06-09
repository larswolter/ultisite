
var getTextCallback;
var getTextOptions = new ReactiveVar();

UltiSite.confirmDialog = function (text, callback) {
    getTextOptions.set({ text });
    getTextCallback = callback;
    $('#confirmDialog').modal('show');
};
UltiSite.getTextDialog = function (options, callback) {
    getTextOptions.set(options);
    getTextCallback = callback;
    $('#getTextDialog').modal('show');
};
UltiSite.getHTMLTextDialog = function (options, callback) {
    getTextOptions.set(options);
    getTextCallback = callback;
    $('#getHTMLTextDialog').modal('show');
};

UltiSite.modalDialogTemplate = null;
UltiSite.showModal = function (templateName, data, options) {
    if (options && options.dynamicImport) {
        import(options.dynamicImport).then(() => {
            UltiSite.showModal(templateName, data, _.omit(options, 'dynamicImport'));
        });
        return;
    }
    if (!Template[templateName])
        throw new Meteor.Error('template notfound:' + templateName);
    if (UltiSite.modalDialogTemplate === null) {
        const parentNode = $('div.base-layout')[0];
        const view = Blaze.renderWithData(Template[templateName], data, parentNode);
        const domRange = view._domrange;
        const modal = domRange.$('.modal');
        modal.on('shown.bs.modal', function (event) {
            modal.find('[autofocus]').focus();
        });
        modal.on('hidden.bs.modal', function (event) {
            Blaze.remove(view);
            UltiSite.modalDialogTemplate = null;
        });
        UltiSite.modalDialogTemplate = modal;
        modal.modal(options ? options : {});
    }
};

UltiSite.hideModal = function () {
    if (UltiSite.modalDialogTemplate && UltiSite.modalDialogTemplate.modal)
        UltiSite.modalDialogTemplate.modal('hide');
};

Template.confirmDialog.helpers({
    options: function () {
        return getTextOptions.get();
    }
});

Template.confirmDialog.events({
    "click .action-confirm": function (event, template) {
        event.preventDefault();
        getTextCallback(true);
        $('#confirmDialog').modal('hide');
    }
});

Template.getTextDialog.helpers({
    options: function () {
        return getTextOptions.get();
    }
});

Template.getTextDialog.events({
    "submit form": function (event, template) {
        event.preventDefault();
        getTextCallback(template.$('.text-input').val());
        $('#getTextDialog').modal('hide');
    }
});

Template.getHTMLTextDialog.onCreated(function() {
    this.wysiwygLoaded = new ReactiveVar(false);
});

Template.getHTMLTextDialog.helpers({
    wysiwygLoaded: function () {
        return Template.instance().wysiwygLoaded.get();
    },
    options: function () {
        return getTextOptions.get();
    }
});

Template.getHTMLTextDialog.events({
    "click .action-save": function (event, template) {
        event.preventDefault();
        getTextCallback(template.$('textarea.wysiwyg-textarea').val());
        $('#getHTMLTextDialog').modal('hide');
    },
    'shown.bs.modal #getHTMLTextDialog': function (evt, tmpl) {
        import('/imports/client/forms/wysiwyg.js').then(() => tmpl.wysiwygLoaded.set(true));
    },
    'hidden.bs.modal #getHTMLTextDialog': function () {
        getTextOptions.set(undefined);
    }
});
const searchDependency = new ReactiveVar("Users,Images,Tournaments,Documents,WikiPages,Blogs");

Template.searchDialog.onRendered(function () {
    searchDependency.set(_.filter(this.$('.search-type'), st => st.checked).map(st => this.$(st).attr('data-type')).join(','));
});
Template.searchDialog.events({
    'change .search-type': function (e, t) {
        searchDependency.set(_.filter(t.$('.search-type'), st => st.checked).map(st => t.$(st).attr('data-type')).join(','));
    }
});
Template.searchDialog.helpers({
    activeSearch() {
        console.log(searchDependency.get());
        return searchDependency.get();
    }
});
