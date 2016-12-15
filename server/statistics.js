Meteor.startup(() => {
    UltiSite.Statistics.remove({});
});

Meteor.methods({
    computeStatistics: function (userId) {
        this.unblock();
        let players = [];

        const teams = UltiSite.Teams.find({
            'participants.user': userId
        }).map(function (team) {
            var tournament = UltiSite.Tournaments.findOne(team.tournamentId);
            if (!tournament)
                return undefined;
            if (!team)
                return undefined;

            if (Array.isArray(team.participants) && moment().isAfter(tournament.date))
                players = players.concat(team.participants.map(function (participant) {
                    return participant.user;
                }).filter(pid => pid !== userId));

            return {
                name: tournament.name,
                date: tournament.date,
                teamname: team.name,
                teamId: team._id,
                tournamentId: tournament._id,
                unsure: (team.state != "dabei") || (tournament.category == "Veranstaltung")
            };
        });
        var played = _.sortBy(teams.filter(function (elem) {
            if (!elem)
                return false;
            if (moment(elem.date).isAfter(moment()))
                return false;
            return true;
        }), function (elem) {
            return -moment(elem.date).diff(moment(), "seconds");
        });
        var planned = _.sortBy(teams.filter(function (elem) {
            if (!elem)
                return false;
            if (moment(elem.date).isBefore(moment()))
                return false;
            return true;
        }), function (elem) {
            return moment(elem.date).diff(moment(), "seconds");
        });

        var stats = {
            target: userId,
            type: "playedTournaments",
            data: played
        };
        UltiSite.Statistics.upsert({
            target: stats.target,
            type: stats.type
        }, {
                $set: {
                    data: stats.data
                }
            });
        stats = {
            target: userId,
            type: "plannedTournaments",
            data: planned
        };
        UltiSite.Statistics.upsert({
            target: stats.target,
            type: stats.type
        }, {
                $set: {
                    data: stats.data
                }
            });
        let result = [];
        const playerCounts = _.countBy(players, p => p);

        Object.keys(playerCounts).forEach((pc) => {
            result.push({
                userId: pc,
                username: (Meteor.users.findOne(pc) || {}).username || pc,
                count: playerCounts[pc]
            });
        });
        result = _.first(_.sortBy(result, 'count').reverse(), 10);

        var top10Stats = {
            target: userId,
            type: "top10Players",
            data: result
        };
        UltiSite.Statistics.upsert({
            target: top10Stats.target,
            type: top10Stats.type
        }, top10Stats);
    }

});