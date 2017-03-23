import blueimp from 'blueimp-load-image';


Template.fileUploader.onCreated(function(){
    this.uploading = new ReactiveVar(false);
    this.dragndrop = new ReactiveVar(false); 
    // check for drag n drop support
    const div = document.createElement('div');
    this.dragndrop.set( (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 
        'FormData' in window && 
        'FileReader' in window);
});

Template.fileUploader.helpers({
    uploading() {
        return Template.instance().uploading.get();
    },
    dragndrop() {
        return Template.instance().dragndrop.get();
    },
});

Template.fileUploader.events({
    'dragover .drag-here, dragenter .drag-here': function(e, t) {
        e.preventDefault();
        e.stopPropagation();
        t.$('.drag-here').addClass('drag-over');
    },
    'dragleave .drag-here, dragend .drag-here': function(e, t) {
        e.preventDefault();
        e.stopPropagation();
        t.$('.drag-here').removeClass('drag-over');
    },
    'drop .drag-here': function(e, t) {
        e.preventDefault();
        e.stopPropagation();
        t.$('.drag-here').removeClass('drag-over');
        t.uploading.set(true);
        UltiSite.uploadFiles(e.originalEvent.dataTransfer.files, this.associatedId, t);
    },
    'click .add-file': function(e, t) {
        t.$('input.file-upload').trigger("click");
    },
    'change input.file-upload': function(event, template) {
        template.uploading.set(true);
        UltiSite.uploadFiles(event.target.files, this.associatedId, template);
    }
});




const uploadQueue = [];
const CHUNK_SIZE = 256*1024;

UltiSite.uploadQueue = uploadQueue;

UltiSite.triggerUpload = function() {
    if(uploadQueue.length===0)
        return;
    console.log('uploading from queue',uploadQueue[0].metadata && uploadQueue[0].metadata.name);
    if(!uploadQueue[0].progress) {
        uploadQueue[0].errors=0;
        uploadQueue[0].progress = {
            offset: 0,
            total: uploadQueue[0].file?uploadQueue[0].file.size: uploadQueue[0].base64.length
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
    }
};
UltiSite.pushToUploadQueue = function(fileData) {
    uploadQueue.push(fileData);
};

UltiSite.uploadFiles = function(files, associatedId, template) {
    let filesToUpload = files.length;
        for(let i=0;i < files.length;i++) {
            const file = files.item(i);
            
            const metadata = {};
            metadata.associated = [associatedId];
            metadata.tags = [];
            metadata.creator = Meteor.userId();
            metadata.name = file.name;
            metadata.type = file.type;
            if(file.type.indexOf('image') === 0) {
                blueimp(file, (img, imgMeta) => {
                    if(img.type === "error") {
                        UltiSite.notify("Fehler beim vorbereiten des Bildes");
                        console.log(`Error, parsing image`,img);
                    } else {
                        if(imgMeta && imgMeta.exif)
                            metadata.exif = imgMeta.exif.getAll();
                        img.toBlob((file)=>{
                            UltiSite.pushToUploadQueue({file,metadata});
                            filesToUpload--;
                            if(!filesToUpload) {
                                template.uploading.set(false);
                                UltiSite.triggerUpload();
                            }
                        }, "image/jpeg", 0.90);
                    }
                },{
                    meta: true,
                    canvas: true,
                    orientation: true,
                    disableImageHead: true,
                    disableExifThumbnail: true,
                    maxWidth: 2400,
                    maxHeigth: 2400
                });
            } else {
                UltiSite.pushToUploadQueue({file,metadata});
                filesToUpload--;
                if(!filesToUpload) {
                    template.uploading.set(false);
                    UltiSite.triggerUpload();
                }
            }
        }
};