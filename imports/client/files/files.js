import './fileUpload.js';
import './fileGallery.html';
import './files.html';
import './files.less';

if (!HTMLCanvasElement.prototype.toBlob) {
  Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
   value (callback, type, quality) {

    var binStr = atob( this.toDataURL(type, quality).split(',')[1] ),
        len = binStr.length,
        arr = new Uint8Array(len);

    for (var i=0; i<len; i++ ) {
     arr[i] = binStr.charCodeAt(i);
    }

    callback( new Blob( [arr], {type: type || 'image/png'} ) );
  },
 });
}
let currentlyEditedFile = new ReactiveVar(undefined);
let fileBrowserCallback = new ReactiveVar(undefined);

Meteor.startup(function() {
  _.extend(UltiSite, {
      fileBrowserShowDialog(id, callback) {
            Session.set("fileBrowserFolder", id);
            fileBrowserCallback.set(callback);
            UltiSite.showModal('fileBrowserDialog');
        },

      fileBrowserHideDialog() {
            UltiSite.hideModal();
        },
    });
});

Template.registerHelper("fileRootFolder", function() {
  return UltiSite.Folders.findOne(UltiSite.settings().rootFolderId);
});

let getIcon = function() {
    var file = this;
    if (!file.type && this.file)
        file = this.file;
    if (!file.type)
        return "fa-question";
    if (file.type.indexOf('image')===0)
        return "fa-file-image-o";
    else if (file.type.indexOf('video')===0)
        return "fa-file-video-o";
    return "fa-file-o";
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


Template.fileBrowser.onCreated(function() {
  Session.set("fileBrowserFolder", UltiSite.settings().rootFolderId);
  Session.setDefault("fileBrowserGalleryView", false);

  this.autorun(() => {
      const id = FlowRouter.getParam("_id");
      if (id)
          {Session.set("fileBrowserFolder", id);}
    });
  this.autorun(() => {
      this.subscribe('Files', Session.get("fileBrowserFolder"));
    });

  this.readme = new ReactiveVar();

  this.autorun(() => {
      let readmeFile = UltiSite.Documents.findOne({
          associated: Session.get("fileBrowserFolder"),
          name: 'README.md',
        });
      if (readmeFile)
          {HTTP.get(readmeFile.url(),(err,res) => {
                if(!err)
                    this.readme.set(res.content);
            });}
      else
            {this.readme.set(undefined);}
    });
});

Template.fileBrowser.events({
  'click .toggle-gallery-view'(e,t) {
        e.preventDefault();
        Session.set("fileBrowserGalleryView",!Session.get("fileBrowserGalleryView"));
    },
  'click .btn-new-folder'(e, t) {
        e.preventDefault();
        console.log("Add folder", e);
        UltiSite.Folders.insert({
            rename: true,
            name: "Neuer Ordner",
            associated: [Session.get("fileBrowserFolder")]
        });
    },
});

Template.fileBrowser.helpers({
  galleryView() {
        return Session.get("fileBrowserGalleryView");
    },
  readme() {
        return Template.instance().readme.get(); 
    },
  curFolder() {
        return UltiSite.getAnyById(Session.get("fileBrowserFolder"))||{_id:Session.get("fileBrowserFolder")};
    },
  rootFolder() {
        return UltiSite.getAnyById(UltiSite.settings().rootFolderId);
    },
});


Template.fileBrowserItem.events({
  'click .remove-file'(e, t) {
        e.preventDefault();
        UltiSite.confirmDialog(`Willst du die Datei ${this.name} wirklich löschen?`,() => {         
            Meteor.call('removeFile',this._id);
        });
    },
  'click .edit-file'(e) {
        e.preventDefault();
        currentlyEditedFile.set(this);
        $('#editFileDialog').modal('show');
    },
  'click .select-file'(e, t) {
        e.preventDefault();
        e.stopPropagation();
        var callback = fileBrowserCallback.get();
        if (callback)
            callback(this);
    },
});

Template.fileBrowserItem.helpers({
  needsSelect() {
        return fileBrowserCallback.get();
    },
  icon: getIcon,
});

Template.fileBrowserDialog.onCreated(function() {
  let self = this;
  this.initialFolder = Session.get("fileBrowserFolder");
  this.activePane = new ReactiveVar(this.initialFolder);
});

Template.fileBrowserDialog.events({
  'hidden.bs.modal .modal'(e,t) {
        fileBrowserCallback.set(null);
    },
  'click .action-switch-source'(e,t) {
        e.preventDefault();
        if(t.$(e.currentTarget).attr("data-value") !== 'search')
            Session.set("fileBrowserFolder",t.$(e.currentTarget).attr("data-value"));
        t.activePane.set(t.$(e.currentTarget).attr("data-value"));
    },
  'click .action-select-nothing'(e) {
        e.preventDefault();
        var callback = fileBrowserCallback.get();
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
        return Session.get("fileBrowserFolder");
    },
  activePane(){
        return Template.instance().activePane.get();
    },
  dialogSelection() {
        return fileBrowserCallback.get();
    },
});


let helpers = {
  icon: getIcon,
  folder() {
        return UltiSite.getAnyById(Session.get("fileBrowserFolder")) || {};
    },
  files() {
        return _.sortBy(UltiSite.Images.find({
            associated: Session.get("fileBrowserFolder")
        }).fetch().concat(
            UltiSite.Documents.find({
                associated: Session.get("fileBrowserFolder")
            }).fetch()), function(doc) {
            return doc.created;
        });
    },
  folders() {
        const folders = [];
        if (this.type === "folder") {
            var folder = UltiSite.Folders.findOne(this._id);
            if (folder && folder.associated.length > 0) {
                folders.push({name:'..',isParent:true,_id:folder.associated[0], type:'folder'});
            }
        }
        return folders.concat( UltiSite.Folders.find({
            associated: Session.get("fileBrowserFolder")
        }).fetch());
    },
  fileActions() {
        var element = UltiSite.getAnyById(this._id);
        if (!element)
            return [];
        if (element.type === "tournament") {
            var turnier = UltiSite.getTournament(element._id);
            if (!turnier)
                return [];
            var elems = UltiSite.Teams.find({
                _tournamentId: element._id
            }).map(function(elem) {
                return {
                    text: "Teamfoto:" + elem.name,
                    action: function(file) {
                        console.log("Updating teamfoto");
                        UltiSite.Images.update(file._id, {
                            $addToSet: {
                                associated: elem._id
                            }
                        });
                    }
                };
            });
            return elems;
        }
    },
};


Template.fileBrowserList.onCreated(function() {
  console.log("List: onCreated");
  let self = this;
});
Template.fileBrowserList.onRendered(function() {
  console.log("List: onRendered");
});

Template.fileBrowserList.helpers(_.extend({}, helpers));
Template.fileBrowserList.events({
  'click .folder-link'(e, t) {
        Session.set("fileBrowserFolder",this._id);
        e.preventDefault();
    },
  'click .remove-folder'(e, t) {
        e.preventDefault();
        UltiSite.Folders.remove({
            _id: this._id
        });
    },
  'click .rename-folder'(e, t) {
        e.preventDefault();
        var input = $(e.currentTarget);
        UltiSite.Folders.update({
            _id: this._id
        }, {
            $set: {
                rename: true
            }
        });
    },
  'change .folder-name'(e, t) {
        e.preventDefault();
        var input = $(e.currentTarget);
        UltiSite.Folders.update({
            _id: input.data('id')
        }, {
            $set: {
                name: input.val()
            },
            $unset: {
                rename: 1
            }
        });
    },
});

Template.fileBrowserGallery.onCreated(function() {
  console.log("Gallery created for ID", this.data);
  let self = this;
});

Template.fileBrowserGallery.helpers(helpers);
Template.fileBrowserGallery.events({
  'click .action-open-folder'(e,t) {
        e.preventDefault();
        Session.set("fileBrowserFolder",this._id);
    },
});

Template.fileBrowserGalleryItem.events({
  'click .file-browser-gallery-item .image'() {
        try {
            if (Template.instance().$('.file-browser-item').parent('#fileBrowserDialog')) {
                var callback = fileBrowserCallback.get();
                if (callback) {
                    callback(this.file);
                    return;
                }
            }
        } catch (err) {}

        FlowRouter.go('image', {
            _id: this.file._id,
            associated: this.associatedId
        });
    },
  'click .file-browser-gallery-item .icon-image'() {
        try {
            if (Template.instance().$('.file-browser-item').parent('#fileBrowserDialog')) {
                var callback = fileBrowserCallback.get();
                if (callback) {
                    callback(this.file);
                    return;
                }
            }
        } catch (err) {}
        window.open(this.file.url(), '_blank');
    },
  'click .remove-file'(e, t) {
        e.preventDefault();
        UltiSite.confirmDialog(`Willst du die Datei ${this.file.name} wirklich löschen?`,() => {         
            Meteor.call('removeFile',this.file._id);
        });
    },
  'click .edit-file'(e) {
        e.preventDefault();
        currentlyEditedFile.set(this.file);
        $('#editFileDialog').modal('show');
    },
  'click .select-file'(e, t) {
        e.preventDefault();
        e.stopPropagation();
        var callback = fileBrowserCallback.get();
        if (callback)
            callback(this.file);
    },
  'click .custom-action'(e, t) {
        e.preventDefault();
        //e.stopPropagation();
        console.log("Custom:", this);
        this.action(t.data.file);
    },
});
Template.fileBrowserGalleryItem.helpers(helpers);

Template.folderTreeItem.helpers({
  isSelectedFolder() {
        return this._id === Session.get("fileBrowserFolder");
    },
  folders() {
        return UltiSite.Folders.find({
            associated: this._id
        });
    },
});

