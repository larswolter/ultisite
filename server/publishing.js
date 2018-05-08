Meteor.startup(function () {
  Meteor.publish('Blogs', function (limit) {
    const search = {};
    if (!this.userId) { search.public = true; }

    return UltiSite.Blogs.find(search, {
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
    const search = {
    };
    if (!this.userId) { search.public = true; }
    const newest = (UltiSite.Blogs.findOne(search, { sort: { date: -1 } }) || {})._id;
    search.$or = [{
      date: {
        $gte: moment().subtract(1, 'month').toDate(),
      },
    }, { _id: newest }];
    return UltiSite.Blogs.find(search, {
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
    return UltiSite.Blogs.find({ _id });
  });
  Meteor.publish(null, function () {
    if (UltiSite.isAdmin(this.userId)) { return Roles.getAllRoles(); }
    this.ready();
  });
  Meteor.publish('LastChanges', function (types) {
    if (types) {
      return UltiSite.LastChanges.find({
        type: {
          $in: types,
        },
      });
    }
    return UltiSite.LastChanges.find();
  });
  Meteor.publish('Statistics', function (target) {
    check(target, String);
    const res = UltiSite.Statistics.find({
      target,
    });
    if (res.count() === 0) { Meteor.call('computeStatistics', target); }
    return res;
  });
  Meteor.publish('Files', function (associatedIds, others) {
    if (!Array.isArray(associatedIds)) { associatedIds = [associatedIds]; }
    return [UltiSite.Images.find({
      $or: [{
        associated: {
          $in: associatedIds,
        },
      }, {
        _id: {
          $in: associatedIds,
        },
      }],
    }, { fields: { base64: 0, thumb: 0 } }), UltiSite.Documents.find({
      $or: [{
        associated: {
          $in: associatedIds,
        },
      }, {
        _id: {
          $in: associatedIds,
        },
      }],
    }), UltiSite.Folders.find(),
    ];
  });
  Meteor.publish('UserDetails', function (userId) {
    check(userId, String);
    if (!this.userId) { return this.ready(); }
    return Meteor.users.find({
      _id: { $in: [userId, this.userId] },
    }, {
        fields: {
          profile: 1,
          status: 1,
          settings: 1,
          club: 1,
          username: 1,
          roles: 1,
          emails: 1,
          connection: 1,
        },
      });
  });
  Meteor.publish('Events', function () {
    if (!this.userId) { return undefined; }
    return UltiSite.Events.find({
    }, {
        limit: 30,
        sort: { 'detail.time': -1 },
      });
  });
  Meteor.publish('tournamentDetails', function (tournamentId) {
    if (!this.userId) { return undefined; }
    return [
      UltiSite.Tournaments.find({ _id: tournamentId }),
      UltiSite.Teams.find({ tournamentId })];
  });

  Meteor.publish('Tournaments', function (since, query) {
    if (!since && query) {
      const tcursor = UltiSite.Tournaments.find(query, { fields: { description: 0, 'reports.content': 0 } });
      const teamIds = _.flatten(tcursor.map(t => t.teams));
      return [tcursor, UltiSite.Teams.find({ _id: { $in: teamIds } })];
    }
    return [
      UltiSite.Tournaments.find({ lastChange: { $gte: since } }, { limit: 10 }),
      UltiSite.Teams.find({ lastChange: { $gte: since } }, { limit: 10 }),
    ];
  });

  Meteor.publish('WikiPageDiscussions', function (id) {
    return UltiSite.WikiPageDiscussions.find({ pageId: id });
  });
  Meteor.publish('ContentVersions', function (id) {
    return UltiSite.ContentVersions.find({ associated: id }, { fields: { content: 0 } });
  });
  Meteor.publish('WikiPage', function (id) {
    return UltiSite.WikiPages.find({
      $or: [{
        _id: id,
      }, {
        name: id,
      }],
    });
  });

  Meteor.publish('ContentVersion', function (id) {
    if (this.userId) { return UltiSite.ContentVersions.find({ _id: id }); }
    this.ready();
  });

  Meteor.publish('Practices', function () {
    return UltiSite.Practices.find({});
  });
  Meteor.publish('Places', function (country) {
    return UltiSite.Countries.find();
  });
});
