import { Cities, Countries } from '../common/lib/ultisite';

Meteor.methods({
  getCityNames: async function(term, country) {
    check(country, String);
    check(term, String);
    return await Cities.find(
      {
        country: country,
        name: new RegExp(term.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'), 'i'),
      },
      {
        limit: 10,
      }
    ).mapAsync(function (elem) {
      return {
        name: elem.name,
        geocoords: elem.geocoords,
      };
    });
  },
  getCountryNames: async function(term) {
    check(term, String);
    return await Countries.find(
      {
        name: new RegExp(term.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'), 'i'),
      },
      {
        limit: 10,
      }
    ).fetchAsync();
  },
  checkAddress: async function(country, city) {
    check(country, String);
    check(city, String);
    let res = {};
    res.validCountry = !!(await Countries.findOneAsync(country.toUpperCase()));
    res.validCity = !!(await Cities.findOneAsync({ country: country.toUpperCase(), name: city }));
    return res;
  },
});
