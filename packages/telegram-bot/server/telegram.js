var APIKEY=Meteor.settings.telegramAPIKey;

Meteor.methods({
    getUpdates: function() {
        HTTP.get('https://api.telegram.org/bot'+APIKEY+'/getMe', {
            params: {
            }
        }, function (error, result) {
            console.log(error,result);
        });
        HTTP.get('https://api.telegram.org/bot'+APIKEY+'/getUpdates', {
            params: {
            }
        }, function (error, result) {
            console.log(error,result);
        });
    } 
});
