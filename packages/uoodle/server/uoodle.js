var Uoodles = new Meteor.Collection('UltisiteUoodles');

Meteor.publish('uoodles', function () {
    return Uoodles.find({
        validUntil: {
            $gte: moment().subtract(1, 'week').toDate()
        }
    });
});

Uoodles.allow({
    insert: function (userId, doc) {
        if (userId && (doc.owner === userId))
            return true;
    },
    update: function (userId, doc) {
        if (userId === doc.owner)
            return true;
    },
    remove: function (userId, doc) {
        if (userId === doc.owner)
            return true;
    }
});

Meteor.methods({
    uoodleParticipantNames(uoodleId) {
        const uoodle = Uoodles.findOne(uoodleId);
        const userMapping = {};
        uoodle.participants.forEach((userId) => {
            userMapping[userId] = Meteor.users.findOne(userId).username;
        });
        userMapping[uoodle.owner] = Meteor.users.findOne(uoodle.owner).username;
        return userMapping;
    },
    uoodleSetParticipation: function (uoodleId, optionId, number) {
        var part = {};
        part['options.$.' + this.userId] = number;
        console.log('uoodle updating:', uoodleId, optionId, number);
        const uoodle = Uoodles.findOne(uoodleId);
        const addEvent = !_.contains(uoodle.participants, this.userId);                
        Uoodles.update({
            _id: uoodleId,
            'options.id': optionId
        }, {
            $set: part,
            $addToSet: {
                participants: this.userId
            }
        }, function (err, res) {
            if(!err && addEvent)
                Meteor.call('addEvent', {
                    type: 'uoodle',
                    name: uoodle.name,
                    _id: uoodleId,
                    additional: 'Umfrage',
                    text: 'Hat teilgenommen'
                });                                
        });
    }
});
