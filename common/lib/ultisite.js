import { Mongo } from 'meteor/mongo';
import { moment } from 'meteor/momentjs:moment';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Roles } from 'meteor/alanning:roles';

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
  // appCacheConfig.chrome = false;
  if (Meteor.absoluteUrl('').indexOf('localhost') > -1) {
    //    appCacheConfig.chrome = false;
    //    appCacheConfig.firefox = false;
    //    appCacheConfig.ie = false;
  }
  //  Meteor.AppCache.config(appCacheConfig);
}

export const LookupId = new Mongo.Collection(null);
export const AdminNotifications = new Mongo.Collection('AdminNotifications');
export const LastChanges = new Mongo.Collection('LastChanges');
export const WikiPages = new Mongo.Collection('WikiPages');
export const WikiPageDiscussions = new Mongo.Collection('WikiPagDiscussiones');
export const Blogs = new Mongo.Collection('Blogs');
export const Statistics = new Mongo.Collection('Statistics');
export const Practices = new Mongo.Collection('Practices');
export const Tournaments = new Mongo.Collection('Tournaments');
export const TournamentList = new Mongo.Collection('tournamentList');
export const Participants = new Mongo.Collection('Participants');
export const Events = new Mongo.Collection('Events');
export const Countries = new Mongo.Collection('Countries');
export const Cities = new Mongo.Collection('Cities');
export const ContentVersions = new Mongo.Collection('ContentVersions');
export const Images = new Mongo.Collection('photos', {
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
});
export const Documents = new Mongo.Collection('documents', {
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
});
export const Folders = new Mongo.Collection('Folders');
export const offlineCollections = [
  {
    name: 'Events',
    filter() {
      return {};
    },
    options() {
      return { limit: 30, sort: { 'detail.time': -1 } };
    },
  },
];
export const baseLayoutData = new ReactiveVar();
export const tournamentsReady = new ReactiveVar(false);
export const wikiPagesReady = new ReactiveVar(false);
export const blogsReady = new ReactiveVar(false);
export const filesReady = new ReactiveVar(false);
export const usersReady = new ReactiveVar(false);
export const initialSubsReady = new ReactiveVar(false);
export const schemas = {
  links: new ReactiveVar(null),
  team: new ReactiveVar(null),
  tournament: new ReactiveVar(null),
  user: new ReactiveVar(null),
  userRegister: new ReactiveVar(null),
  blog: new ReactiveVar(null),
  emailServerSchema: new ReactiveVar(null),
  practice: new ReactiveVar(null),
};

export const getAlias = async (userOrId) => {
  if (typeof userOrId === 'undefined') {
    return 'Unbekannt';
  }
  if (userOrId === null) {
    return 'Unbekannt';
  }
  const user = await Meteor.users.findOneAsync(userOrId);
  if (user) {
    return user.username;
  }
  if (userOrId.username) {
    return userOrId.username;
  }
};
export function getAnyById(ids) {
  if (!ids) {
    return [];
  }
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
}

export function hostname() {
  let host = Meteor.absoluteUrl('');
  if (host[host.length - 1] === '/') {
    host = host.substr(0, host.length - 1);
  }
  return host;
}
export const settingsDep = new Tracker.Dependency();
export function settings(upd) {
  if (Meteor.isClient) {
    this.settingsDep.depend();
    if (upd) {
      Meteor.settings.public = upd;
      this.settingsDep.changed();
    }
    return Meteor.settings.public;
  }
  return UltiSite.Settings.findOne() || {};
}
export async function isAdmin(userid) {
  if (!userid && Meteor.isServer) {
    userid = this.userId;
  }
  if (!userid && Meteor.isClient) {
    userid = Meteor.userId();
  }
  const user = await Meteor.users.findOneAsync(userid);
  return Roles.userIsInRole(userid, ['admin']) && user && user.activeAdmin;
}

export async function userByAlias(alias) {
  return (
    alias &&
    (await Meteor.users.findOneAsync({
      username: alias,
    }))
  );
}
export function textState(state) {
  if (state === 100) {
    return 'Sicher';
  } else if (state >= 50) {
    return 'Vielleicht';
  } else if (state >= 10) {
    return 'Interesse';
  }
  return 'Kann nicht';
}
export function translate(term) {
  return translationTable[term] || term;
}

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
  async getAnyObjectByIds(ids) {
    check(ids, Match.Maybe([String]));
    check(this.userId, String);
    if (!ids) {
      return [];
    }
    let res = [];

    res = res.concat(
      await UltiSite.Folders.find({
        _id: {
          $in: ids,
        },
      }).mapAsync(function (elem) {
        return {
          _id: elem._id,
          name: elem.name,
          type: 'folder',
        };
      })
    );
    res = res.concat(
      await UltiSite.WikiPages.find({
        _id: {
          $in: ids,
        },
      }).mapAsync(function (elem) {
        return {
          _id: elem._id,
          name: elem.name,
          type: 'wikipage',
        };
      })
    );
    res = res.concat(
      await UltiSite.Tournaments.find({
        _id: {
          $in: ids,
        },
      }).mapAsync(function (elem) {
        return {
          _id: elem._id,
          name: elem.name,
          type: 'tournament',
        };
      })
    );
    res = res.concat(
      await Meteor.users
        .find({
          _id: {
            $in: ids,
          },
        })
        .mapAsync(function (elem) {
          return {
            _id: elem._id,
            name: elem.username,
            type: 'user',
          };
        })
    );
    res = res.concat(
      await UltiSite.Blogs.find({
        _id: {
          $in: ids,
        },
      }).mapAsync(function (elem) {
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

UltiSite = {
  offlineCollections,
  LookupId,
  AdminNotifications,
  LastChanges,
  WikiPages,
  WikiPageDiscussions,
  Blogs,
  Statistics,
  Practices,
  Tournaments,
  TournamentList,
  Participants,
  Events,
  Countries,
  Cities,
  ContentVersions,
  Images,
  Documents,
  Folders,
  baseLayoutData,
  tournamentsReady,
  wikiPagesReady,
  blogsReady,
  filesReady,
  usersReady,
  initialSubsReady,
  schemas,
};
