import Grid from 'gridfs-locking-stream';

const gridFS=Grid(UltiSite.Documents.rawDatabase(),Npm.require('mongodb'),'documents-grid');


Meteor.startup(function(){
    console.log('starting migrations...');
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
    UltiSite.Teams.find({state:{$exists:false}}).forEach((t)=>{
        UltiSite.Teams.update(t._id,{$set:{state:'geplant'}});
    });
    UltiSite.Images.find({size:{$exists:false},base64:{$exists:true}}).forEach((img)=>{
        UltiSite.Images.update(img._id,{$set:{size:(img.base64.length - 814) / 1.37}});
    });
  */
    UltiSite.Teams.find({image:{$exists:false}}).forEach((t)=>{
        const image = UltiSite.Images.findOne({associated:t._id});
        if(image)
            UltiSite.Teams.update(t._id,{
                $set:{
                    image: image._id
                }
            });
    });
    UltiSite.Blogs.find({author:{$ne:null},authorName:{$exists:false}}).forEach((t)=>{
        const user = Meteor.users.findOne(t.author);
        if(user)
            UltiSite.Blogs.update(t._id,{
                $set:{
                    authorName:user.username
                }
            });
    });
    UltiSite.WikiPages.find({editor:{$ne:null},editorName:{$exists:false}}).forEach((t)=>{
        const user = Meteor.users.findOne(t.editor);
        if(user)
            UltiSite.WikiPages.update(t._id,{
                $set:{
                    editorName:user.username
                }
            });
    });
    UltiSite.WikiPageDiscussions.find({editor:{$ne:null},editorName:{$exists:false}}).forEach((t)=>{
        const user = Meteor.users.findOne(t.editor);
        if(user)
            UltiSite.WikiPageDiscussions.update(t._id,{
                $set:{
                    editorName:user.username
                }
            });
    });
    UltiSite.ContentVersions.find({author:{$ne:null},authorName:{$exists:false}}).forEach((t)=>{
        const user = Meteor.users.findOne(t.author);
        if(user)
            UltiSite.ContentVersions.update(t._id,{
                $set:{
                    authorName:user.username
                }
            });
    });
    console.log('migrations finished');
});
