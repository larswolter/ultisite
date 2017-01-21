const notificationQueue = [];
const activeNotification = new ReactiveVar();

function startNotification(notification) {
    activeNotification.set(notification);
    Meteor.setTimeout(() => {
        activeNotification.set(undefined);
        if(notificationQueue.length)
            Meteor.setTimeout(() => {
                startNotification(notificationQueue.shift());
            },500);
    },4000);
}

UltiSite.notify = function(msg, type, template = 'notificationMessage') {
    const notification = {
        data: { msg, type },
        template
    };
    if(notificationQueue.length || activeNotification.get())
        notificationQueue.push(notification);
    else startNotification(notification);
};
Template.notificationArea.onCreated(function() {
});

Template.notificationArea.helpers({
    currentNotification() {
        if(Meteor.status().connected)
            return activeNotification.get();
        return activeNotification.get() || {
            template:'offlineInfo',
            data:{}
        };
    }
});
