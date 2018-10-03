import { AutoForm } from 'meteor/ultisite:autoform';
import './address.html';
import './address.scss';

Template.ultisiteAddress.onCreated(function () {
  console.log('Address:', this);
  this.citySearch = new ReactiveVar([]);
  this.countrySearch = new ReactiveVar([]);
  this.streetSearch = new ReactiveVar([]);
  this.geocoords = new ReactiveVar('9,51');
  this.zoom = new ReactiveVar(4);
  this.autorun(() => {
    if (AutoForm.getFieldValue('address.geocoords')) {
      this.geocoords.set(AutoForm.getFieldValue('address.geocoords'));
      if (AutoForm.getFieldValue('address.street')) {
        this.zoom.set(14);
      } else if (AutoForm.getFieldValue('address.city')) { this.zoom.set(11); }
    }
  });
});
Template.ultisiteAddress.onRendered(function () {
  this.autorun(() => {
    console.log('Checking Address:', AutoForm.getFieldValue('address.country'), AutoForm.getFieldValue('address.city'));
    Meteor.call('checkAddress', AutoForm.getFieldValue('address.country'), AutoForm.getFieldValue('address.city'), (err, res) => {
      if (res && res.validCity) {
        this.$('input[name="address.city"]').parents('.form-group').addClass('has-success');
      } else {
        this.$('input[name="address.city"]').parents('.form-group').removeClass('has-success');
      }
      if (res && res.validCountry) {
        this.$('.address-country-search').parents('.form-group').addClass('has-success');
      } else {
        this.$('.address-country-search').parents('.form-group').removeClass('has-success');
      }
    });
  });
});

Template.ultisiteAddress.helpers({
  currentCoords() {
    return Template.instance().geocoords.get();
  },
  currentZoom() {
    return Template.instance().zoom.get();
  },
  citySearchResults() {
    return Template.instance().citySearch.get();
  },
  countrySearchResults() {
    return Template.instance().countrySearch.get();
  },
  streetSearchResults() {
    return Template.instance().streetSearch.get();
  },
  mapClickCallback() {
    const template = Template.instance();
    return function (geocoords) {
      template.$('input[name="address.geocoords"]').val(geocoords);
      template.$('input[name="address.geocoords"]').trigger('change');
      template.geocoords.set(geocoords);
    };
  },
});

Template.ultisiteAddress.events({
  'keyup input[name="address.street"]': function (evt, tmpl) {
    const country = AutoForm.getFieldValue('address.country');
    const city = AutoForm.getFieldValue('address.city');
    if (country && city && tmpl.$(evt.currentTarget).val()) {
      const url = 'http://nominatim.openstreetmap.org/search';
      HTTP.get(url, {
        params: {
          country: country.toLowerCase(),
          city: city.toLowerCase(),
          street: tmpl.$(evt.currentTarget).val(),
          format: 'json',
          limit: 10,
          addressdetails: 1,
        },
      }, function (err, res) {
        if (err) { console.error(err); } else {
          tmpl.streetSearch.set(res.data);
        }
      });
    }
  },
  'click .street-select': function (evt, tmpl) {
    evt.preventDefault();
    tmpl.$('input[name="address.street"]').val(this.address.road);
    tmpl.$('input[name="address.street"]').change();
    tmpl.geocoords.set(_.clone(this.lon + ',' + this.lat));
    tmpl.$('input[name="address.geocoords"]').val(tmpl.geocoords.get());
    tmpl.$('input[name="address.geocoords"]').trigger('change');
    if (tmpl.$('input[name="address.postcode"]').val() === '') { tmpl.$('input[name="address.postcode"]').val(this.address.postcode); }
    tmpl.zoom.set(14);
    tmpl.$('.dropdown-street [data-toggle="dropdown"]').dropdown('toggle');
  },
  'keyup input[name="address.city"], focus input[name="address.city"]': function (evt, tmpl) {
    tmpl.$(evt.currentTarget).parents('.form-group').removeClass('has-success');
    const value = tmpl.$(evt.currentTarget).val().trim();
    const country = AutoForm.getFieldValue('address.country', this);
    console.log('searching city:', country, value);
    if (country && value) {
      Meteor.call('getCityNames', value, country.toUpperCase(), function (err, res) {
        tmpl.citySearch.set(res);
      });
    }
  },
  'click .city-select': function (evt, tmpl) {
    evt.preventDefault();
    tmpl.$('input[name="address.city"]').val(this.name);
    tmpl.$('input[name="address.city"]').change();
    tmpl.geocoords.set(_.clone(this.geocoords).reverse().join(','));
    tmpl.$('input[name="address.geocoords"]').val(tmpl.geocoords.get());
    tmpl.$('input[name="address.geocoords"]').trigger('change');
    tmpl.zoom.set(11);
    tmpl.$('.dropdown-city [data-toggle="dropdown"]').dropdown('toggle');
  },
  'keyup .address-country-search,focus .address-country-search': function (evt, tmpl) {
    tmpl.$('.address-country-search').parents('.form-group').removeClass('has-success');
    tmpl.$('.address-country').val('');
    const value = tmpl.$(evt.currentTarget).val().trim();
    Meteor.call('getCountryNames', value, function (err, res) {
      tmpl.countrySearch.set(res);
    });
  },
  'click .country-select': function (evt, tmpl) {
    evt.preventDefault();
    tmpl.$('input[name="address.country"]').val(this._id);
    tmpl.$('input[name="address.country"]').change();
    tmpl.$('.address-country-search').val(this.name);
    tmpl.geocoords.set(_.clone(this.coordinates).reverse().join(','));
    tmpl.$('input[name="address.geocoords"]').val(tmpl.geocoords.get());
    tmpl.$('input[name="address.geocoords"]').trigger('change');
    tmpl.zoom.set(4);
    tmpl.$('.dropdown-country [data-toggle="dropdown"]').dropdown('toggle');
  },
});

