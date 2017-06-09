import { AutoForm } from 'meteor/ultisite:autoform';
import './address.html';
import './address.less';

Template.ultisiteAddress.onCreated(function () {
  console.log("Address:", this);
  this.citySearch = new ReactiveVar([]);
  this.countrySearch = new ReactiveVar([]);
  this.streetSearch = new ReactiveVar([]);
  this.geocoords = new ReactiveVar('9,51');
  this.zoom = new ReactiveVar(4);
  this.autorun(() => {
      if (AutoForm.getFieldValue('address.geocoords')) {
          this.geocoords.set(AutoForm.getFieldValue('address.geocoords'));
          if (AutoForm.getFieldValue('address.street'))
              this.zoom.set(14);
          else if (AutoForm.getFieldValue('address.city'))
              this.zoom.set(11);
        }
    });
});
Template.ultisiteAddress.onRendered(function () {
  this.autorun(() => {
      console.log('Checking Address:', AutoForm.getFieldValue('address.country'), AutoForm.getFieldValue('address.city'));
      Meteor.call("checkAddress", AutoForm.getFieldValue('address.country'), AutoForm.getFieldValue('address.city'), (err, res) => {
          if (res && res.validCity)
              this.$('input[name="address.city"]').parents('.form-group').addClass('has-success');
          else
                this.$('input[name="address.city"]').parents('.form-group').removeClass('has-success');
          if (res && res.validCountry)
              this.$('.address-country-search').parents('.form-group').addClass('has-success');
          else
                this.$('.address-country-search').parents('.form-group').removeClass('has-success');
        });
    });
});

Template.ultisiteAddress.helpers({
  currentCoords: function () {
      return Template.instance().geocoords.get();
    },
  currentZoom: function () {
      return Template.instance().zoom.get();
    },
  citySearchResults: function () {
      return Template.instance().citySearch.get();
    },
  countrySearchResults: function () {
      return Template.instance().countrySearch.get();
    },
  streetSearchResults: function () {
      return Template.instance().streetSearch.get();
    },
  mapClickCallback: function () {
      var template = Template.instance();
      return function (geocoords) {
          template.$('input[name="address.geocoords"]').val(geocoords);
          template.$('input[name="address.geocoords"]').trigger('change');
          template.geocoords.set(geocoords);
        };
    }
});

Template.ultisiteAddress.events({
  'keyup input[name="address.street"]': function (e, t) {
      const country = AutoForm.getFieldValue('address.country');
      const city = AutoForm.getFieldValue('address.city');
      if (country && city && t.$(e.currentTarget).val()) {
          let url = 'http://nominatim.openstreetmap.org/search';
          HTTP.get(url, {
              params: {
                  country: country.toLowerCase(),
                  city: city.toLowerCase(),
                  street: t.$(e.currentTarget).val(),
                  format: 'json',
                  limit: 10,
                  addressdetails: 1
                }
            }, function (err, res) {
              if (err)
                  console.error(err);
              else {
                  t.streetSearch.set(res.data);
                }
            });
        }
    },
  'click .street-select': function (e, t) {
      console.log(this);
      t.$('input[name="address.street"]').val(this.address.road);
      t.$('input[name="address.street"]').change();
      t.geocoords.set(_.clone(this.lon + ',' + this.lat));
      t.$('input[name="address.geocoords"]').val(t.geocoords.get());
      t.$('input[name="address.geocoords"]').trigger('change');
      if (t.$('input[name="address.postcode"]').val() == '')
          t.$('input[name="address.postcode"]').val(this.address.postcode);
      t.zoom.set(14);
      t.$('.dropdown-street [data-toggle="dropdown"]').dropdown('toggle');
    },
  'keyup input[name="address.city"], focus input[name="address.city"]': function (e, t) {
      t.$(e.currentTarget).parents('.form-group').removeClass('has-success');
      const value = t.$(e.currentTarget).val().trim();
      const country = AutoForm.getFieldValue('address.country', this);
      console.log('searching city:', country, value);
      if (country && value)
          Meteor.call("getCityNames", value, country.toUpperCase(), function (err, res) {
              t.citySearch.set(res);
            });
    },
  'click .city-select': function (e, t) {
      t.$('input[name="address.city"]').val(this.name);
      t.$('input[name="address.city"]').change();
      t.geocoords.set(_.clone(this.geocoords).reverse().join(','));
      t.$('input[name="address.geocoords"]').val(t.geocoords.get());
      t.$('input[name="address.geocoords"]').trigger('change');
      t.zoom.set(11);
      t.$('.dropdown-city [data-toggle="dropdown"]').dropdown('toggle');
    },
  'keyup .address-country-search,focus .address-country-search': function (e, t) {
      t.$('.address-country-search').parents('.form-group').removeClass('has-success');
      t.$('.address-country').val('');
      var value = t.$(e.currentTarget).val().trim();
      Meteor.call("getCountryNames", value, function (err, res) {
          t.countrySearch.set(res);
        });
    },
  'click .country-select': function (e, t) {
      t.$('input[name="address.country"]').val(this._id);
      t.$('input[name="address.country"]').change();
      t.$('.address-country-search').val(this.name);
      t.geocoords.set(_.clone(this.coordinates).reverse().join(','));
      t.$('input[name="address.geocoords"]').val(t.geocoords.get());
      t.$('input[name="address.geocoords"]').trigger('change');
      t.zoom.set(4);
      t.$('.dropdown-country [data-toggle="dropdown"]').dropdown('toggle');
    },
});

