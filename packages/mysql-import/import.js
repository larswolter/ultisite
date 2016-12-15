var mysqlDB;
var vereinId = "";
var mysqlQuery = null;

Meteor.startup(function(){
    if(!Meteor.settings.mysql_import.dbhost)
        throw new Meteor.Error('missing-settings','Meteor.settings.mysql_import.dbhost dbuser dbpassword dbname');
});

Meteor.methods({
    mysqlDBInfo: function() {
        mysqlDB = mysql.createConnection({
            host: Meteor.settings.mysql_import.dbhost,
            user: Meteor.settings.mysql_import.dbuser,
            password: Meteor.settings.mysql_import.dbpassword,
            database: Meteor.settings.mysql_import.dbname
        });
        mysqlQuery = Meteor.wrapAsync(mysqlDB.query, mysqlDB);
        mysqlDB.connect();
        var clubs = [];
        var matchedUser = [];
        var rows = mysqlQuery('select * from `verein`');
        rows.forEach(function (entry) {
            clubs.push(entry);
        });
        rows = mysqlQuery('select * from `user`');
        rows.forEach(function (entry) {
            var user = Meteor.users.findOne({'emails.address':entry.username});
            if(user)
                matchedUser.push(_.extend({ultisiteId:user._id},entry));
        });
        mysqlDB.end();        
        return {
            clubs: clubs,
            users:matchedUser,
            tournaments:0
        };
    },
    mysqlImportData: function (vereinId,userIds) {
        mysqlDB = mysql.createConnection({
            host: Meteor.settings.mysql_import.dbhost,
            user: Meteor.settings.mysql_import.dbuser,
            password: Meteor.settings.mysql_import.dbpassword,
            database: Meteor.settings.mysql_import.dbname
        });
        mysqlQuery = Meteor.wrapAsync(mysqlDB.query, mysqlDB);
        mysqlDB.connect();
        Tracker.nonreactive(function () {
            handleDBUsers(vereinId,userIds);
            
            handleDBTournament(vereinId);
            /*
            handleWikiPages(vereinId);
            handleDBPractices(vereinId);
            handleDBEvents(vereinId);
            handleFiles();
            handleStuff(vereinId);*/
        });
        mysqlDB.end();
    },
});


var handleDBSettings = function (clubName) {
    console.log("start settings");
    var rows = mysqlQuery('select * from `verein` where `webname` like ' + mysqlDB.escape(clubName));
    rows.forEach(function (entry) {
        UltiSite.Settings.upsert({
            verein_id: entry.id
        }, {
            $set: {
                verein_id: entry.id,
                name: entry.name,
                webname: entry.webname
            }
        });
    });
    if (UltiSite.Settings.find().count() === 0) {
        UltiSite.Settings.insert({
            verein_id: 99,
            name: clubName,
            webname: clubName
        });
    }
    console.log("Using settings for instance:", UltiSite.settings().webname);

    vereinId = UltiSite.settings().verein_id;

    rows = mysqlQuery('select * from `bezeichner` where verein_id= ' + mysqlDB.escape(vereinId));

    rows.forEach(function (entry) {
        var obj = {};
        if (entry.col_name === "opt_klassen")
            obj.arrayDivisions = entry.bezeichner.split(";");
        else if (entry.col_name === "opt_turnier_typen")
            obj.arrayCategorys = entry.bezeichner.split(";");
        else if (entry.col_name === "opt_untergruende")
            obj.arraySurfaces = entry.bezeichner.split(";");
        else if (entry.col_name === "opt_bsvstatus")
            obj.arrayClubStates = entry.bezeichner.split(";");
        else
            obj[entry.col_name] = entry.bezeichner;
        obj.verein_id = entry.verein_id;
        UltiSite.Settings.upsert({
            verein_id: obj.verein_id
        }, {
            $set: obj
        });
    });
    console.log("finished settings");
};

var handleDBUsers = function (vereinId,userIds) {
    console.log("retrieving users:",vereinId,userIds);

    var rows = mysqlQuery('select * from `user`, `verein_user` WHERE user_id = user.id AND verein_id = ' + mysqlDB.escape(vereinId) + '');
    rows.forEach(function (entry) {
        if(!_.contains(userIds,entry.id))
            return;
        var userObject = {};


        userObject.clubProperties = {};
        userObject.username = entry.alias;

        userObject.properties = {};

        var subrows = mysqlQuery('select * from `quartett` where user_id=' + mysqlDB.escape(entry.id));

        subrows.forEach(function (subEntry) {
            userObject.properties[subEntry.name] = subEntry.value;
        });

        userObject.contactDetails = [];
        subrows = mysqlQuery('select * from `email` where user_id=' + mysqlDB.escape(entry.id));

        subrows.forEach(function (subEntry) {
            var contactDetail = {};
            contactDetail.type = subEntry.kommentar;
            contactDetail.detail = subEntry.email;
            contactDetail.default = subEntry.standard;
            contactDetail._id = Random.id();

            userObject.contactDetails.push(contactDetail);
        });

        userObject.contactDetails.push({
            _id: Random.id(),
            type: "Adresse",
            default: false,
            detail: {
                street: entry.strasse,
                city: entry.ort,
                postcode: entry.plz,
                country: entry.land,
                geocoords: entry.geocoords
            }
        });
        userObject.name = entry.vor_name;
        userObject.surname = entry.nach_name;
        userObject.birthday = entry.geburtstag;
        userObject.properties.birthplace = entry.geburtsort;
        userObject.sex = entry.sex;
        userObject.oldId = entry.id;

        var current = Meteor.users.findOne({
            'emails.address': entry.username
        });

        if (typeof (entry.username) === 'object' || entry.username === "")
            return;
        if (current) {
            console.log('Updating existing user');
            Meteor.users.update({
                'emails.address': entry.username
            }, {
                $set: {
                    'profile': userObject
                }
            });
        } else
            Accounts.createUser({
                username: entry.alias,
                email: entry.username,
                profile: userObject
            });
        var user = Meteor.users.findOne({
            'emails.address': entry.username
        });

        subrows = mysqlQuery('select * from `user_properties` where user_id=' + mysqlDB.escape(entry.id));

        subrows.forEach(function (subEntry) {
            if (subEntry.name.indexOf("permission_admin") === 0)
                Roles.addUsersToRoles(user, ['admin']);
            if (subEntry.name.indexOf("permission_bsv") === 0)
                Roles.addUsersToRoles(user, ['club']);
        });
    });

    console.log("finished users");
};

var handleDBTournament = function (vereinId) {
    console.log("retrieving tournaments");

    var rows = mysqlQuery('select * from `turniere`');

    rows.forEach(function (entry) {
        var tournament = {};
        tournament._id = Random.id();
        tournament.contactDetails = [];
        tournament.divisions = [];
        tournament.teams = [];
        tournament.reports = [];
        tournament.description = [];
        tournament.tags = [];


        var subrows = mysqlQuery('select * from `extra_infos` where turnier_id=' + mysqlDB.escape(entry.id) + ' order by datum desc');
        subrows.forEach(function (subEntry) {
            var user = Meteor.users.findOne({
                'profile.oldId': subEntry.last_changer
            });
            var info = {
                _id: Random.id(),
                content: wikiPageTranslateOld(subEntry.extras),
                editor: user ? user._id : "",
                date: subEntry.datum
            };
            tournament.description.push(info);
        });
        tournament.description.push({
            _id: Random.id(),
            content: wikiPageTranslateOld(entry.beschreibung),
            editor: "",
            date: entry.last_change
        });
        subrows = mysqlQuery('select * from `bericht` where turnier_id=' + mysqlDB.escape(entry.id) + ' order by datum desc');
        subrows.forEach(function (subEntry) {
            var user = Meteor.users.findOne({
                'profile.oldId': subEntry.user_id
            });
            var info = {
                _id: Random.id(),
                content: wikiPageTranslateOld(subEntry.bericht),
                editor: user ? user._id : "",
                date: subEntry.datum
            };
            tournament.reports.push(info);
        });


        subrows = mysqlQuery('select * from `team` left join `team_result` on (team.id = team_id) where turnier_id=' + mysqlDB.escape(entry.id));

        subrows.forEach(function (subEntry) {
            var tnrows = mysqlQuery('select * from `teilnehmer`,`verein_user` where teilnehmer.user_id = verein_user.user_id AND verein_id=' +
                mysqlDB.escape(vereinId) + ' AND team_id=' + mysqlDB.escape(subEntry.id));
            if (tnrows.length === 0)
                return;
            var team = {
                name: subEntry.name,
                tournamentId: tournament._id,
                maxPlayers: subEntry.max_spieler,
                minFemale: subEntry.min_frauen,
                permissions: subEntry.zugriffsrechte,
                state: (subEntry.Angemeldet > 0 ? (subEntry.dabei > 0 ? "dabei" : (subEntry.dabei < 0 ? "auf Warteliste" : "angemeldet")) : "geplant"),
                clubTeam: subEntry.name.toLowerCase() === UltiSite.settings().teamname.toLowerCase(),
                division: subEntry.division,
                responsible: (Meteor.users.findOne({
                    "profile.oldId": subEntry.eintraeger
                }) || {})._id,
                placement: subEntry.platzierung,
                remarks: subEntry.anmerkungen,

                drawing: subEntry.auslosung,
                deadline: subEntry.endphase,
                drawingState: subEntry.ausgelost,
                tournamentDate: entry.datum,
                participants:[],

                results: {
                    placement: subEntry.ergebnis,
                    spirit: subEntry.spirit,
                    beerrace: subEntry.beerrace,
                    sidegames: subEntry.sidegame,
                    party: subEntry.partysieger,
                    teamfoto: subEntry.teamfoto,
                    restaurant: subEntry.restaurant,
                    restaurantQuality: subEntry.rest_bewertung,
                    comment: subEntry.kommentar,
                    resultsBy: (Meteor.users.findOne({
                        "profile.oldId": subEntry.eintrag_von
                    }) || {})._id
                }

            };

            tnrows.forEach(function (tnEntry) {
                var user = Meteor.users.findOne({
                    "profile.oldId": tnEntry.user_id
                });
                if (user) {
                    team.participants.push({
                        user: user._id,
                        username: user.username,
                        entryDate: tnEntry.eintragung,
                        sex: user.profile.sex,
                        state: tnEntry.beteiligung,
                        responsible: (Meteor.users.findOne({
                            "profile.oldId": tnEntry.eintraeger
                        }) || {})._id,
                        responsibleName:(Meteor.users.findOne({
                            "profile.oldId": tnEntry.eintraeger
                        }) || {}).username,
                        drawValue: tnEntry.LosWert,
                        comment: tnEntry.bemerkung
                    });
                }
            });
            var teamId = UltiSite.Teams.insert(team);
            tournament.teams.push(teamId);

            var comrows = mysqlQuery('select * from `team_comments` where team_id=' + mysqlDB.escape(subEntry.id));
            comrows.forEach(function (comment) {
                var user = Meteor.users.findOne({
                    "profile.oldId": subEntry.eintraeger
                });
                var alias = "Unbekannt";
                if (user)
                    alias = user.username;
                team.remarks += "<br/><b>" + alias + "</b>" + comment.anmerkung;
            });

        });

        var classes = entry.klasse.split(";");
        classes.forEach(function (elem) {
            tournament.divisions.push({
                name: elem,
                division: elem,
                surface: entry.untergrund,
                numPlayers: entry.anz_spieler
            });
        });
        tournament.contactDetails.email = entry.mail;

        tournament.address = {
            street: entry.strasse,
            city: entry.ort,
            postcode: entry.plz,
            country: entry.land,
            geocoords: entry.geocoords
        };

        tournament.oldId = entry.id;
        tournament.category = entry.typ;
        tournament.name = entry.name;
        tournament.website = entry.web;
        tournament.date = entry.datum;
        tournament.numDays = entry.numdays;
        tournament.tournamentDirector = entry.kontakt;
        tournament.lastChange = entry.last_change;

        UltiSite.Tournaments.insert(tournament);
    });
    console.log("Added tournaments");

};


var handleDBPractices = function (vereinId) {
    console.log("retrieving practices");

    var rows = mysqlQuery('select * from `trainings` where verein_id = ' + mysqlDB.escape(vereinId));

    rows.forEach(function (entry) {
        var practice = {
            start: entry.beginn,
            end: entry.ende,
            weekday: new Date(entry.beginn).getDay(),
            hostingTeam: entry.team,
            skillLevel: entry.fuer,
            trainer: entry.trainer,
            address: entry.adresse,
            description: entry.infos,
            geocoords: entry.geocoords,
            website: entry.webseite,
            contact: entry.kontakt,
            permissions: entry.zugriffsrechte,
            icon: entry.logo
        };
        UltiSite.Practices.upsert({
            start: practice.start,
            hostingTeam: practice.hostingTeam,
            weekday: practice.weekday
        }, {
            $set: practice
        });
    });
    console.log("Added practices");
};


var handleDBEvents = function () {
    /*
        var result = var rows = mysqlQuery(function () {
            return 'select * from `events`';
        });
        result.forEach(function (entry) {
            UltiSite.Events.insert(entry);
        });
    */
};
var handleWikiPages = function (vereinId) {
    console.log("retrieving wikipages");

    var rows = mysqlQuery('select * from `wiki` where verein = ' + mysqlDB.escape(vereinId));

    rows.forEach(function (entry) {
        var wikiPage = _.extend({}, entry);
        wikiPage.oldId = entry.id;
        wikiPage.locked = null;
        var subrows = mysqlQuery('select * from `wiki_historie` where ' +
            '`wiki_id` = ' + mysqlDB.escape(entry.id) + ' order by datum desc limit 1');
        wikiPage.content = wikiPageTranslateOld(subrows[0].content);
        wikiPage.editor = (Meteor.users.findOne({
            'profile.oldId': subrows[0].changer
        }) || {})._id;
        wikiPage.editorAlias = (Meteor.users.findOne({
            'profile.oldId': subrows[0].changer
        }) || {}).aliase;
        wikiPage.lastChange = subrows[0].datum;
        wikiPage.id = undefined;
        wikiPage.verein = undefined;

        UltiSite.WikiPages.upsert({
            oldId: wikiPage.oldId
        }, {
            $set: wikiPage
        });
    });
    console.log("Added wikipages");
};


var handleFiles = function () {
    var fs = Npm.require('fs');

    //    var mime = Npm.require('mime');

    var rows = mysqlQuery('select * from `wiki_image` ');
    rows.concat(mysqlQuery('select * from `wiki_document` '));
    console.log("Checking file import");
    var count = 0;
    rows.forEach(function (entry) {
        count++;
        var cfsFile = UltiSite.Images.findOne({
            oldUrl: entry.datei
        }) || UltiSite.Documents.findOne({
            oldUrl: entry.datei
        });
        if (cfsFile)
            return;
        var filename = "/home/lars/Dokumente/Develop/phpverwaltung/" + entry.datei;
        if (!fs.existsSync(filename)) {
            return;
        }
        if ((count % 10) === 0)
            console.log("Adding file " + count + " of " + rows.length);
        var filenamePure = filename.substr(filename.lastIndexOf("/") + 1);
        var newFile = new FS.File();
        var mimeType = "text/plain";
        var ext = filename.substr(filename.lastIndexOf(".") + 1);
        if (ext === 'png')
            mimeType = "image/png";
        if (ext === 'gif')
            mimeType = "image/gif";
        if (ext === 'jpg')
            mimeType = "image/jpg";
        if (ext === 'pdf')
            mimeType = "application/pdf";
        var commentRows = mysqlQuery('select * from `wiki_image_comment` where `imageid` =' + mysqlDB.escape(entry.id));
        newFile.associated = [];

        if (entry.associated.indexOf('user_bilder') === 0) {
            var olduid = entry.name.split('_')[1];
            var u = Meteor.users.findOne({
                'profile.oldId': olduid
            });
            if (u)
                newFile.associated.push(u._id);
        } else if (entry.associated === "") {
            var w = UltiSite.WikiPages.find({
                $or: [{
                    content: new RegExp("<img data-name='" + entry.name)
                }, {
                    content: new RegExp("\\/" + filenamePure.replace(".", "\\."))
                }, {
                    content: new RegExp("<a data-name='" + entry.name)
                }]
            });
            w.forEach(function (page) {
                newFile.associated.push(page._id);
            });
            var t = UltiSite.Tournaments.find({
                $or: [{
                    'description.content': new RegExp("<img data-name='" + entry.name)
                }, {
                    'description.content': new RegExp("\\/" + filenamePure.replace(".", "\\."))
                }, {
                    'description.content': new RegExp("<a data-name='" + entry.name)
                }]
            });
            t.forEach(function (tournament) {
                newFile.associated.push(tournament._id);
            });
        } else if (!isNaN(Number(entry.associated))) {
            var t = UltiSite.Tournaments.findOne({
                oldId: Number(entry.associated)
            });
            if (t)
                newFile.associated.push(t._id);
        } else {
            var w = UltiSite.WikiPages.findOne({
                name: entry.associated
            });
            if (w)
                newFile.associated.push(w._id);
        }
        //console.log("Got file associations "+filenamePure+" :"+newFile.associated.length);
        if (newFile.associated.length > 0) {
            newFile.oldName = entry.name;
            newFile.oldUrl = entry.datei;
            newFile.needsWikimatch = true;
            newFile.name(filenamePure);
            newFile.tags = [];
            newFile.comments = [];
            commentRows.forEach(function (commentEntry) {
                var comment = {
                    _id: Random.id(),
                    user: Meteor.users.findOne({
                        'profile.oldId': commentEntry.userid
                    })._id,
                    text: commentEntry.kommentar,
                    date: commentEntry.datum
                };
                newFile.comments.push(comment);
            });
            newFile.permissions = entry.zugriffsrechte || 666;
            if (entry.owner)
                newFile.creator = (Meteor.users.findOne({
                    'profile.oldId': entry.owner
                }) || {})._id;
            newFile.created = entry.last_change;

            var readStream = fs.createReadStream(filename);
            newFile.attachData(readStream, {
                type: mimeType
            });
            var id;
            if (newFile.isImage())
                id = UltiSite.Images.insert(newFile);
            else
                id = UltiSite.Documents.insert(newFile);
        }
    });
    console.log("Finished Checking file import");
};

function updateWikiContents(file) {
    var filenamePure = file.name().substr(file.name().lastIndexOf("/") + 1);

    file.associated.forEach(function (id) {
        var page = UltiSite.WikiPages.findOne(id);

        if (page) {
            console.log("Checking " + page.name);
            var content = page.content.replace("<a data-name='" + file.oldName + "' href='#'>Missing</a>", "<a href='" + file.url() + "' download='" + file.name() + "'>" + file.name() + "</a>")
                .replace("<img src='http://www.djdahlem.de/wiki/bilder/" + page.name + "/" + filenamePure + "'", "<img src='" + file.url() + "'")
                .replace("<img data-name='" + file.oldName + "' src='/public/missing.png'", "<img src='" + file.url() + "'");
            UltiSite.WikiPages.update(id, {
                $set: {
                    content: content
                }
            });
        }
        var tournament = UltiSite.Tournaments.findOne(id);
        if (tournament) {
            var description = tournament.description.content.replace("<a data-name='" + file.oldName + "' href='#'>Missing</a>", "<a download='" + file.name() + "' href='" + file.url() + "'>" + file.name() + "</a>")
                .replace("<img data-name='" + file.oldName + "' src='/public/missing.png'", "<img src='" + file.url() + "'");
            UltiSite.Tournaments.update(id, {
                $set: {
                    'description.content': description
                }
            });
        }
    });
}
var updateWikiImages = function () {
    UltiSite.Images.find({
        needsWikimatch: {
            $exists: true
        }
    }).forEach(function (file) {
        updateWikiContents(file);
        UltiSite.Images.update(file._id, {
            $unset: {
                needsWikimatch: null
            }
        });
    });
};
var updateWikiDocs = function () {
    UltiSite.Documents.find({
        needsWikimatch: {
            $exists: true
        }
    }).forEach(function (file) {
        updateWikiContents(file);
        UltiSite.Documents.update(file._id, {
            $unset: {
                needsWikimatch: null
            }
        });
    });
};