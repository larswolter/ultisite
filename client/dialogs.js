import { FlowRouter } from 'meteor/kadira:flow-router';

let getTextCallback;
const getTextOptions = new ReactiveVar();

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
  if (!Template[templateName]) { throw new Meteor.Error(`template notfound:${templateName}`); }
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
      if (FlowRouter.current().queryParams && FlowRouter.current().queryParams.modalDialog) {
        window.history.back();
      }
    });
    UltiSite.modalDialogTemplate = modal;
    modal.modal(options || {});
    FlowRouter.go(
      FlowRouter.current().path,
      {},
      Object.assign({ modalDialog: 1 }, FlowRouter.current().queryParams));
  }
};

UltiSite.hideModal = function (afterHidden) {
  if (UltiSite.modalDialogTemplate && UltiSite.modalDialogTemplate.modal) {
    if (afterHidden) {
      UltiSite.modalDialogTemplate.on('hidden.bs.modal', afterHidden);
    }
    UltiSite.modalDialogTemplate.modal('hide');
  }
};

Template.confirmDialog.helpers({
  options() {
    return getTextOptions.get();
  },
});

Template.confirmDialog.events({
  'click .action-confirm': function (event, template) {
    event.preventDefault();
    getTextCallback(true);
    $('#confirmDialog').modal('hide');
  },
});

Template.getTextDialog.helpers({
  options() {
    return getTextOptions.get();
  },
});

Template.getTextDialog.events({
  'submit form': function (event, template) {
    event.preventDefault();
    getTextCallback(template.$('.text-input').val());
    $('#getTextDialog').modal('hide');
  },
});

Template.getHTMLTextDialog.onCreated(function () {
  this.wysiwygLoaded = new ReactiveVar(false);
});

Template.getHTMLTextDialog.helpers({
  wysiwygLoaded() {
    return Template.instance().wysiwygLoaded.get();
  },
  options() {
    return getTextOptions.get();
  },
});

Template.getHTMLTextDialog.events({
  'click .action-save': function (event, template) {
    event.preventDefault();
    getTextCallback(template.$('textarea.wysiwyg-textarea').val());
    $('#getHTMLTextDialog').modal('hide');
  },
  'shown.bs.modal #getHTMLTextDialog': function (evt, tmpl) {
    import('/imports/client/forms/wysiwyg.js').then(() => tmpl.wysiwygLoaded.set(true));
  },
  'hidden.bs.modal #getHTMLTextDialog': function () {
    getTextOptions.set(undefined);
  },
});
const searchDependency = new ReactiveVar('Users,Images,Tournaments,Documents,WikiPages,Blogs');

Template.searchDialog.onRendered(function () {
  this.autorun(() => {
    if (FlowRouter.current().route.name === 'users') {
      searchDependency.set('Users');
    } else if (FlowRouter.current().route.name === 'tournaments') {
      searchDependency.set('Tournaments');
    } else if (FlowRouter.current().route.name === 'files') {
      searchDependency.set('Images,Tournaments');
    } else {
      searchDependency.set('Images,Tournaments,Users,Tournaments,WikiPages,Blogs');
    }
  });
});
Template.searchDialog.events({
  'change .search-type': function (evt, tmpl) {
    searchDependency.set(_.filter(tmpl.$('.search-type'), st => st.checked).map(st => tmpl.$(st).attr('data-type')).join(','));
  },
});
Template.searchDialog.helpers({
  isActive(type) {
    return _.contains(searchDependency.get().split(','), type);
  },
  clickFunc() {
    return (searchResult) => {
      UltiSite.hideModal();
      FlowRouter.go(searchResult.link);
    };
  },
  activeSearch() {
    console.log(searchDependency.get());
    return searchDependency.get();
  },
});
