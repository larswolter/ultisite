var APIKEY='212617522:AAGTfwysQy1D8eI_AiASOVnI9ug4WelbV_E';

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
