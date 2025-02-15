import { Practices } from '../common/lib/ultisite';

Meteor.methods({
  async updatePracticeImage(image) {
    check(image, Object);
    console.log('Updated practices map');
    if (!this.userId) {
      throw new Meteor.Error('access-denied');
    }
    await Practices.updateAsync(image.associated[0], {
      $set: { mapImage: image._id, lastChange: new Date() },
    });
  },
  async updatePractice(id, practice) {
    check(id, Match.Maybe(String));
    check(practice, Object);
    if (!this.userId) {
      throw new Meteor.Error('access-denied');
    }

    if (id) {
      if (!practice.$set) throw new Meteor.Error('update needs to be an update');
      practice.$set.lastChange = new Date();
      await Practices.updateAsync(id, practice);
      console.log('updated practice');
    } else {
      console.log('inserting practice');
      return await Practices.insertAsync({ ...practice, lastChange: new Date() });
    }
    return id;
  },
  async removePractice(id) {
    check(id, String);
    if (!this.userId) {
      throw new Meteor.Error('access-denied');
    }

    await Practices.removeAsync(id);
    console.log('deleted practice');
  },
});
