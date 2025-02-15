import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import { settings, translate } from '../common/lib/ultisite';

export const renderMailTemplate = function (layout, source, context) {
  const compiled = handlebars.compile(layout);
  source && handlebars.registerPartial('content', source);

  return compiled(context);
};

export const Mail = {};

function setupMailServer(club) {
  // create reusable transporter object using SMTP transport
  if (!club.emailServer || Meteor.absoluteUrl().match(/localhost/)) {
    console.log('Creating file mail transport');
    Mail.debug = true;
    Mail.transport = Nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
    });
  } else {
    console.log('Creating mail transport for ' + club.teamname + ':' + club.emailServer);
    Mail.transport = Nodemailer.createTransport({
      pool: true,
      rateLimit: 3,
      host: club.emailServer.split(':')[0],
      port: Number(club.emailServer.split(':')[1]),
      auth: {
        user: club.emailLogin,
        pass: club.emailPassword,
      },
      tls: {
        maxVersion: 'TLSv1.3',
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false,
      },
    });
  }
  Mail.send = function (recievers, subject, content) {
    console.log('sending mail on ' + club.teamname);

    const mailOptions = {
      from: club.teamname + ' Verwaltung <' + club.emailFrom + '>',
      to:
        Meteor.users
          .find({
            _id: {
              $in: recievers,
            },
          })
          .map(function (u) {
            let vemail;
            u.emails.forEach(function (mail) {
              if (mail.verified) {
                vemail = mail.address;
              }
            });
            if (!vemail) {
              // Take the first unverified email
              vemail = u.emails[0].address;
            }
            return u.username + ' <' + vemail + '>';
          })
          .join(', ') || recievers.join(','),
      subject: '[' + club.teamname + '] ' + subject,
      html: content,
    };
    console.log('generated mail info, sending to:', mailOptions.to);
    if (!mailOptions.to) {
      console.log('mail-error', 'no valid recipients found');
    }
    this.transport.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log('mail-error', err.message);
      } else if (this.debug) {
        fs.writeFile('/tmp/ultisiteMail.eml', info.message, (merr) => {
          merr && console.err('err writing mail', merr);
          !merr && console.log('wrote mail to /tmp/ultisiteMail.eml');
        });
      } else {
        console.log('Mail:', info);
      }
    });
  };
}

export const Nodemailer = nodemailer;
Meteor.startup(function () {
  handlebars.registerHelper('translate', (term) => {
    return translate(term);
  });

  setupMailServer(settings());
});

Meteor.methods({
  updateMailserver() {
    setupMailServer(settings());
  },
});
