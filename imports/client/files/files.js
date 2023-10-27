import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import './fileUpload';
import './fileGallery.html';
import './files.html';
import './files.scss';

if (!HTMLCanvasElement.prototype.toBlob) {
  Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
    value(callback, type, quality) {
      const binStr = atob(this.toDataURL(type, quality).split(',')[1]);
      const len = binStr.length;
      const arr = new Uint8Array(len);

      for (let i = 0; i < len; i++) {
        arr[i] = binStr.charCodeAt(i);
      }

      callback(new Blob([arr], { type: type || 'image/png' }));
    },
  });
}
const currentlyEditedFile = new ReactiveVar(undefined);
const fileBrowserCallback = new ReactiveVar(undefined);

Meteor.startup(function () {
  _.extend(UltiSite, {
    fileBrowserShowDialog(id, callback) {
      UltiSite.State.set('fileBrowserFolder', id);
      fileBrowserCallback.set(callback);
      UltiSite.showModal('fileBrowserDialog');
    },

    fileBrowserHideDialog() {
      UltiSite.hideModal();
    },
  });
});

Template.registerHelper('fileRootFolder', function () {
  return UltiSite.Folders.findOne(UltiSite.settings().rootFolderId);
});

const getIcon = function () {
  let file = this;
  if (!file.type && this.file) {
    file = this.file;
  }
  if (!file.type) {
    return 'fa-question';
  }
  if (file.type.indexOf('image') === 0) {
    return 'fa-file-image-o';
  } else if (file.type.indexOf('video') === 0) {
    return 'fa-file-video-o';
  }
  return 'fa-file-o';
};
// FUTURE: add editing capabilities
Template.editFileDialog.helpers({
  file() {
    return currentlyEditedFile.get();
  },
  icon: getIcon,
  assozierteElemente() {
    return UltiSite.getAnyById(currentlyEditedFile.get().associated);
  },
});

Template.fileBrowser.onCreated(function () {
  UltiSite.State.set('fileBrowserFolder', UltiSite.settings().rootFolderId);
  UltiSite.State.setDefault('fileBrowserGalleryView', false);

  this.autorun(() => {
    const id = FlowRouter.getParam('_id');
    const dataId = Template.currentData().fileBrowserFolder;
    if (dataId) {
      UltiSite.State.set('fileBrowserFolder', dataId);
    } else if (id) {
      UltiSite.State.set('fileBrowserFolder', id);
    }
  });
  this.autorun(() => {
    this.subscribe('Files', UltiSite.State.get('fileBrowserFolder'));
  });

  this.readme = new ReactiveVar();

  this.autorun(() => {
    const readmeFile = UltiSite.Documents.findOne({
      associated: UltiSite.State.get('fileBrowserFolder'),
      name: 'README.md',
    });
    if (readmeFile) {
      HTTP.get(readmeFile.url(), (err, res) => {
        if (!err) {
          this.readme.set(res.content);
        }
      });
    } else {
      this.readme.set(undefined);
    }
  });
});

Template.fileBrowser.events({
  'click .toggle-gallery-view': function (e, t) {
    e.preventDefault();
    UltiSite.State.set('fileBrowserGalleryView', !UltiSite.State.get('fileBrowserGalleryView'));
  },
  'click .btn-new-folder': function (e, t) {
    e.preventDefault();
    console.log('Add folder', e);
    UltiSite.Folders.insert({
      rename: true,
      name: 'Neuer Ordner',
      associated: [UltiSite.State.get('fileBrowserFolder')],
    });
  },
});

Template.fileBrowser.helpers({
  galleryView() {
    return UltiSite.State.get('fileBrowserGalleryView');
  },
  readme() {
    return Template.instance().readme.get();
  },
  curFolder() {
    return (
      UltiSite.getAnyById(UltiSite.State.get('fileBrowserFolder')) || { _id: UltiSite.State.get('fileBrowserFolder') }
    );
  },
  rootFolder() {
    return UltiSite.getAnyById(UltiSite.settings().rootFolderId);
  },
});

Template.fileBrowserItem.events({
  'click .remove-file': function (e, t) {
    e.preventDefault();
    UltiSite.confirmDialog(`Willst du die Datei ${this.name} wirklich löschen?`, () => {
      Meteor.call('removeFile', this._id);
    });
  },
  'click .edit-file': function (e) {
    e.preventDefault();
    currentlyEditedFile.set(this);
    $('#editFileDialog').modal('show');
  },
  'click .select-file': function (e, t) {
    e.preventDefault();
    e.stopPropagation();
    const callback = fileBrowserCallback.get();
    if (callback) {
      callback(this);
    }
  },
});

Template.fileBrowserItem.helpers({
  needsSelect() {
    return fileBrowserCallback.get();
  },
  icon: getIcon,
});

Template.fileBrowserDialog.onCreated(function () {
  const self = this;
  this.initialFolder = UltiSite.State.get('fileBrowserFolder');
  this.activePane = new ReactiveVar(this.initialFolder);
});
Template.fileBrowserDialog.onDestroyed(function () {
  fileBrowserCallback.set(null);
});

Template.fileBrowserDialog.events({
  'hidden.bs.modal .modal': function (e, t) {
    fileBrowserCallback.set(null);
  },
  'click .action-switch-source': function (e, t) {
    e.preventDefault();
    if (t.$(e.currentTarget).attr('data-value') !== 'search') {
      UltiSite.State.set('fileBrowserFolder', t.$(e.currentTarget).attr('data-value'));
    }
    t.activePane.set(t.$(e.currentTarget).attr('data-value'));
  },
  'click .action-select-nothing': function (e) {
    e.preventDefault();
    const callback = fileBrowserCallback.get();
    if (callback) {
      callback(null);
    }
  },
});

Template.fileBrowserDialog.helpers({
  initialFolder() {
    return Template.instance().initialFolder;
  },
  fileBrowserFolder() {
    return UltiSite.State.get('fileBrowserFolder');
  },
  activePane() {
    return Template.instance().activePane.get();
  },
  dialogSelection() {
    return fileBrowserCallback.get();
  },
});

const helpers = {
  icon: getIcon,
  folder() {
    return UltiSite.getAnyById(UltiSite.State.get('fileBrowserFolder')) || {};
  },
  files() {
    return _.sortBy(
      UltiSite.Images.find({
        associated: UltiSite.State.get('fileBrowserFolder'),
      })
        .fetch()
        .concat(
          UltiSite.Documents.find({
            associated: UltiSite.State.get('fileBrowserFolder'),
          }).fetch()
        ),
      function (doc) {
        return doc.created;
      }
    );
  },
  folders() {
    const folders = [];
    if (this.type === 'folder') {
      const folder = UltiSite.Folders.findOne(this._id);
      if (folder && folder.associated.length > 0) {
        folders.push({ name: '..', isParent: true, _id: folder.associated[0], type: 'folder' });
      }
    }
    return folders.concat(
      UltiSite.Folders.find({
        associated: UltiSite.State.get('fileBrowserFolder'),
      }).fetch()
    );
  },
  fileActions() {
    const element = UltiSite.getAnyById(this._id);
    if (!element) {
      return [];
    }
    if (element.type === 'tournament') {
      const tournament = UltiSite.getTournament(element._id);
      if (!tournament) {
        return [];
      }
      const elems = tournament.teams.map(function (elem) {
        return {
          text: `Teamfoto:${elem.name}`,
          action(file) {
            console.log('Updating teamfoto');
            UltiSite.Images.update(file._id, {
              $addToSet: {
                associated: elem._id,
              },
            });
          },
        };
      });
      return elems;
    }
  },
};

Template.fileBrowserList.onCreated(function () {
  console.log('List: onCreated');
  const self = this;
});
Template.fileBrowserList.onRendered(function () {
  console.log('List: onRendered');
});

Template.fileBrowserList.helpers(_.extend({}, helpers));
Template.fileBrowserList.events({
  'click .folder-link': function (e, t) {
    UltiSite.State.set('fileBrowserFolder', this._id);
    e.preventDefault();
  },
  'click .remove-folder': function (e, t) {
    e.preventDefault();
    UltiSite.Folders.remove({
      _id: this._id,
    });
  },
  'click .rename-folder': function (e, t) {
    e.preventDefault();
    const input = $(e.currentTarget);
    UltiSite.Folders.update(
      {
        _id: this._id,
      },
      {
        $set: {
          rename: true,
        },
      }
    );
  },
  'change .folder-name': function (e, t) {
    e.preventDefault();
    const input = $(e.currentTarget);
    UltiSite.Folders.update(
      {
        _id: input.data('id'),
      },
      {
        $set: {
          name: input.val(),
        },
        $unset: {
          rename: 1,
        },
      }
    );
  },
});

Template.fileBrowserGallery.onCreated(function () {
  console.log('Gallery created for ID', this.data);
  const self = this;
});

Template.fileBrowserGallery.helpers(helpers);
Template.fileBrowserGallery.events({
  'click .action-open-folder': function (e, t) {
    e.preventDefault();
    UltiSite.State.set('fileBrowserFolder', this._id);
  },
});

Template.fileBrowserGalleryItem.events({
  'click .file-browser-gallery-item .image': function () {
    try {
      if (Template.instance().$('.file-browser-item').parent('#fileBrowserDialog')) {
        const callback = fileBrowserCallback.get();
        if (callback) {
          callback(this.file);
          return;
        }
      }
    } catch (err) {}

    FlowRouter.go('image', {
      _id: this.file._id,
      associated: this.associatedId,
    });
  },
  'click .file-browser-gallery-item .icon-image': function () {
    try {
      if (Template.instance().$('.file-browser-item').parent('#fileBrowserDialog')) {
        const callback = fileBrowserCallback.get();
        if (callback) {
          callback(this.file);
          return;
        }
      }
    } catch (err) {}
    window.open(this.file.url(), '_blank');
  },
  'click .remove-file': function (e, t) {
    e.preventDefault();
    UltiSite.confirmDialog(`Willst du die Datei ${this.file.name} wirklich löschen?`, () => {
      Meteor.call('removeFile', this.file._id);
    });
  },
  'click .edit-file': function (e) {
    e.preventDefault();
    currentlyEditedFile.set(this.file);
    $('#editFileDialog').modal('show');
  },
  'click .select-file': function (e, t) {
    e.preventDefault();
    e.stopPropagation();
    const callback = fileBrowserCallback.get();
    if (callback) {
      callback(this.file);
    }
  },
  'click .custom-action': function (e, t) {
    e.preventDefault();
    // e.stopPropagation();
    console.log('Custom:', this);
    this.action(t.data.file);
  },
});
Template.fileBrowserGalleryItem.helpers(helpers);

Template.folderTreeItem.helpers({
  isSelectedFolder() {
    return this._id === UltiSite.State.get('fileBrowserFolder');
  },
  folders() {
    return UltiSite.Folders.find({
      associated: this._id,
    });
  },
});
