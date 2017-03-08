_.extend(UltiSite, {
    stateColor(state) {
        switch (state) {
            case "dabei": return "success";
            case "angemeldet": return "warning";
            case "auf Warteliste": return "danger";
            case "abgesagt": return "danger";
            default: return "default";
        }
    },
    participantList: function (teamId) {
        let team = UltiSite.Teams.findOne(teamId) || UltiSite.getTeam(teamId);
        let participants = _.sortBy(_.sortBy(team.participants, 'safeStateDate'), (p) => {
            return 100 - p.state;
        });
        // adjust list by drawing result
        if (team.drawingResult) {
            participants = _.sortBy(_.sortBy(team.participants, 'safeStateDate'), 'drawing');
        }
        let partUser = participants.map(function (participant, idx) {
            let user = Meteor.users.findOne(participant.user);
            let p = _.extend({
                teamId: team._id,
                visible: participant.state > 0 || Meteor.isClient && (
                    participant.user === Meteor.userId() ||
                    participant.responsible === Meteor.userId()),
                iconState: participant.drawing === 0?'fa fa-clock-o':
                    participant.drawing !== 1000?'fa fa-magic':
                    idx < (team.maxPlayers / 2) ? 'fa fa-clock-o' : 'fa fa-empty'
            }, user, participant);
            return p;
        });
        if (team.drawingResult) {
            // check females
            let females = 0;
            let femalesWaiting = 0;
            partUser.forEach((part, idx) => {
                if (part.sex === 'W')
                    if (idx >= team.maxPlayers)
                        femalesWaiting++;
                    else
                        females++;
            });
            console.log('Female state:', females, femalesWaiting, team.minFemale);
            if (females < team.minFemale && femalesWaiting > 0) {
                let players = _.sortBy(_.first(partUser, team.maxPlayers), (p) => {
                    return p.sex === 'W' ? 0 : 1;
                });
                let waiting = _.sortBy(_.rest(partUser, team.maxPlayers), (p) => {
                    return p.sex === 'W' ? 0 : 1;
                });
                let switches = 0;
                while (females < team.minFemale && femalesWaiting > 0) {
                    let temp = players[players.length - switches - 1];
                    players[players.length - switches - 1] = waiting[switches];
                    players[players.length - switches - 1].iconState = 'fa fa-venus-mars';
                    waiting[switches] = temp;
                    femalesWaiting--;
                    females++;
                    switches++;
                }
                participants = players.concat(waiting);
            } else
                participants = partUser;
        } else
            participants = partUser;
        return participants.map((p, idx) => {
            return _.extend(p, {
                waiting: team.maxPlayers === idx,
                _id: p.user
            });
        });
    }
});
