Meteor.methods({
    getCityNames: function (term, country) {
        check(country, String);
        check(term, String);
        return UltiSite.Cities.find({
            "country": country,
            "name": new RegExp(term.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), 'i')
        }, {
                limit: 10
            }).map(function (elem) {
                return {
                    name: elem.name,
                    geocoords: elem.geocoords
                };
            });
    },
    getCountryNames: function (term) {
        check(term, String);
        return UltiSite.Countries.find({
            "name": new RegExp(term.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), 'i')
        }, {
                limit: 10
            }).fetch();
    },
    checkAddress: function (country, city) {
        check(country, String);
        check(city, String);
        let res = {};
        res.validCountry = !!UltiSite.Countries.findOne(country.toUpperCase());
        res.validCity = !!UltiSite.Cities.findOne({ country: country.toUpperCase(), name: city });
        return res;
    }

});