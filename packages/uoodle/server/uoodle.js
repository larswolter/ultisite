var Uoodles = new Meteor.Collection('UltisiteUoodles');

Meteor.publish('uoodles', function () {
    return Uoodles.find({
        validUntil: {
            $gte: new Date()
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
    uoodleSetParticipation: function (uoodleId, optionId, number) {
        var part = {};
        part['options.$.' + this.userId] = number;
        console.log('uoodle updating:', uoodleId, optionId, number);
        Uoodles.update({
            _id: uoodleId,
            'options.id': optionId
        }, {
            $set: part,
            $addToSet: {
                participants: this.userId
            }
        }, function (err, res) {
            console.log(err, res);
            if(!err)
                Meteor.call('addEvent', {
                    type: 'uoodle',
                    name: Uoodles.findOne(uoodleId).name,
                    _id: uoodleId,
                    additional: 'Umfrage',
                    text: 'Hat teilgenommen'
                });                                
        });
    }
});
