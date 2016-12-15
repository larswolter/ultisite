import Imap from 'imap';
import addressparser from 'addressparser';
import quotedPrintable from 'quoted-printable';
import sanitizeHtml from 'sanitize-html';

Meteor.startup(function() {
    registerMailinglist({
    });
});

var registerMailinglist = function() {
    SyncedCron.add({
        name: 'Mailinglist mail check',
        schedule: function(parser) {
            // parser is a later.parse object
            return parser.text('every 7 minutes');
        },
        job: function() {
            if(!UltiSite.settings().mailingListConfigs)
                return;
            UltiSite.settings().mailingListConfigs.forEach(function(config){
                let options = _.extend({tls:true},config);
                console.log(config.from + ':connecting to mail-server');
                let imap = new Imap(options);            
                imap.once("ready", Meteor.bindEnvironment(function() {
                    console.log(config.from + ':Connected to '+options.host);
                    imap.openBox('INBOX',false,Meteor.bindEnvironment(function(err,box) {
                        if(err) {
                            console.log(config.from + ': ' + err);
                            imap.end();
                            return;
                        }
                        console.log(config.from+': '+box.messages.total+' messages on server');
                        if(box.messages.total === 0)
                            return;
                        let f = imap.fetch('*', { 
                            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
                            struct:true 
                        });
                        f.on('message', Meteor.bindEnvironment(function(msg, seqno) {
                            let header;
                            let structure;
                            let uid;
                            msg.on('body', function(stream,info) {
                                let buffer = '';
                                stream.on('data', function(chunk) {
                                    buffer += chunk.toString('utf8');
                                });
                                stream.once('end', function() {
                                    header = Imap.parseHeader(buffer);
                                });
                            });                        
                            msg.on('attributes', function(attrs) {
                                structure = attrs.struct;
                                uid = attrs.uid;
                            });
                            msg.on('end', Meteor.bindEnvironment(function(attrs) {
                                let address = addressparser(header.from[0]);
                                let user = Accounts.findUserByEmail(address[0].address);
                                let date = moment(header.date[0],'ddd, DD MMM YYYY HH:mm:ss ZZ');
                                var blogId = Random.id();
                                
                                
                                if(user) {
                                    console.log('got email from user:',user.username,address[0].address);
                                    let exists = UltiSite.Blogs.findOne({author: user._id,date: date.toDate()});
                                    if(exists)
                                        blogId = exists._id;
                                    UltiSite.Blogs.upsert(blogId,{$set:{
                                        _id:blogId,
                                        title: header.subject[0],
                                        public: false,
                                        author: user._id,
                                        byEmail:true,
                                        date: date.toDate()
                                    }});
                                    if(!exists)
                                        Meteor.call('addEvent', {
                                            type: 'blog',
                                            _id: blogId,
                                            userId: user._id,
                                            text: 'Artikel per Mail gesendet'
                                        });                    
                                    
                                    let parts=[];
                                    structure.forEach((part)=>{
                                        if(part.partID)
                                            parts.push(part);
                                        else if(Array.isArray(part)) {                                        
                                            part.forEach((sub)=>{
                                                if(sub.partID)
                                                    parts.push(sub);
                                                else if(Array.isArray(sub)) {
                                                    sub.forEach((subsub)=>{
                                                        if(subsub.partID)
                                                            parts.push(subsub);
                                                    });
                                                }
                                            });
                                        }
                                    });     
                                    parts.forEach((p)=>{
                                        Meteor.setTimeout(function(){
                                            fetchPart(imap,blogId,uid,p);
                                        },100);
                                    });   

                                }
                                else {
                                    console.log('got email from unknown:',address[0].address);
                                }
                                Meteor.setTimeout(function() {
                                    imap.addFlags(uid,'Deleted',Meteor.bindEnvironment(function(err) {
                                        if(err)
                                            console.log("deletion failed:",err);
                                        imap.closeBox(true,(err)=>{
                                            if(err)
                                                console.log('Failed closing box: ',err);
                                        });
                                        console.log('Removed mail from inbox');
                                        imap.end();
                                        let search={};
                                        search['settings.email.'+config.from.toCamelCase()] = 'immediate';
                                        Meteor.users.find(search).forEach(function(user){
                                            sendMailinglistArticle(user,blogId);           
                                        });

                                    })); 
                                },30000);
                            }));
                        }));
                        f.once('error', function(err) {
                            console.log(config.from + ': ' + err);
                        });
                        f.once('end', function() {
                            console.log(config.from + ':Done fetching all messages!');
                        });   
                    }));                 
                }));
                try {
                    imap.connect();
                } catch(err) {
                    console.log(config.from + ':',err);
                }
            });            
            return 'running mail check';
        }
    });
};

var fetchPart = function(imap,blogId,uid,part) {
    console.log('fetching part from '+uid+':',part.partID,part.type+'/'+part.subtype);
    let partfetch = imap.fetch(uid,{bodies:[part.partID]});
    partfetch.on('message',Meteor.bindEnvironment(function(msgPart){
        msgPart.on('body', Meteor.bindEnvironment(function(stream,info) {
            let buffer = '';
            stream.on('data', Meteor.bindEnvironment(function(chunk) {
                buffer += chunk.toString('utf8');
            }));
            stream.once('end', Meteor.bindEnvironment(function() {
                if(part.disposition && part.disposition.type==='attachment') {
                    /* TODO: image from mail
                    if (file.isImage()) {
                    let buf = new Buffer(buffer, part.encoding);
                    let file = {}
                    file.associated = [blogId];
                    file.tags = [];
                    file.comments = [];
                    file.name = part.disposition.filename||part.params.name;
                    file.attachData(buf,{type:part.type+'/'+part.subtype});
                        let id = UltiSite.Images.insert(file);
                        Meteor.setTimeout(()=>{
                            UltiSite.Blogs.update(blogId,{
                                $set:{
                                    image:id
                                }
                            });
                        },100);
                    }
                    else
                        UltiSite.Documents.insert(file);
                    console.log(uid + ': fetched doc/image '+part.disposition.filename);
                    */
                }
                else if(part.type==='text') {
                    let text = quotedPrintable.decode(buffer);
                    text = sanitizeHtml(text);
                    UltiSite.Blogs.upsert(blogId,{
                        $set:{
                            _id:blogId,
                            content:text,
                            preview:sanitizeHtml(text,{allowedTags:[]}).substr(0, 300)
                        }
                    });
                    console.log(uid + ': fetched text');
                }
            }));
        }));
    }));
    partfetch.once('error', function(err) {
        console.log(uid + ': part fetch error' + err);
    });
    
};

var sendMailinglistArticle = function(user,blogId,mailinglist) {
    let template = Assets.getText('mail-templates/article.html');
    let layout = Assets.getText('mail-templates/layout.html');
    let blog = UltiSite.blogs.findOne(blogId);
    let author = Meteor.users.findOne(blog.author);
    UltiSite.Mail.send([user._id], blog.title,
        UltiSite.renderMailTemplate(layout,template, {
            user: user,
            profilUrl: FlowRouter.url('user', { _id: user._id }),
            mailinglist:mailinglist,
            url: FlowRouter.url('blog', { _id: blog._id }),
            title: blog.title,
            content: sanitizeHtml(blog.content),
            email: author.emails[0].address,
            writer: author.username+' ('+author.profile.name+' '+author.profile.surname+')',
            date: moment(blog.date).format('DD.MM.YYYY - HH:mm')
        }));
   return true;
};
