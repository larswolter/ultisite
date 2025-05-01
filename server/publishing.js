import { moment } from 'meteor/momentjs:moment';
import {
  Blogs,
  ContentVersions,
  Countries,
  Documents,
  Events,
  Folders,
  Images,
  LastChanges,
  Practices,
  Statistics,
  Tournaments,
  WikiPageDiscussions,
  WikiPages,
} from '../common/lib/ultisite';

Meteor.startup(function () {
  Meteor.publish('Blogs', async function (limit) {
    check(limit, Match.Maybe(Number));

    const search = {};
    if (!this.userId) {
      search.public = true;
    }

    return Blogs.find(search, {
      limit,
      sort: {
        date: -1,
      },
      fields: {
        content: 0,
      },
    });
  });
  Meteor.publish('BlogsStart', async function () {
    const search = {};
    if (!this.userId) {
      search.public = true;
    }
    const newest = ((await Blogs.findOneAsync(search, { sort: { date: -1 } })) || {})._id;
    search.$or = [
      {
        date: {
          $gte: moment()
            .subtract(this.userId ? 12 : 2, 'month')
            .toDate(),
        },
      },
      { _id: newest },
    ];
    return Blogs.find(search, {
      limit: 3,
      sort: {
        date: -1,
      },
      fields: {
        content: 0,
      },
    });
  });
  Meteor.publish('Blog', async function (_id) {
    return Blogs.find({ _id });
  });
  Meteor.publish('LastChanges', async function (types) {
    if (types) {
      return LastChanges.find({
        type: {
          $in: types,
        },
      });
    }
    return LastChanges.find();
  });
  Meteor.publish('Statistics', async function (target) {
    check(target, String);
    const res = Statistics.find({
      target,
    });
    if ((await res.countAsync()) === 0) {
      await Meteor.callAsync('computeStatistics', target);
    }
    return res;
  });
  Meteor.publish('Files', async function (associatedIds) {
    if (!Array.isArray(associatedIds)) {
      associatedIds = [associatedIds];
    }
    return [
      Images.find(
        {
          $or: [
            {
              associated: {
                $in: associatedIds,
              },
            },
            {
              _id: {
                $in: associatedIds,
              },
            },
          ],
        },
        { fields: { base64: 0, thumb: 0 } }
      ),
      Documents.find({
        $or: [
          {
            associated: {
              $in: associatedIds,
            },
          },
          {
            _id: {
              $in: associatedIds,
            },
          },
        ],
      }),
      Folders.find(),
    ];
  });
  Meteor.publish('UserDetails', async function (userId) {
    check(userId, String);
    if (!this.userId) {
      return this.ready();
    }
    return Meteor.users.find(
      {
        _id: { $in: [userId, this.userId] },
      },
      {
        fields: {
          activeAdmin: 1,
          profile: 1,
          status: 1,
          settings: 1,
          club: 1,
          username: 1,
          roles: 1,
          emails: 1,
          connection: 1,
        },
      }
    );
  });
  Meteor.publish('Events', async function () {
    if (!this.userId) {
      return undefined;
    }
    return Events.find(
      {},
      {
        limit: 30,
        sort: { 'detail.time': -1 },
      }
    );
  });
  Meteor.publish('tournamentDetails', async function (tournamentId) {
    check(tournamentId, String);
    if (!this.userId) {
      return undefined;
    }
    return Tournaments.find({ _id: tournamentId });
  });

  Meteor.publish('Tournaments', async function (since, query) {
    return Tournaments.find(
      {
        $or: [
          query ? query : { date: { $gte: moment().subtract(1, 'week').toDate() } },
          { date: { $gte: moment().subtract(3, 'year').toDate() }, 'teams.state': 'dabei' },
        ],
      },
      { fields: { description: 0, 'reports.content': 0 } }
    );
  });

  Meteor.publish('WikiPageDiscussions', async function (id) {
    check(id, String);
    return WikiPageDiscussions.find({ pageId: id });
  });
  Meteor.publish('ContentVersions', async function (id) {
    check(id, String);
    return ContentVersions.find({ associated: id }, { fields: { content: 0 } });
  });
  Meteor.publish('WikiPage', async function (id) {
    check(id, String);
    return WikiPages.find({
      $or: [
        {
          _id: id,
        },
        {
          name: id,
        },
      ],
    });
  });

  Meteor.publish('ContentVersion', async function (id) {
    check(id, String);
    if (this.userId) {
      return ContentVersions.find({ _id: id });
    }
    this.ready();
  });

  Meteor.publish('Practices', async function () {
    return Practices.find({});
  });
  Meteor.publish('Places', async function () {
    return Countries.find();
  });
});
