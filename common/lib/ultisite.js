import { moment } from 'meteor/momentjs:moment';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Roles } from 'meteor/alanning:roles';

UltiSite = {
  offlineCollections: [
    {
      name: 'Events',
      filter() {
        return {};
      },
      options() {
        return { limit: 30, sort: { 'detail.time': -1 } };
      },
    },
  ],
};

moment.locale('de', {
  months: [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ],
  relativeTime: {
    future: '%s noch',
    past: '%s her',
    s: 'Sekunden',
    m: 'eine Minute',
    mm: '%d Minuten',
    h: 'eine Stunde',
    hh: '%d Stunden',
    d: 'ein Tag',
    dd: '%d Tage',
    M: 'ein Monat',
    MM: '%d Monate',
    y: 'ein Jahr',
    yy: '%d Jahre',
  },
});

const translationTable = {
  folder: 'Ordner',
  files: 'Dokumente',
  wikipage: 'Wikiseite',
};

// Ground.Collection(Meteor.users);

if (Meteor.isServer) {
  const appCacheConfig = {
    onlineOnly: ['/icons/countries/'],
  };
  // appCacheConfig.chrome = false;
  if (Meteor.absoluteUrl('').indexOf('localhost') > -1) {
    //    appCacheConfig.chrome = false;
    //    appCacheConfig.firefox = false;
    //    appCacheConfig.ie = false;
  }
  //  Meteor.AppCache.config(appCacheConfig);
}
_.extend(UltiSite, {
  baseLayoutData: new ReactiveVar(),
  tournamentsReady: new ReactiveVar(false),
  wikiPagesReady: new ReactiveVar(false),
  blogsReady: new ReactiveVar(false),
  filesReady: new ReactiveVar(false),
  usersReady: new ReactiveVar(false),
  schemas: {
    links: new ReactiveVar(null),
    team: new ReactiveVar(null),
    tournament: new ReactiveVar(null),
    user: new ReactiveVar(null),
    userRegister: new ReactiveVar(null),
    blog: new ReactiveVar(null),
    emailServerSchema: new ReactiveVar(null),
    practice: new ReactiveVar(null),
  },
  initialSubsReady: new ReactiveVar(false),
  LookupId: new Meteor.Collection(null),
  AdminNotifications: new Meteor.Collection('AdminNotifications'),
  LastChanges: new Meteor.Collection('LastChanges'),
  WikiPages: new Meteor.Collection('WikiPages'),
  WikiPageDiscussions: new Meteor.Collection('WikiPagDiscussiones'),
  Blogs: new Meteor.Collection('Blogs'),
  Statistics: new Meteor.Collection('Statistics'),
  Practices: new Meteor.Collection('Practices'),
  Tournaments: new Meteor.Collection('Tournaments'),
  TournamentList: new Meteor.Collection('tournamentList'),
  Participants: new Meteor.Collection('Participants'),
  Events: new Meteor.Collection('Events'),
  Countries: new Meteor.Collection('Countries'),
  Cities: new Meteor.Collection('Cities'),
  ContentVersions: new Meteor.Collection('ContentVersions'),
  Images: new Meteor.Collection('photos', {
    transform(doc) {
      if (Meteor.isServer) {
        return doc;
      }
      return _.extend(doc, {
        isImage() {
          return true;
        },
        url(size) {
          if (size) {
            return `/_image?imageId=${doc._id}&size=${size}`;
          }
          return `/_image?imageId=${doc._id}`;
        },
      });
    },
  }),
  Documents: new Meteor.Collection('documents', {
    transform(doc) {
      return _.extend(doc, {
        isImage() {
          return false;
        },
        url(size) {
          if (size) {
            return false;
          }
          return `/_document?docId=${doc._id}&${moment().unix()}`;
        },
      });
    },
  }),
  Folders: new Meteor.Collection('Folders'),
});

_.extend(UltiSite, {
  getAlias(userOrId) {
    if (typeof userOrId === 'undefined') {
      return 'Unbekannt';
    }
    if (userOrId === null) {
      return 'Unbekannt';
    }
    const user = Meteor.users.findOne(userOrId);
    if (user) {
      return user.username;
    }
    if (userOrId.username) {
      return userOrId.username;
    }
  },
  getAnyById(ids) {
    if (!ids) {
      return [];
    }
    const self = this;
    let idArray = ids;
    if (!idArray.length) {
      return undefined;
    }
    if (typeof idArray === 'string') {
      idArray = [ids];
    }
    let res;
    if (typeof ids === 'string') {
      res = UltiSite.LookupId.findOne(ids);
      if (res) {
        return res;
      }
    } else {
      res = UltiSite.LookupId.find({
        _id: {
          $in: ids,
        },
      });
      if (res.count() === idArray.length) {
        return res;
      }
    }
    Meteor.call('getAnyObjectByIds', idArray, function (err, res) {
      if (err) {
        console.log(err);
      } else {
        res.forEach(function (o) {
          let elem = o;
          if (elem.type === 'team') {
            elem = _.extend(
              {
                link: FlowRouter.path('tournament', {
                  _id: (UltiSite.Tournaments.findOne({ 'team._id': elem._id }) || elem)._id,
                }),
              },
              elem
            );
          } else if (elem.type === 'folder') {
            elem = _.extend(
              {
                link: FlowRouter.path('files', {
                  _id: elem._id,
                }),
              },
              elem
            );
          } else {
            elem = _.extend(
              {
                link: FlowRouter.path(elem.type, {
                  _id: elem._id,
                }),
              },
              elem
            );
          }
          const existing = UltiSite.LookupId.findOne(elem._id);
          if (!existing) {
            UltiSite.LookupId.insert(elem);
          } else if (!existing.link && elem.link) {
            UltiSite.LookupId.update(elem._id, { $set: { link: elem.link } });
          }
        });
      }
    });
    return res;
  },
  hostname() {
    let host = Meteor.absoluteUrl('');
    if (host[host.length - 1] === '/') {
      host = host.substr(0, host.length - 1);
    }
    return host;
  },
  settingsDep: new Tracker.Dependency(),
  settings(upd) {
    if (Meteor.isClient) {
      this.settingsDep.depend();
      if (upd) {
        Meteor.settings.public = upd;
        this.settingsDep.changed();
      }
      return Meteor.settings.public;
    }
    return UltiSite.Settings.findOne() || {};
  },
  isAdmin(userid, con) {
    if (!userid && Meteor.isServer) {
      userid = this.userId;
    }
    if (!userid && Meteor.isClient) {
      userid = Meteor.userId();
    }
    const user = Meteor.users.findOne(userid);
    return Roles.userIsInRole(userid, ['admin']) && user && user.activeAdmin;
  },

  userByAlias(alias, con) {
    return (
      alias &&
      Meteor.users.findOne({
        username: alias,
      })
    );
  },
  textState(state) {
    if (state === 100) {
      return 'Sicher';
    } else if (state >= 50) {
      return 'Vielleicht';
    } else if (state >= 10) {
      return 'Interesse';
    }
    return 'Kann nicht';
  },
  translate(term) {
    return translationTable[term] || term;
  },
});

Meteor.methods({
  getAnyObjectById(id) {
    check(id, String);
    check(this.userId, String);
    const res = this.getAnyObjectByIds([id]);
    if (res.length === 1) {
      if (res[0].count() === 1) {
        return res[0].fetch()[0];
      }
    }
  },
  getAnyObjectByIds(ids) {
    check(ids, Match.Maybe([String]));
    check(this.userId, String);
    if (!ids) {
      return [];
    }
    let res = [];

    res = res.concat(
      UltiSite.Folders.find({
        _id: {
          $in: ids,
        },
      }).map(function (elem) {
        return {
          _id: elem._id,
          name: elem.name,
          type: 'folder',
        };
      })
    );
    res = res.concat(
      UltiSite.WikiPages.find({
        _id: {
          $in: ids,
        },
      }).map(function (elem) {
        return {
          _id: elem._id,
          name: elem.name,
          type: 'wikipage',
        };
      })
    );
    res = res.concat(
      UltiSite.Tournaments.find({
        _id: {
          $in: ids,
        },
      }).map(function (elem) {
        return {
          _id: elem._id,
          name: elem.name,
          type: 'tournament',
        };
      })
    );
    res = res.concat(
      Meteor.users
        .find({
          _id: {
            $in: ids,
          },
        })
        .map(function (elem) {
          return {
            _id: elem._id,
            name: elem.username,
            type: 'user',
          };
        })
    );
    res = res.concat(
      UltiSite.Blogs.find({
        _id: {
          $in: ids,
        },
      }).map(function (elem) {
        return {
          _id: elem._id,
          name: elem.title,
          type: 'blog',
        };
      })
    );
    if (this.isSimulation) {
      res.forEach(function (obj) {
        UltiSite.LookupId.upsert(obj._id, obj);
      });
    }
    return res;
  },
});

String.prototype.toCamelCase = function () {
  let str = this;
  // Replace special characters with a space
  str = str.replace(/[^a-zA-Z0-9 ]/g, ' ');
  // put a space before an uppercase letter
  str = str.replace(/([a-z](?=[A-Z]))/g, '$1 ');
  // Lower case first character and some other stuff that I don't understand
  str = str
    .replace(/([^a-zA-Z0-9 ])|^[0-9]+/g, '')
    .trim()
    .toLowerCase();
  // uppercase characters preceded by a space or number
  str = str.replace(/([ 0-9]+)([a-zA-Z])/g, function (a, b, c) {
    return b.trim() + c.toUpperCase();
  });
  return str;
};
