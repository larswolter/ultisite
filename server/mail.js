import nodemailer from 'nodemailer';
import handlebars from 'handlebars';

UltiSite.renderMailTemplate = function(layout,source,context){
    var layout = handlebars.compile(layout);
    handlebars.registerPartial('content',source);
 
    return layout(context);
}


Meteor.startup(function() {
    UltiSite.Nodemailer = nodemailer; 
    UltiSite.Mail = {};
    UltiSite.Settings.find().forEach(function(club) {
        setupMailServer(club);
    });
});

Meteor.methods({
    updateMailserver: function() {
        setupMailServer(UltiSite.settings(this.connection));
    }
});

function setupMailServer(club) {
    // create reusable transporter object using SMTP transport
    if (!club.emailServer) {
        UltiSite.Mail = {
            send: function(recievers, subject, content) {
                console.log("Mail sending disabled for " + club.teamname + ", no mail server set");
                console.log("  from:" + club.teamname + " Verwaltung <" + club.emailFrom + ">");
                console.log("  to:" + (Meteor.users.find({
                    _id: {
                        $in: recievers
                    },
                    'emails.$.verified': true
                }).map(function(u) {
                    var vemail;
                    u.emails.forEach(function(mail) {
                        if (mail.verified)
                            vemail = mail.address;
                    });
                    if(!vemail) // Take the first unverified email
                        vemail = u.emails[0].address;
                    return UltiSite.getAlias(u, club._id) + "<" + vemail + ">";
                }).join(", ") || recievers.join(',')));
                console.log("  subject:[" + club.teamname + "] " + subject);
                console.log("  body:" + content);
            }
        };
        return;
    }
    console.log("Creating mail transport for " + club.teamname + ":" + club.emailServer);
    UltiSite.Mail = {
        transport: UltiSite.Nodemailer.createTransport({
            pool: true,
            rateLimit:3,
            host: club.emailServer.split(":")[0],
            port: Number(club.emailServer.split(":")[1]),
            auth: {
                user: club.emailLogin,
                pass: club.emailPassword
            },
            tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: false
            }
        }),
        send: function(recievers, subject, content) {
            console.log("sending mail on " + club.teamname);

            var mailOptions = {
                from: club.teamname + " Verwaltung <" + club.emailFrom + ">",
                to: Meteor.users.find({
                    _id: {
                        $in: recievers
                    }
                }).map(function(u) {
                    var vemail;
                    u.emails.forEach(function(mail) {
                        if (mail.verified)
                            vemail = mail.address;
                    });
                    if(!vemail) // Take the first unverified email
                        vemail = u.emails[0].address;
                    return u.username + " <" + vemail + ">";
                }).join(", ") || recievers.join(','),
                subject: "[" + club.teamname + "] " + subject,
                html: content,
            };
            console.log("generated mail info, sending to:",mailOptions.to);
            if(!mailOptions.to)
                console.log("mail-error","no valid recipients found");
            this.transport.sendMail(mailOptions, function(err, info) {
                if (err)
                    console.log("mail-error",err.message);
                else
                    console.log("Mail:", info);
            });
        }
    };

}

