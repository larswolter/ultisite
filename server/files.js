import fs from 'fs';
import os from 'os';
import sharp from 'sharp';
import Grid from 'gridfs-locking-stream';
import Base64Decode from 'base64-stream';
import { GridFSBucket, ObjectId } from 'mongodb';

const bucket = new GridFSBucket(Documents.rawDatabase(), { bucketName: 'documents-grid' });

Meteor.methods({
  retrieveNewestFiles() {
    if (!this.userId) {
      return [];
    }
    return _.sortBy(
      Images.find(
        {},
        {
          limit: 5,
          sort: {
            created: -1,
          },
        }
      )
        .fetch()
        .concat(
          Documents.find(
            {},
            {
              limit: 5,
              sort: {
                created: -1,
              },
            }
          ).fetch()
        ),
      function (doc) {
        return doc.created;
      }
    )
      .slice(0, 5)
      .map(function (doc) {
        return doc._id;
      });
  },
  retrieveAbandonedFiles() {
    if (!this.userId) {
      return [];
    }
    return Images.find({
      associated: [],
    })
      .fetch()
      .concat(
        Documents.find({
          associated: [],
        }).fetch()
      )
      .map(function (doc) {
        return doc._id;
      });
  },
  fileUploadChunk(base64, metadata, lastPackage) {
    let meteorCall;
    if (metadata._meteorCall) {
      meteorCall = metadata._meteorCall;
      delete metadata._meteorCall;
    }
    console.log('recieved file chunk, last:', lastPackage);
    if (metadata.type.indexOf('image') === 0) {
      let imgId;
      if (!metadata._id) {
        imgId = Images.insert(
          _.extend(metadata, {
            created: new Date(),
            creator: this.userId,
          })
        );
        fs.writeFileSync(`${os.tmpdir()}/${imgId}.image.temp`, base64, { encoding: 'base64' });
      } else {
        const existing = Images.findOne(metadata._id);
        fs.appendFileSync(`${os.tmpdir()}/${metadata._id}.image.temp`, base64, { encoding: 'base64' });
        imgId = existing._id;
        Images.update(imgId, { $set: { progress: Math.floor(metadata.progress) } });
      }
      if (lastPackage) {
        const fileStats = fs.statSync(`${os.tmpdir()}/${imgId}.image.temp`);
        console.log('writing image to database');
        fs.readFile(
          `${os.tmpdir()}/${imgId}.image.temp`,
          { encoding: 'base64' },
          Meteor.bindEnvironment(function (err, data) {
            if (err) {
              console.log(err);
              throw err;
            }
            Images.update(imgId, { $set: { base64: data, size: fileStats.size }, $unset: { progress: 1 } });
            fs.unlinkSync(`${os.tmpdir()}/${imgId}.image.temp`);
            console.log('finished image upload');
            if (meteorCall) {
              Meteor.call(meteorCall, Images.findOne(imgId));
            } else {
              let ref = Meteor.call('getAnyObjectByIds', metadata.associated);
              if (!ref || ref.length === 0) {
                ref = [{ type: 'files', name: 'Bilder' }];
              }
              Meteor.call('addEvent', {
                type: ref[0].type,
                _id: metadata.associated[0],
                text: 'Neues Bild hinzugefügt',
                name: ref[0].name,
                additional: ref[0].type,
                images: [imgId],
              });
            }
          })
        );
      }
      return imgId;
    }
    let docId;
    if (!metadata._id) {
      docId = Documents.insert(
        _.extend(metadata, {
          created: new Date(),
          creator: this.userId,
        })
      );
      console.log(`wrote temp file ${os.tmpdir()}/${docId}.doc.temp`);
      fs.writeFileSync(`${os.tmpdir()}/${docId}.doc.temp`, base64, { encoding: 'base64' });
    } else {
      const existing = Documents.findOne(metadata._id);
      console.log(`append temp file ${os.tmpdir()}/${docId}.doc.temp`);
      fs.appendFileSync(`${os.tmpdir()}/${metadata._id}.doc.temp`, base64, { encoding: 'base64' });
      docId = existing._id;
      Documents.update(docId, { $set: { progress: Math.floor(metadata.progress) } });
      console.log(`updated document`);
    }
    if (lastPackage) {
      console.log(`get file stats`);
      const fileStats = fs.statSync(`${os.tmpdir()}/${docId}.doc.temp`);
      console.log(`open bucket stream`);
      const wstream = bucket.openUploadStream(metadata.name, {
        metadata: {
          filename: metadata.name,
          content_type: metadata.type,
        },
      });
      wstream.on(
        'finish',
        Meteor.bindEnvironment(function (fileObj) {
          Documents.update(docId, {
            $set: {
              gridId: `${fileObj._id}`,
              size: fileStats.size,
            },
            $unset: { progress: 1 },
          });
          fs.unlinkSync(`${os.tmpdir()}/${docId}.doc.temp`);
          console.log('finished file upload');
          if (meteorCall) {
            Meteor.call(meteorCall, Documents.findOne(docId));
          } else {
            let ref = Meteor.call('getAnyObjectByIds', metadata.associated);
            if (!ref || ref.length === 0) {
              ref = [{ type: 'files', name: 'Dokumente' }];
            }
            Meteor.call('addEvent', {
              type: ref[0].type,
              _id: metadata.associated[0],
              text: 'Neues Dokument hinzugefügt',
              name: ref[0].name,
              additional: ref[0].type,
            });
          }
        })
      );
      fs.createReadStream(`${os.tmpdir()}/${docId}.doc.temp`).pipe(wstream);
    }
    return docId;
  },
  removeFile(fileId) {
    check(fileId, String);
    if (!this.userId) {
      throw new Meteor.Error('not-allowed');
    }
    let file = Images.findOne(fileId);
    if (file) {
      if (this.userId !== file.creator && !isAdmin(this.userId)) {
        throw new Meteor.Error('not-allowed');
      }
      Images.remove(fileId);
    } else {
      file = Documents.findOne(fileId);
      if (!file) {
        throw new Meteor.Error('not-found');
      }
      if (this.userId !== file.creator && !isAdmin(this.userId)) {
        throw new Meteor.Error('not-allowed');
      }
      if (file.gridId) {
        bucket.delete(
          ObjectId(file.gridId),
          Meteor.bindEnvironment((err, res) => {
            if (err) {
              console.log('Error removing gridfs file', err);
            } else {
              console.log('removed gridfs file');
              Documents.remove(fileId);
            }
          })
        );
      } else {
        console.log('removed non gridfs file');
        Documents.remove(fileId);
      }
    }

    Meteor.call('addEvent', {
      type: 'files',
      _id: file.associated[0],
      text: 'Datei entfernt',
      name: file.name,
      additional: 'Datei',
    });
  },
});

Meteor.startup(function () {
  /*
  Folders.find().observeChanges({
      removed: function(id, doc) {
      }
  }); */
});

WebApp.connectHandlers.use('/dynamicAppIcon.png', function (req, res, next) {
  const { query } = req;
  const icon = Images.findOne(settings().imageIcon);
  if (!icon) {
    res.writeHead(404);
    res.end();
    return;
  }

  res.setHeader('Content-Type', icon.type);
  if (query.size) {
    sharp(Buffer.from(icon.base64, 'base64'))
      .resize(Math.min(1024, Number(query.size)))
      .toBuffer()
      .then((data) => {
        res.writeHead(200);
        res.end(data);
      })
      .catch((err) => {
        res.writeHead(500);
        res.end(JSON.stringify(err));
      });
  } else {
    res.end(Buffer.from(icon.base64, 'base64'));
  }
});

WebApp.connectHandlers.use('/_document', (req, resp) => {
  if (!req.query.docId) {
    resp.writeHead(404);
    resp.end('Param docId required');
    return;
  }
  const doc = Documents.findOne({ _id: req.query.docId, gridId: { $exists: true } });
  if (!doc) {
    resp.writeHead(404);
    resp.end('doc not found');
    return;
  }
  console.log('opening stream', doc.gridId);
  const readstream = bucket.openDownloadStream(ObjectId(doc.gridId));
  if (readstream) {
    console.log('got read stream, piping...');
    resp.setHeader('Content-Type', doc.type);
    resp.setHeader('Content-Disposition', `attachment; filename="${doc.name}"`);
    resp.writeHead(200);
    if (req.query.base64) {
      readstream.pipe(Base64Decode.decode()).pipe(resp);
    } else {
      readstream.pipe(resp);
    }
  } else {
    console.log('file downloaderror: no readstream');
  }
});
