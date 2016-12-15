var users = new Meteor.Collection(null);
var clubs = new Meteor.Collection(null);
Meteor.startup(function() {
    Template.registerHelper('mysqlImportAvailable',function(){
        return true;
    });
});

Template.mysqlImport.onCreated(function(){
    Meteor.call('mysqlDBInfo',function(err,res) {
        if(err)
            throw err;
        clubs.remove({});
        res.clubs.forEach(function(club){
            clubs.insert(club);
        })
        users.remove({});
        res.users.forEach(function(user){
            users.insert(user);
        })
    });
});

Template.mysqlImport.events({
    'click .mysql-club':function(e,t) {
        e.preventDefault();
        clubs.update({},{$set:{selected:false}},{multi:true});
        clubs.update(this._id,{$set:{selected:true}});
    },
    'click .mysql-user':function(e,t) {
        e.preventDefault();
        if(this.selected)
            users.update(this._id,{$set:{selected:false}});
        else
            users.update(this._id,{$set:{selected:true}});
    },
    'submit form.mysql-import': function(e,t) {
        e.preventDefault();
        if(clubs.findOne({selected:true}))
            Meteor.call('mysqlImportData', clubs.findOne({
                    selected: true
                }).id, users.find({
                    selected: true
                }).map(function (u) {
                    return u.id;
            }));
    }
});

Template.mysqlImport.helpers({
    users: function() {
        return users.find();
    },
    clubs: function() {
        return clubs.find();
    }
})