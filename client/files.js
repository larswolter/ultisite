var currentlyEditedFile = new ReactiveVar(undefined);
var fileBrowserCallback = new ReactiveVar(undefined);

Meteor.startup(function() {
    _.extend(UltiSite, {
        fileRootFolder: function() {
            return UltiSite.Folders.findOne({
                name: "/"
            })||{};
        },
        fileBrowserShowDialog: function(id, callback) {
            Session.set("fileBrowserDialogSource", null);
            Meteor.call("getAnyObjectByIds", [id], function(err, res) {
                if (!err) {
                    Session.set("fileBrowserDialogSource", res[0]);
                } else
                    console.log(err);
            });
            fileBrowserCallback.set(callback);
            UltiSite.showModal('fileBrowserDialog');
        },

        fileBrowserHideDialog: function() {
            UltiSite.hideModal();
        }
    });
});

Template.registerHelper("fileRootFolder", function(){
    return UltiSite.fileRootFolder();
});

var getIcon = function() {
    var file = this;
    if (!file.type)
        file = this.file;
    if (!file.type)
        return "fa-question";
    if (file.type.indexOf('image')===0)
        return "fa-file-image-o";
    else if (file.type.indexOf('video')===0)
        return "fa-file-video-o";
    else
        return "fa-file-o";
};
// FUTURE: add editing capabilities
Template.editFileDialog.helpers({
    file: function() {
        return currentlyEditedFile.get();
    },
    icon: getIcon,
    assozierteElemente: function() {
        return UltiSite.getAnyById(currentlyEditedFile.get().associated);
    }
});

const uploadQueue = [];
const CHUNK_SIZE = 256*1024;
UltiSite.triggerUpload = function() {
    if(uploadQueue.length===0)
        return;
    if(!uploadQueue[0].progress) {
        uploadQueue[0].errors=0;
        uploadQueue[0].progress = {
            offset: 0,
            total: uploadQueue[0].file.size
        };
    }
    if(uploadQueue[0].file) {
        const blobSlice = uploadQueue[0].file.slice(uploadQueue[0].progress.offset,uploadQueue[0].progress.offset+CHUNK_SIZE);
        const reader = new FileReader();
        reader.onload = function (e) {
            const base64 = reader.result.substr(reader.result.indexOf(',')+1);
            const lastPackage = (uploadQueue[0].progress.offset + CHUNK_SIZE) >= uploadQueue[0].progress.total;
            Meteor.call('fileUploadChunk', base64, uploadQueue[0].metadata,lastPackage, (err,res)=>{
                if(err && uploadQueue[0].errors > 3)
                    return uploadQueue[0].error=err;
                if(err) {
                    console.log(err);
                    uploadQueue[0].errors++;
                }
                uploadQueue[0].metadata._id = res;
                uploadQueue[0].progress.offset += CHUNK_SIZE;
                uploadQueue[0].progress.total =uploadQueue[0].file.size;
                uploadQueue[0].metadata.progress = (100 / uploadQueue[0].file.size) * uploadQueue[0].progress.offset;
                if(lastPackage)
                    uploadQueue.shift();
                UltiSite.triggerUpload();
            });
        };
        reader.readAsDataURL(blobSlice);
    } else if(uploadQueue[0].base64) {
        const lastPackage = (uploadQueue[0].progress.offset + CHUNK_SIZE) >= uploadQueue[0].progress.total;
        Meteor.call('fileUploadChunk', uploadQueue[0].base64.substr(uploadQueue[0].progress.offset,CHUNK_SIZE()), uploadQueue[0].metadata, lastPackage, (err,res)=>{
            if(err && uploadQueue[0].errors > 3)
                return uploadQueue[0].error=err;
            if(err)
                uploadQueue[0].errors++;
            uploadQueue[0].metadata._id = res;
            uploadQueue[0].progress.offset += CHUNK_SIZE;
            uploadQueue[0].progress.total =uploadQueue[0].base64.length;
            if(lastPackage)
                uploadQueue.shift();
            UltiSite.triggerUpload();
        });
    }
};

var fileUploadEvents = {
    'click .add-file': function(e, t) {
        t.$('.fileInput').trigger("click");
    },
    'change .fileInput': function(event, template) {
        console.log('Uploading:',event);
        for(let i=0;i < event.target.files.length;i++) {
            const file = event.target.files.item(i);
            console.log('Uploading:',file);
            const metadata = {};
            if (template.activeFolder)
                metadata.associated = [template.activeFolder.get()];
            else
                metadata.associated = [UltiSite.fileRootFolder()._id];
            metadata.tags = [];
            metadata.creator = Meteor.userId();
            metadata.name = file.name;
            metadata.type = file.type;
            
            uploadQueue.push({file,metadata});
        }
        UltiSite.triggerUpload();
    }
};



Template.fileBrowser.onCreated(function() {
    this.galleryView = new ReactiveVar(false);
    this.subscribe('Files');
    if(!FlowRouter.getParam("_id"))
        this.autorun((comp)=> {
            if(!UltiSite.fileRootFolder()._id)
                return;
            FlowRouter.go("files", {
                _id: UltiSite.fileRootFolder()._id
            });
            comp.stop();
        });
    else
        this.autorun(()=> {
            var id = FlowRouter.getParam("_id");
            this.subscribe('Files',id);            
        });
});

Template.fileBrowser.helpers({
    galleryView: function() {
        return Template.instance().galleryView.get();
    },
    curFolder: function() {
        var obj;
        if (FlowRouter.getParam("_id") === "newest")
            obj = {
                special: "newest"
            };
        else if (FlowRouter.getParam("_id") === "abandoned")
            obj = {
                special: "abandoned"
            };
        else if (FlowRouter.getParam("_id"))
            obj = UltiSite.getAnyById(FlowRouter.getParam("_id"));
        else
            obj = UltiSite.getAnyById(UltiSite.fileRootFolder()._id);
        return obj;
    },
    rootFolder: function() {
        return UltiSite.getAnyById(UltiSite.fileRootFolder()._id);
    },
    newFiles: function() {
        return _.sortBy(UltiSite.Images.find({}, {
            limit: 5,
            sort: {
                created: -1
            }
        }).fetch().concat(
            UltiSite.Documents.find({}, {
                limit: 5,
                sort: {
                    created: -1
                }
            }).fetch()), function(doc) {
            return doc.created;
        }).slice(0, 5);
    },
    abandonedFiles: function() {
        return UltiSite.Images.find({
            associated: []
        }).fetch().concat(
            UltiSite.Documents.find({
                associated: []
            }).fetch());
    },
});


Template.fileBrowserItem.events({
    'click .toggle-gallery-view': function(e,t) {
        e.preventDefault();
        t.galleryView.set(!t.galleryView.get());
    },
    'click .remove-file': function(e, t) {
        e.preventDefault();
        UltiSite.confirmDialog(`Willst du die Datei ${this.name} wirklich löschen?`,() => {         
            Meteor.call('removeFile',this._id);
        });
    },
    'click .edit-file': function(e) {
        e.preventDefault();
        currentlyEditedFile.set(this);
        $('#editFileDialog').modal('show');
    },
    'click .select-file': function(e, t) {
        e.preventDefault();
        e.stopPropagation();
        var callback = fileBrowserCallback.get();
        if (callback)
            callback(this);
    }
});

Template.fileBrowserItem.helpers({
    needsSelect: function() {
        return fileBrowserCallback.get();
    },
    icon: getIcon
});

Template.fileBrowserDialog.onCreated(function(){
    var self=this;
    this.activePane = new ReactiveVar("element");
    this.autorun(function(){
        self.subscribe('Files',Session.get("fileBrowserDialogSource"));        
    });
});

Template.fileBrowserDialog.events({
    'hidden.bs.modal .modal': function(e,t) {
        Session.set("fileBrowserDialogSource", null);
        fileBrowserCallback.set(null);
    },
    'click .action-switch-source': function(e,t) {
        e.preventDefault();
        t.activePane.set(t.$(e.currentTarget).attr("data-value"));
    },
    'click .action-select-nothing': function(e) {
        e.preventDefault();
        var callback = fileBrowserCallback.get();
        if (callback) {
            callback(null);
        }
    }

});

Template.fileBrowserDialog.helpers({
    fileBrowserDialogSource: function() {
        return Session.get("fileBrowserDialogSource");
    },
    activePane: function(){
        return Template.instance().activePane.get();
    },
    dialogSelection: function() {
        return fileBrowserCallback.get();
    }
});


var helpers = {
    icon: getIcon,
    folder: function() {
        return UltiSite.getAnyById(Template.instance().activeFolder.get()) || {};
    },
    parentFolder: function() {
        if (this.type == "folder") {
            var folder = UltiSite.Folders.findOne(this._id);
            if (folder && folder.associated.length > 0) {
                return (UltiSite.getAnyById(folder.associated[0]) || {});
            }
        }
    },
    files: function() {
        return _.sortBy(UltiSite.Images.find({
            associated: Template.instance().activeFolder.get()
        }).fetch().concat(
            UltiSite.Documents.find({
                associated: Template.instance().activeFolder.get()
            }).fetch()), function(doc) {
            return doc.created;
        });
    },
    folders: function() {
        return UltiSite.Folders.find({
            associated: Template.instance().activeFolder.get()
        });
    },
    fileActions: function() {
        var element = UltiSite.getAnyById(this._id);
        if (!element)
            return [];
        if (element.type === "tournament") {
            var turnier = UltiSite.Tournaments.findOne(element._id);
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
    }
};


Template.fileBrowserList.onCreated(function() {
    console.log("List: onCreated");
    var self = this;
    self.activeFolder = new ReactiveVar(this.data._id);
    self.autorun(function() {
        if (FlowRouter.getRouteName() == "files")
            self.activeFolder.set(FlowRouter.getParam("_id"));
        else
            self.activeFolder.set(self.data._id);
    });

    self.autorun(function() {
        self.subscribe('Files',self.activeFolder.get());
    });
    self.readme = new ReactiveVar();
    
    self.autorun(function() {
        var readmeFile = UltiSite.Documents.findOne({
            associated: self.activeFolder.get(),
            'original.name':'README.md'
        });
        if(readmeFile)
            HTTP.get(readmeFile.url(),function(err,res){
                if(!err)
                    self.readme.set(res.content);
            });
        else
            self.readme.set(undefined);
    });
});
Template.fileBrowserList.onRendered(function() {
    console.log("List: onRendered");
});

Template.fileBrowserList.helpers(_.extend({
    readme: function() {
        return Template.instance().readme.get(); 
    }
},helpers));
Template.fileBrowserList.events(_.extend(fileUploadEvents, {
    'click .folder-link': function(e, t) {
        if (FlowRouter.getRouteName() != "files") {
            t.activeFolder.set(this._id);
            e.preventDefault();
        }
    },
    'click .btn-new-folder': function(e, t) {
        e.preventDefault();
        console.log("Add folder", e);
        UltiSite.Folders.insert({
            rename: true,
            name: "Neuer Ordner",
            associated: [t.activeFolder.get()]
        });
    },
    'click .remove-folder': function(e, t) {
        e.preventDefault();
        UltiSite.Folders.remove({
            _id: this._id
        });
    },
    'click .rename-folder': function(e, t) {
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
    'change .folder-name': function(e, t) {
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
    }
}));

Template.fileBrowserGallery.onCreated(function() {
    console.log("Gallery created for ID",this.data);

    var self = this;
    self.activeFolder = new ReactiveVar(this.data._id);
    self.autorun(function() {
        self.subscribe('Files',self.activeFolder.get());
    });
});

Template.fileBrowserGallery.helpers(helpers);
Template.fileBrowserGallery.events(fileUploadEvents);

Template.fileBrowserGalleryItem.events({
    'click .file-browser-gallery-item .image': function() {
        try {
            if (Template.instance().$('.file-browser-item').parent('#fileBrowserDialog')) {
                var callback = fileBrowserCallback.get();
                if (callback) {
                    callback(this.file);
                    return;
                }
            }
        } catch (err) {}

        if (this.file.type.indexOf('image')===0)
            FlowRouter.go('image', {
                _id: this.file._id,
                associated: this.associatedId
            });
        else
            FlowRouter.go(this.file.url());
    },
    'click .remove-file': function(e, t) {
        e.preventDefault();
        UltiSite.confirmDialog(`Willst du die Datei ${this.file.name} wirklich löschen?`,() => {         
            Meteor.call('removeFile',this.file._id);
        });
    },
    'click .edit-file': function(e) {
        e.preventDefault();
        currentlyEditedFile.set(this.file);
        $('#editFileDialog').modal('show');
    },
    'click .select-file': function(e, t) {
        e.preventDefault();
        e.stopPropagation();
        var callback = fileBrowserCallback.get();
        if (callback)
            callback(this.file);
    },
    'click .custom-action': function(e, t) {
        e.preventDefault();
        //e.stopPropagation();
        console.log("Custom:", this);
        this.action(t.data.file);
    }
});
Template.fileBrowserGalleryItem.helpers(helpers);

Template.folderTreeItem.helpers({
    isSelectedFolder: function() {
        if (FlowRouter.getParam('_id'))
            return this._id === FlowRouter.getParam('_id');
        else
            return this._id === UltiSite.fileRootFolder()._id;
    },
    folders: function() {
        return UltiSite.Folders.find({
            associated: this._id
        });
    }
});

Template.fileList.helpers({
    images: function() {
        return UltiSite.Images.find({
            associated: this._id
        });
    },
    documents: function() {
        return UltiSite.Documents.find({
            associated: this._id
        });
    }
});

Template.fileList.events(fileUploadEvents);
