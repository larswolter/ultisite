

Meteor.methods({
  checkPracticeSheet: _.throttle(() => {
    HTTP.get('https://sheets.googleapis.com/v4/spreadsheets/1lAiacQ1jj4ROk3BIB7auN9Rz6AFm1I4pzhzi-RdkEq8/values/B3:Z4?majorDimension=COLUMNS&key=AIzaSyBDwebvdBP1gVxFjRU5IpiDoGPVMjsuyHs',
      (err, res) => {
        if (res) {
          res.data.values.forEach((practice) => {
            const date = moment(practice[0], 'DD.MM.');
            if (date.isBefore(moment().subtract(6, 'month'))) {
              date.add(1, 'year');
            }
            const updated = UltiSite.Practices.update({
              weekday: date.weekday(),
              'planned.day': practice[0],
            }, { $set: { 'planned.$.yes': practice[1] } });
            if (!updated) {
              UltiSite.Practices.update({
                weekday: date.weekday(),
              }, { $push: { planned: { day: practice[0], yes: practice[1] } } });
            }
          });
        } else {
          console.error(err);
        }
      });
  }, 20000),
  updatePracticeImage(image) {
    console.log('Updated practices map');
    UltiSite.Practices.update(image.associated[0], {
      $set: { mapImage: image._id },
    });
  },
  updatePractice(id, practice) {
    if (id) {
      UltiSite.Practices.update(id, practice);
    } else {
      return UltiSite.Practices.insert(practice);
    }
    return id;
  },
});
