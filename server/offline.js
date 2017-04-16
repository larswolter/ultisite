const refreshDownloadToken = _.throttle(Meteor.bindEnvironment((userId) => {
    Meteor.users.update(userId,{ $set: {
        downloadToken: Random.id(40)
    }});
}),10000);

Meteor.startup(function() {
    Meteor.users.find().observe({
        changed(_id, fields) {
            if(fields.status)
                refreshDownloadToken(_id);
        }
    });
});

Meteor.methods({
    offlineCheckForNew(since) {
        if(UltiSite.Tournaments.find({lastChange:{$gte:since}}).count() > 3)
            return true;
        if(UltiSite.Teams.find({lastChange:{$gte:since}}).count() > 3)
            return true;
        return false;
    }
});

WebApp.connectHandlers.use('/_rest/offlineTournaments.json', (req, response) => {
    if (!req.query.accessToken) {
        response.writeHead(403);
        response.end('Missing accessToken');
        return;
    }
    const user = Meteor.users.findOne({downloadToken: req.query.accessToken});
    if (!user) {
        response.writeHead(403);
        response.end('Invalid accessToken');
        return;
    }
    response.setHeader('Content-Type', 'application/json');
    response.writeHead(200);
    const tournamentSearch = {date:{$gte:moment().subtract(1,'month').startOf('year').toDate()}};
    const teamSearch = {tournamentDate:{$gte:moment().subtract(1,'month').startOf('year').toDate()}};
    if(req.query.since) {
        tournamentSearch._lastChange = {$gte:moment(req.query.since).toDate()};
        teamSearch._lastChange = {$gte:moment(req.query.since).toDate()};
    }
    const offline = {
        tournaments: UltiSite.Tournaments.find(tournamentSearch, {sort:{date:-1}}).fetch(),
        teams: UltiSite.Teams.find(teamSearch).fetch(),
        removed:[]
    };
     
    console.log('LOAD tournaments as *.json');
    const content = JSON.stringify(offline);
    response.end(content);
});    
