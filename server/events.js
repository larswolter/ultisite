import { moment } from 'meteor/momentjs:moment';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { SyncedCron } from 'meteor/percolate:synced-cron';

Accounts.onLogin(function (attempt) {
  if (attempt.user) {
    if (!attempt.user.settings || !attempt.user.settings.email) {
      Meteor.users.update(attempt.user._id, {
        $set: {
          'settings.email.wiki': 'daily',
          'settings.email.tournament': 'daily',
          'settings.email.team': 'daily',
          'settings.email.files': 'daily',
          'settings.email.blog': 'daily',
        },
      });
    }
  }
});

Meteor.startup(function () {
  UltiSite.getEvents = function (limitCount) {
    let search = { 'detail.time': { $gte: moment().subtract(1, 'day').toDate() } };
    if (limitCount) { search = {}; }
    const events = {};
    UltiSite.Events.find(search, {
      sort: {
        'detail.time': -1,
      },
      limit: limitCount,
    }).forEach(function (event) {
      event.url = FlowRouter.url(event.route, { _id: event.groupBy });
      event.detail.timeFormatted = moment(event.detail.time).format('DD.MM. HH:mm');
      if (events[event.groupBy]) { events[event.groupBy].detail.push(event.detail); } else {
        events[event.groupBy] = event;
        events[event.groupBy].detail = [event.detail];
      }
    });
    return Object.keys(events).map(function (key) {
      return events[key];
    });
  };

  SyncedCron.add({
    name: 'Daily E-mail digest',
    schedule(parser) {
      // parser is a later.parse object
      return parser.text('at 15:09');
    },
    job() {
      let result = 0;
      console.log('sending digests');
      const eventList = UltiSite.getEvents();
      Meteor.users.find().forEach(function (user) {
        if (UltiSite.sendEventDigest(user, eventList)) {
          result += 1;
        }
      });
      return eventList.length + ' Digest events send to ' + result + ' users';
    },
  });
  if (Meteor.absoluteUrl('').indexOf('localhost') === -1) {
    SyncedCron.start();
  }
});


UltiSite.sendEventDigest = function (user, eventList) {
  if (eventList.length === 0) { return false; }
  if (user.settings.noDigestMail) { return false; }
  const template = Assets.getText('mail-templates/events.html');
  const layout = Assets.getText('mail-templates/layout.html');

  UltiSite.Mail.send([user._id], 'Tägliche Zusammenfassung',
    UltiSite.renderMailTemplate(layout, template, {
      user,
      profilUrl: FlowRouter.url('user', { _id: user._id }),
      events: eventList,
    }));
  return true;
};

const sendEvent = function (user, event) {
  const template = Assets.getText('mail-templates/event.html');
  const layout = Assets.getText('mail-templates/layout.html');

  UltiSite.Mail.send([user._id], event.name,
    UltiSite.renderMailTemplate(layout, template, {
      user,
      profilUrl: FlowRouter.url('user', { _id: user._id }),
      event,
    }));
  return true;
};
UltiSite.addEvent = function (info) {
  info.time = new Date();
  UltiSite.LastChanges.upsert({
    type: info.type,
  }, {
    $set: {
        type: info.type,
        date: new Date(),
      },
  });
  info.alias = info.userId && UltiSite.getAlias(info.userId);
  if (info.type === 'files' && info.images) {
    const ev = UltiSite.Events.findOne({
      groupBy: info._id,
      'detail.userId': info.userId,
      'detail.time': {
        $gt: moment().subtract(5, 'minutes').toDate(),
      },
      'detail.text': info.text,
    });
    if (ev) {
      UltiSite.Events.update(ev._id, {
        $push: {
          images: info.images[0],
        },
      });
    }
  }
  const event = {};
  if (info.type === 'team' || info.type === 'tournament') {
    event.groupBy = (info.type === 'team' ? UltiSite.Teams.findOne(info._id || info.group).tournamentId : info._id);
    const tourney = UltiSite.Tournaments.findOne(event.groupBy);
    event.route = 'tournament';
    event.name = tourney.name;
    event.additional = moment(tourney.date).format('DD.MM.YY') + ' in ' + tourney.address.city;
  } else if (info.type === 'wiki') {
    const page = UltiSite.WikiPages.findOne(info._id);
    event.groupBy = info._id;
    event.route = 'wikipage';
    event.name = page.name;
    event.additional = moment(page.created).format('DD.MM.YY');
  } else if (info.type === 'blog') {
    const page = UltiSite.Blogs.findOne(info._id);
    event.groupBy = info._id;
    event.route = 'blog';
    event.name = page.title;
    event.additional = moment(page.created).format('DD.MM.YY');
  } else {
    event.groupBy = info._id;
    event.route = info.type;
    event.name = info.name;
    event.additional = info.additional;
  }
  event.detail = info;
  UltiSite.Events.insert(event, function (err, res) {
    console.log('inserted event:', err, res);
    const search = {};
    search['settings.email.' + event.route] = 'immediate';
    Meteor.users.find(search).forEach(function (user) {
      sendEvent(user, UltiSite.Events.findOne(res));
    });
  });
};

Meteor.methods({
  /**
  info.type
  info.text
  info._id
  */
  addEvent(info) {
    check(info, Object);
    if (!UltiSite.isAdmin(this.userId) || !info.userId) {
      info.userId = this.userId;
    }
    UltiSite.addEvent(info);
  },
  removeEvent(id) {
    check(id, String);
    UltiSite.Events.remove({
      $or: [
        { groupBy: id },
        { 'detail._id': id },
      ],
    });
    UltiSite.Events.udate({
      $pull: { images: id },
    });
  },
});
