import fs from 'fs';
import os from 'os';
import sharp from 'sharp';
import Grid from 'gridfs-locking-stream';

const gridFS=Grid(UltiSite.Documents.rawDatabase(),Npm.require('mongodb'),'documents-grid');

Meteor.methods({
    retrieveNewestFiles: function() {
        if (!this.userId)
            return;
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
        }).slice(0, 5).map(function(doc) {
            return doc._id;
        });
    },
    retrieveAbandonedFiles: function() {
        if (!this.userId)
            return;
        return UltiSite.Images.find({
            associated: []
        }).fetch().concat(
            UltiSite.Documents.find({
                associated: []
            }).fetch()).map(function(doc) {
            return doc._id;
        });
    },
    fileUploadChunk: function(base64, metadata,lastPackage) {
        if(metadata.type.indexOf('image')===0) {
            let imgId;
            if(!metadata._id) {
                imgId = UltiSite.Images.insert(
                    _.extend(metadata,{
                        created: new Date(),
                        creator:this.userId,
                    })
                );
                fs.writeFileSync(os.tmpdir()+'/'+imgId+'.image.temp', base64, {encoding:'base64'});
                return imgId;
            }
            else {
                const existing = UltiSite.Images.findOne(metadata._id);
                fs.appendFileSync(os.tmpdir()+'/'+metadata._id+'.image.temp', base64, {encoding:'base64'});
                imgId = existing._id;
                UltiSite.Images.update(imgId,{$set:{progress:metadata.progress}});
            }
            if(lastPackage) {
                fs.readFile(os.tmpdir()+'/'+imgId+'.image.temp', {encoding:'base64'},Meteor.bindEnvironment(function(err,data) {
                    if(err) {
                        console.log(err);
                        throw err;
                    }
                    UltiSite.Images.update(imgId,{$set:{base64:data},$unset:{progress:1}});
                    fs.unlink(os.tmpdir()+'/'+imgId+'.image.temp');
                }));
            }
            return imgId;
        } else {
            let docId;
            if(!metadata._id) {
                docId = UltiSite.Documents.insert(
                    _.extend(metadata,{
                        created: new Date(),
                        creator:this.userId,
                    })
                );
                fs.writeFileSync(os.tmpdir()+'/'+docId+'.doc.temp', base64, {encoding:'base64'});
                return docId;
            }
            else {
                const existing = UltiSite.Documents.findOne(metadata._id);
                fs.appendFileSync(os.tmpdir()+'/'+metadata._id+'.doc.temp', base64, {encoding:'base64'});
                docId = existing._id;
                UltiSite.Documents.update(docId,{$set:{progress:metadata.progress}});
            }
            if(lastPackage) {
                gridFS.createWriteStream({
                    filename: metadata.name,
                    content_type: metadata.type
                },Meteor.bindEnvironment(function(err,wstream) {
                    if(err) {
                        console.log(err);
                        fs.unlink(os.tmpdir()+'/'+docId+'.doc.temp');
                        throw err;
                    }
                    wstream.on('close',Meteor.bindEnvironment(function(fileObj) {
                        UltiSite.Documents.update(docId,{$set:{gridId:fileObj._id+''},$unset:{progress:1}});
                        fs.unlink(os.tmpdir()+'/'+docId+'.doc.temp');
                    }));
                    fs.createReadStream(os.tmpdir()+'/'+docId+'.doc.temp', {encoding:'base64'}).pipe(wstream);
                }));
            }
            return docId;
        }
    },
    removeFile(fileId) {
        if(!this.userId)
            throw new Meteor.Error('not-allowed');
        let file = UltiSite.Images.findOne(fileId);
        if(file) {
            if(this.userId!==file.creator)
                throw new Meteor.Error('not-allowed');
            UltiSite.Images.remove(fileId);
        } else {
            file = UltiSite.Documents.findOne(fileId);
            if(!file)
                throw new Meteor.Error('not-found');
            if(this.userId!==file.creator)
                throw new Meteor.Error('not-allowed');
            if(file.gridId)
                gridFS.remove({_id:file.gridId});              
            UltiSite.Documents.remove(fileId);
        }
        
        Meteor.call("addEvent", {
            type: "files",
            _id: file.associated[0],
            text: 'Datei entfernt',
            name: file.name,
            additional:'Datei'
        });
    }
});


Meteor.startup(function() {
    /*
    UltiSite.Folders.find().observeChanges({
        removed: function(id, doc) {
        }
    });*/
});

WebApp.connectHandlers.use("/dynamicAppIcon", function(req, res, next) {
    let query = Npm.require('url').parse(req.url,true).query;
    let icon = UltiSite.Images.findOne(UltiSite.settings().imageIcon);
    if(!icon) {
        res.writeHead(404);
        res.end();
        return;
    }
        
    res.setHeader('Content-Type', icon.type);
    if(query.size)
        sharp(new Buffer(icon.base64, 'base64'))
            .resize(Number(query.size))
            .toBuffer()
            .then( data => {
                res.writeHead(200);
                res.end(data);                
            } )
            .catch( err => {
                res.writeHead(500);
                res.end(JSON.stringify(err));
            } );       
    else
        res.end(new Buffer(icon.base64, 'base64'));
});

WebApp.connectHandlers.use('/_document', (req, resp) => {
    if (!req.query.docId) {
        resp.writeHead(404);
        resp.end('Param docId required');
        return;
    }
    const doc = UltiSite.Documents.findOne({_id:req.query.docId,gridId:{$exists:true}});
    if (!doc) {
        resp.writeHead(404);
        resp.end('doc not found');
        return;
    }
    gridFS.createReadStream({_id:doc.gridId}, function (error, readstream) {
    if (readstream) {
        resp.setHeader('Content-Type', doc.type);
        resp.writeHead(200);
        readstream.pipe(resp);
    } else {
        console.log(error)
    }
    });
});