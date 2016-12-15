import Grid from 'gridfs-locking-stream';

const gridFS=Grid(UltiSite.Documents.rawDatabase(),Npm.require('mongodb'),'documents-grid');


Meteor.startup(function(){
    // Update participants without safestateDate
/*
    UltiSite.Participants.find({safeStateDate:{$exists:false}}).forEach((p)=>{
        UltiSite.Participants.update(p._id,{$set:{safeStateDate:p.entryDate}});
    });
    UltiSite.Teams.find({teamType:/Verein/}).forEach((p)=>{
        UltiSite.Teams.update(p._id,{$set:{clubTeam:true}});
    });
    UltiSite.Participants.find().forEach((p)=>{
        let team = p.teamId;
        let part = p._id;
        delete p._id;
        delete p.teamId;
        delete p.tournamentId;
        UltiSite.Teams.update(team,{$push:{participants:p}});
        UltiSite.Participants.remove(part);
    });
    UltiSite.Teams.find({participants:{$exists:true},'participants.username':{$exists:false}}).forEach((t)=>{
        t.participants.forEach((p)=>{
            let user = Meteor.users.findOne(p.user);
            if(user)
                UltiSite.Teams.update({'participants.user':p.user,_id:t._id},{$set:{
                    'participants.$.username':user.username,
                    'participants.$.sex':user.profile.sex
                }});
            else
                UltiSite.Teams.update({'participants.user':p.user,_id:t._id},{$set:{
                    'participants.$.username':p.user,
                    'participants.$.sex':p.sex?'W':'M'
                }});
        });
    });
    UltiSite.Teams.find({participants:{$exists:true},'participants.responsibleName':{$exists:false}}).forEach((t)=>{
        t.participants.forEach((p)=>{
            let user = Meteor.users.findOne(p.responsible);
            if(user)
                UltiSite.Teams.update({'participants.user':p.user,_id:t._id},{$set:{
                    'participants.$.responsibleName':user.username}});
        });
    });
    UltiSite.Teams.find({responsible:"[object Object]"}).forEach((t)=>{
        UltiSite.Teams.update({_id:t._id},{$set:{
            responsible:null}});
    });

    UltiSite.Teams.find({responsible:{$ne:null},responsibleName:{$exists:false}}).forEach((t)=>{
        const user = Meteor.users.findOne(t.responsible);
        if(user)
            UltiSite.Teams.update(t._id,{
                $set:{
                    responsibleName:user.username
                }
            });
    });
  */
    UltiSite.Teams.find({state:{$exists:false}}).forEach((t)=>{
        UltiSite.Teams.update(t._id,{$set:{state:'geplant'}});
    });
    UltiSite.Images.find({size:{$exists:false},base64:{$exists:true}}).forEach((img)=>{
        UltiSite.Images.update(img._id,{$set:{size:(img.base64.length - 814) / 1.37}});
    });
    UltiSite.OldImages.find().forEach((fo) => {
      if (!fo.isUploaded())
        return;
      if (!fo.hasStored('images'))
        return;
      console.log('migrating ', fo.name());
      var Readable = Npm.require('stream').Readable;
      var readStream = new Readable().wrap(fo.createReadStream('images'));
      const buffers = [];
      readStream.on('data', data => buffers.push(data));
      readStream.on('end', Meteor.bindEnvironment(function () {
        const buffer = Buffer.concat(buffers);
        UltiSite.Images.upsert(fo._id,_.extend({}, {
            _id:fo._id,
          associated: fo.associated,
          tags:fo.tags,
          size:fo.original.size,
          creator:fo.creator,
          name:fo.name(),
          base64: buffer.toString('base64'),
          type: fo.original.type,
          created: fo.uploadedAt,
        }));
        UltiSite.OldImages.remove(fo._id);
      }));
    });    
    if(gridFS)
    UltiSite.OldDocuments.find().forEach((fo) => {
      if (!fo.isUploaded())
        return;
      if (!fo.hasStored('documents'))
        return;
      if(!fo._id)
        return;
      const docId = fo._id+''; 
      console.log('migrating ', fo.name(),docId);
      var Readable = Npm.require('stream').Readable;
      var readStream = new Readable().wrap(fo.createReadStream('documents'));
        gridFS.createWriteStream({
            filename: fo.name(),
            content_type: fo.type
        },Meteor.bindEnvironment(function(err,wstream) {
            if(err)
                console.log('gridFs Error:',err);
            else
                wstream.on('close',Meteor.bindEnvironment(function(fileObj) {
                    const file = {
                        _id:fo._id,
                        associated: fo.associated,
                        tags:fo.tags,
                        size:fo.original.size,
                        creator:fo.creator,
                        name:fo.name(),
                        gridId: fileObj._id+'',
                        type: fo.original.type,
                        created: fo.uploadedAt,
                    };
                    UltiSite.Documents.upsert(file._id,file, (err) => {
                        if(err)
                            console.log('Mongo Error:',err,file);
                        else {
                            UltiSite.OldDocuments.remove(docId);
                            console.log('migrated ', fo.name());
                        }
                    });
                }));
            readStream.pipe(wstream);
        }));
    });    
});
