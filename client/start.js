import '/imports/client/practices/practiceView.js';

Template.startImageCarousel.onCreated(function () {
});

Template.startImageCarousel.helpers({
  logos() {
    return [];
  },
});
Template.start.onCreated(function () {
  this.practicesAvailable = new ReactiveVar(false);
  this.autorun(() => {
    if (!Meteor.user()) {
      import('/imports/client/practices/practiceView.js').then(() => {
        this.practicesAvailable.set(true);
      });
    }
  });
});

Template.start.helpers({
  practicesAvailable() {
    return Template.instance().practicesAvailable.get();
  },
  startPageTemplates() {
    return UltiSite.startPageTemplates.find();
  },
});

Template.eventList.onCreated(function () {
  this.subscribe("Events");
});

Template.eventItem.onCreated(function () {

});

Template.eventItem.helpers({
});

Template.eventItem.events({
  'click .action-go-event'(e, t) {
    FlowRouter.go(this.route, { _id: this.groupBy });
  },
});


Template.eventList.helpers({
  lastSync() {
    return UltiSite.offlineLastChange.format('DD.MM.YYYY HH:mm');
  },
  events() {
    const events = {};
    let entries = 0;
    UltiSite.Events.find({}, {
      sort: {
        'detail.time': -1,
      },
    }).forEach(function (event) {
      if (entries > 15) { return; }
      if (events[event.groupBy]) {
        if (event.detail.images && events[event.groupBy].detail[0].images &&
          (event.detail.text === events[event.groupBy].detail[0].text) &&
          (event.detail.alias === events[event.groupBy].detail[0].alias)) {
          events[event.groupBy].detail[0].images =
            events[event.groupBy].detail[0].images.concat(event.detail.images);
        } else {
          if (event.detail.type === 'team') {
            // ignore same person changes in teams
            const firstWord = event.detail.text.split(' ')[0];
            if (_.find(events[event.groupBy].detail, d => d.text.indexOf(firstWord) === 0)) { return; }
          }
          events[event.groupBy].detail.push(_.omit(event.detail, '_id'));
          entries++;
        }
      } else {
        entries++;
        events[event.groupBy] = event;
        events[event.groupBy].detail = [_.omit(event.detail, '_id')];
      }
    });
    return $.map(events, function (value) {
      return value;
    });
  },
});
