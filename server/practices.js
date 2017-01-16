

Meteor.methods({
    updatePracticeImage: function(image) {
        console.log('Updated practices map');
        UltiSite.Practices.update(image.associated[0],{$set:{mapImage:image._id}});
    }
});
