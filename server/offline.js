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
    const search = {date:{$gte:moment().subtract(1,'year').toDate()}};
    if(req.query.since) {
        search._lastChange = {$gte:moment(req.query.since).toDate()};
    }
    const offline = {
        tournaments: UltiSite.Tournaments.find(search, {sort:{date:-1}}).map((t) => {
            t.teams = t.teams.map((teamId) => {
                const team = UltiSite.Teams.findOne(teamId);
                if(_.find(team.participants,p=>p.userid === user._id))
                    t.participating=true;
                return team;
            });
            return t;
        }),
    };
     
    console.log('LOAD tournaments as *.json');
    const content = JSON.stringify(offline);
    response.end(content);
});    
