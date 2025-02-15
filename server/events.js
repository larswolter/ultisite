import { moment } from 'meteor/momentjs:moment';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { CronJob } from 'cron';

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

export const getEvents = function (limitCount, days = 1) {
  let search = { 'detail.time': { $gte: moment().subtract(days, 'day').toDate() } };
  if (limitCount) {
    search = {};
  }
  const events = {};
  UltiSite.Events.find(search, {
    sort: {
      'detail.time': -1,
    },
    limit: limitCount,
  }).forEach(function (event) {
    event.url = FlowRouter.url(event.route, { _id: event.groupBy });
    event.detail.timeFormatted = moment(event.detail.time).format('DD.MM. HH:mm');
    if (events[event.groupBy]) {
      events[event.groupBy].detail.push(event.detail);
    } else {
      events[event.groupBy] = event;
      events[event.groupBy].detail = [event.detail];
    }
  });
  return Object.keys(events).map(function (key) {
    return events[key];
  });
};
Meteor.startup(function () {
  const job = new CronJob(
    '0 9 15 * * *',
    Meteor.bindEnvironment(() => {
      let result = 0;
      console.log('sending digests');
      const eventList = UltiSite.getEvents();
      Meteor.users.find().forEach(function (user) {
        if (UltiSite.sendEventDigest(user, eventList)) {
          result += 1;
        }
      });
      console.log(eventList.length + ' Digest events send to ' + result + ' users');
    }),
    null,
    false,
    'Europe/Berlin'
  );

  if (Meteor.absoluteUrl('').indexOf('localhost') === -1) {
    job.start();
  }
});

export const sendEventDigest = function (user, eventList, force = false) {
  if (!force && eventList.length === 0) {
    return false;
  }
  if (!force && user.settings && user.settings.noDigestMail) {
    return false;
  }
  const template = Assets.getText('mail-templates/events.html');
  const layout = Assets.getText('mail-templates/layout.html');
  const tournaments = UltiSite.getTournamentsStates(user._id);

  UltiSite.Mail.send(
    [user._id],
    'Tägliche Zusammenfassung',
    UltiSite.renderMailTemplate(layout, template, {
      user,
      profilUrl: FlowRouter.url('user', { _id: user._id }),
      tournamentUrl: FlowRouter.url('tournaments', {}),
      events: eventList,
      tournaments,
    })
  );
  return true;
};

const sendEvent = function (user, event) {
  const template = Assets.getText('mail-templates/event.html');
  const layout = Assets.getText('mail-templates/layout.html');

  UltiSite.Mail.send(
    [user._id],
    event.name,
    UltiSite.renderMailTemplate(layout, template, {
      user,
      profilUrl: FlowRouter.url('user', { _id: user._id }),
      event,
    })
  );
  return true;
};
export const addEvent = function (info) {
  info.time = new Date();
  UltiSite.LastChanges.upsert(
    {
      type: info.type,
    },
    {
      $set: {
        type: info.type,
        date: new Date(),
      },
    }
  );
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
  const event = { lastChange: new Date() };
  if (info.type === 'team' || info.type === 'tournament') {
    const tournament = UltiSite.Tournaments.findOne({
      $or: [{ _id: info._id || info.group }, { 'teams._id': info._id || info.group }],
    });
    event.groupBy = tournament._id;
    event.route = 'tournament';
    event.name = tournament.name;
    event.additional = moment(tournament.date).format('DD.MM.YY') + ' in ' + tournament.address.city;
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
    if (['team', 'tournament'].includes(info.type)) {
      search['settings.email.' + event.route] = 'immediate';
      Meteor.users.find(search).forEach(function (user) {
        sendEvent(user, UltiSite.Events.findOne(res));
      });
    }
  });
};

Meteor.methods({
  sendEventDigestToMe() {
    check(this.userId, String);
    const eventList = UltiSite.getEvents(20, 100);
    console.log('gathering digest');
    Meteor.users.find({ _id: this.userId }).forEach(function (user) {
      console.log('sendign to', user.username);
      UltiSite.sendEventDigest(user, eventList, true);
    });
  },
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
      $or: [{ groupBy: id }, { 'detail._id': id }],
    });
    UltiSite.Events.udate({
      $pull: { images: id },
    });
  },
});
