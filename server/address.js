Meteor.methods({
    getCityNames: function (term, country) {
        return UltiSite.Cities.find({
            "country": country,
            "name": new RegExp(term.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"),'i')
        }, {
            limit: 10
        }).map(function (elem) {
            return {
                name: elem.name,
                geocoords: elem.geocoords
            };
        });
    },
    getCountryNames: function (term, country) {
        return UltiSite.Countries.find({
            "name": new RegExp(term.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"),'i')
        }, {
            limit: 10
        }).fetch();
    },
    checkAddress: function (country,city) {
        let res = {};
        res.validCountry = !!UltiSite.Countries.findOne(country);
        res.validCity = !!UltiSite.Cities.findOne({country,name:city});
        return res;
    }
    
});