
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
    UltiSite.modalDialogTemplate.modal('hide')
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

Template.getHTMLTextDialog.helpers({
    options: function () {
        return getTextOptions.get();
    }
});

Template.getHTMLTextDialog.events({
    "click .action-save": function (event, template) {
        event.preventDefault();
        getTextCallback(template.$('.ulti-editor').val());
        $('#getHTMLTextDialog').modal('hide');
    },
    'hidden.bs.modal #getHTMLTextDialog': function () {
        getTextOptions.set(undefined);
    }
});
