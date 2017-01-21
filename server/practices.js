

Meteor.methods({
    updatePracticeImage: function(image) {
        console.log('Updated practices map');
        UltiSite.Practices.update(image.associated[0],{$set:{mapImage:image._id}});
    },
    updatePractice: function(id, practice) {
        if(id)
            UltiSite.Practices.update(id,practice);
        else
            id = UltiSite.Practices.insert(practice);
        return id;
    }
});
