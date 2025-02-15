Meteor.methods({
  updatePracticeImage(image) {
    check(image, Object);
    console.log('Updated practices map');
    if (!this.userId) {
      throw new Meteor.Error('access-denied');
    }
    Practices.update(image.associated[0], {
      $set: { mapImage: image._id, lastChange: new Date() },
    });
  },
  updatePractice(id, practice) {
    check(id, Match.Maybe(String));
    check(practice, Object);
    if (!this.userId) {
      throw new Meteor.Error('access-denied');
    }

    if (id) {
      if (!practice.$set) throw new Meteor.Error('update needs to be an update');
      practice.$set.lastChange = new Date();
      Practices.update(id, practice);
      console.log('updated practice');
    } else {
      console.log('inserting practice');
      return Practices.insert({ ...practice, lastChange: new Date() });
    }
    return id;
  },
  removePractice(id) {
    check(id, String);
    if (!this.userId) {
      throw new Meteor.Error('access-denied');
    }

    Practices.remove(id);
    console.log('deleted practice');
  },
});
