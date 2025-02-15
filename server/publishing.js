import { moment } from 'meteor/momentjs:moment';

Meteor.startup(function () {
  Meteor.publish('Blogs', function (limit) {
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
  Meteor.publish('BlogsStart', function () {
    const search = {};
    if (!this.userId) {
      search.public = true;
    }
    const newest = (Blogs.findOne(search, { sort: { date: -1 } }) || {})._id;
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
  Meteor.publish('Blog', function (_id) {
    return Blogs.find({ _id });
  });
  Meteor.publish('UserRoles', function () {
    if (isAdmin(this.userId)) {
      return Roles.getAllRoles();
    }
    this.ready();
  });
  Meteor.publish('LastChanges', function (types) {
    if (types) {
      return LastChanges.find({
        type: {
          $in: types,
        },
      });
    }
    return LastChanges.find();
  });
  Meteor.publish('Statistics', function (target) {
    check(target, String);
    const res = Statistics.find({
      target,
    });
    if (res.count() === 0) {
      Meteor.call('computeStatistics', target);
    }
    return res;
  });
  Meteor.publish('Files', function (associatedIds) {
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
  Meteor.publish('UserDetails', function (userId) {
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
  Meteor.publish('Events', function () {
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
  Meteor.publish('tournamentDetails', function (tournamentId) {
    check(tournamentId, String);
    if (!this.userId) {
      return undefined;
    }
    return Tournaments.find({ _id: tournamentId });
  });

  Meteor.publish('Tournaments', function (since, query) {
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

  Meteor.publish('WikiPageDiscussions', function (id) {
    check(id, String);
    return WikiPageDiscussions.find({ pageId: id });
  });
  Meteor.publish('ContentVersions', function (id) {
    check(id, String);
    return ContentVersions.find({ associated: id }, { fields: { content: 0 } });
  });
  Meteor.publish('WikiPage', function (id) {
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

  Meteor.publish('ContentVersion', function (id) {
    check(id, String);
    if (this.userId) {
      return ContentVersions.find({ _id: id });
    }
    this.ready();
  });

  Meteor.publish('Practices', function () {
    return Practices.find({});
  });
  Meteor.publish('Places', function () {
    return Countries.find();
  });
});
