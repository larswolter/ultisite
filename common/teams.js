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
        let team = UltiSite.Teams.findOne(teamId);
        let participants = _.sortBy(_.sortBy(team.participants, 'safeStateDate'), (p) => {
            return 100 - p.state;
        });
        // adjust list by drawing result

        let partUser = participants.map(function (participant, idx) {
            let user = Meteor.users.findOne(participant.user);
            let p = _.extend({
                teamId: team._id,
                visible: participant.state > 0 || Meteor.isClient && (
                    participant.user === Meteor.userId() ||
                    participant.responsible === Meteor.userId()),
                iconState: idx < (team.maxPlayers / 2) ? 'fa fa-clock-o' : 'fa fa-empty'
            }, user, participant);
            return p;
        });
        if (team.drawingResult) {
            let safe = _.first(partUser, team.maxPlayers / 2);
            let reorder = _.rest(partUser, team.maxPlayers / 2);
            reorder = _.sortBy(reorder, function (part) {
                let drawValue = part.drawing;
                if (drawValue === undefined || drawValue === null)
                    drawValue = 1000;
                if (part.state < 100)
                    drawValue = 1000 + drawValue;
                return drawValue;
            });

            partUser = safe.concat(reorder.map((part) => {
                return _.extend(part, { iconState: 'fa fa-magic' });
            }));

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
