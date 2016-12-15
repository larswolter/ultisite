
Template.afObjectField_address.onCreated(function () {
    console.log("Address:",this);
    this.citySearch = new ReactiveVar([]);
    this.countrySearch = new ReactiveVar([]);
    this.streetSearch = new ReactiveVar([]);
    this.geocoords = new ReactiveVar('9,51');
    this.zoom = new ReactiveVar(4);
    this.autorun(()=>{
        if(AutoForm.getFieldValue('address.geocoords')) {
            this.geocoords.set(AutoForm.getFieldValue('address.geocoords'));
            if(AutoForm.getFieldValue('address.street'))
                this.zoom.set(14);
            else if(AutoForm.getFieldValue('address.city'))
                this.zoom.set(11);            
        }
    });
});
Template.afObjectField_address.onRendered(function () {
    checkAddress(this);
});

Template.afObjectField_address.helpers({
    currentCoords: function() {
        return Template.instance().geocoords.get();
    },
    currentZoom: function() {
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
    mapClickCallback: function() {
        var template = Template.instance();
        return function(geocoords) {
            template.$('input[name="address.geocoords"]').val(geocoords);
            template.geocoords.set(geocoords);
        };
    }
});

Template.afObjectField_address.events({
    'keyup .address-street': function(e,t) {
        if(t.$('.address-country').val() && t.$('.address-city').val() && t.$('.address-street').val()) {
            let url = 'http://nominatim.openstreetmap.org/search';
            HTTP.get(url,{
                params:{
                    country:t.$('.address-country').val().toLowerCase(),
                    city: t.$('.address-city').val().toLowerCase(),
                    street: t.$('.address-street').val(),
                    format:'json',
                    limit:10,
                    addressdetails:1
                }
            },function(err,res){
                if(err)
                    console.error(err);
                else {
                    t.streetSearch.set(res.data);
                }
            });
        }
    },
    'click .street-select': function (e, t) {
        console.log(this);
        t.$('.address-street').val(this.address.road);
        t.geocoords.set(_.clone(this.lon+','+this.lat));
        t.$('input[name="address.geocoords"]').val(this.lon+','+this.lat);
        if(t.$('input[name="address.postcode"]').val()=='')
            t.$('input[name="address.postcode"]').val(this.address.postcode);
        t.zoom.set(14);
        t.$('.dropdown-street [data-toggle="dropdown"]').dropdown('toggle');
    },
    'change .address-city, change .address-country-search': function(e,t) {
        checkAddress(t);
    },
    'keyup .address-city, focus .address-city': function (e, t) {
        t.$('.address-city').removeClass('valid');
        var value = t.$(e.currentTarget).val().trim();
        Meteor.call("getCityNames", value, t.$('.address-country').val(), function (err, res) {
            t.citySearch.set(res);
        });
    },
    'click .city-select': function (e, t) {
        t.$('.address-city').val(this.name);
        t.geocoords.set(_.clone(this.geocoords).reverse().join(','));
        t.zoom.set(11);
        t.$('.dropdown-city [data-toggle="dropdown"]').dropdown('toggle');
    },
    'keyup .address-country-search,focus .address-country-search': function (e, t) {
        t.$('.address-country-search').removeClass('valid');
        t.$('.address-country').val('');
        var value = t.$(e.currentTarget).val().trim();
        Meteor.call("getCountryNames", value, function (err, res) {
            t.countrySearch.set(res);
        });
    },
    'click .country-select': function (e, t) {
        t.$('.address-country').val(this._id);
        t.$('.address-country-search').val(this.name);
        t.geocoords.set(_.clone(this.coordinates).reverse().join(','));
        t.zoom.set(4);
        t.$('.dropdown-country [data-toggle="dropdown"]').dropdown('toggle');
    },
    'change select.address-country': function (e, t) {
        var c = UltiSite.Countries.findOne(t.$(e.currentTarget).val());
        t.geocoords.set(c.coordinates.reverse().join(','));
        t.zoom.set(4);
    }

});

function checkAddress(t) {
    Meteor.call("checkAddress", t.$('.address-country').val(), t.$('.address-city').val(), function (err, res) {
        if(res && res.validCity)
            t.$('.address-city').addClass('valid');
        if(res && res.validCountry)
            t.$('.address-country-search').addClass('valid');
    });    
}