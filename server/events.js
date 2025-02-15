import { moment } from 'meteor/momentjs:moment';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { CronJob } from 'cron';
import { Blogs, Events, getAlias, isAdmin, LastChanges, Tournaments, WikiPages } from '../common/lib/ultisite';
import { getTournamentsStates } from './tournament';
import { Mail, renderMailTemplate } from './mail';

Accounts.onLogin(async function(attempt) {
  if (attempt.user) {
    if (!attempt.user.settings || !attempt.user.settings.email) {
      await Meteor.users.updateAsync(attempt.user._id, {
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

export const getEvents = async function(limitCount, days = 1) {
  let search = { 'detail.time': { $gte: moment().subtract(days, 'day').toDate() } };
  if (limitCount) {
    search = {};
  }
  const events = {};
  await Events.find(search, {
    sort: {
      'detail.time': -1,
    },
    limit: limitCount,
  }).forEachAsync(function (event) {
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
    Meteor.bindEnvironment(async () => {
      let result = 0;
      console.log('sending digests');
      const eventList = await getEvents();
      await Meteor.users.find().forEachAsync(async function(user) {
        if (await sendEventDigest(user, eventList)) {
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

export const sendEventDigest = async function(user, eventList, force = false) {
  if (!force && eventList.length === 0) {
    return false;
  }
  if (!force && user.settings && user.settings.noDigestMail) {
    return false;
  }
  const template = Assets.getText('mail-templates/events.html');
  const layout = Assets.getText('mail-templates/layout.html');
  const tournaments = await getTournamentsStates(user._id);

  Mail.send(
    [user._id],
    'Tägliche Zusammenfassung',
    renderMailTemplate(layout, template, {
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

  Mail.send(
    [user._id],
    event.name,
    renderMailTemplate(layout, template, {
      user,
      profilUrl: FlowRouter.url('user', { _id: user._id }),
      event,
    })
  );
  return true;
};
export const addEvent = async function(info) {
  info.time = new Date();
  await LastChanges.upsertAsync(
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
  info.alias = info.userId && (await getAlias(info.userId));
  if (info.type === 'files' && info.images) {
    const ev = await Events.findOneAsync({
      groupBy: info._id,
      'detail.userId': info.userId,
      'detail.time': {
        $gt: moment().subtract(5, 'minutes').toDate(),
      },
      'detail.text': info.text,
    });
    if (ev) {
      await Events.updateAsync(ev._id, {
        $push: {
          images: info.images[0],
        },
      });
    }
  }
  const event = { lastChange: new Date() };
  if (info.type === 'team' || info.type === 'tournament') {
    const tournament = await Tournaments.findOneAsync({
      $or: [{ _id: info._id || info.group }, { 'teams._id': info._id || info.group }],
    });
    event.groupBy = tournament._id;
    event.route = 'tournament';
    event.name = tournament.name;
    event.additional = moment(tournament.date).format('DD.MM.YY') + ' in ' + tournament.address.city;
  } else if (info.type === 'wiki') {
    const page = await WikiPages.findOneAsync(info._id);
    event.groupBy = info._id;
    event.route = 'wikipage';
    event.name = page.name;
    event.additional = moment(page.created).format('DD.MM.YY');
  } else if (info.type === 'blog') {
    const page = await Blogs.findOneAsync(info._id);
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
  await Events.insertAsync(event, async function(err, res) {
    console.log('inserted event:', err, res);
    const search = {};
    if (['team', 'tournament'].includes(info.type)) {
      search['settings.email.' + event.route] = 'immediate';
      await Meteor.users.find(search).forEachAsync(async function(user) {
        sendEvent(user, await Events.findOneAsync(res));
      });
    }
  });
};

Meteor.methods({
  async sendEventDigestToMe() {
    check(this.userId, String);
    const eventList = await getEvents(20, 100);
    console.log('gathering digest');
    await Meteor.users.find({ _id: this.userId }).forEachAsync(async function(user) {
      console.log('sendign to', user.username);
      await sendEventDigest(user, eventList, true);
    });
  },
  async addEvent(info) {
    check(info, Object);
    if (!(await isAdmin(this.userId)) || !info.userId) {
      info.userId = this.userId;
    }
    await addEvent(info);
  },
  async removeEvent(id) {
    check(id, String);
    await Events.removeAsync({
      $or: [{ groupBy: id }, { 'detail._id': id }],
    });
    Events.udate({
      $pull: { images: id },
    });
  },
});
