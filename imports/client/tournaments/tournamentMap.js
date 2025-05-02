import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import Tile from 'ol/layer/Tile';
import Vector from 'ol/layer/Vector';
import SourceOSM from 'ol/source/Tile';
import SourceVector from 'ol/source/Vector';
import { transform } from 'ol/proj';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import Map from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

Template.tournamentMap.onCreated(function () {
  var self = this;
  self.coordinateSource = new SourceVector({
    features: [],
  });
  self.tournamentCoordinates = new ReactiveVar([]);
  self.popupInfos = new ReactiveVar([]);
  self.subscribe('LastChanges', ['tournament']);
  self.autorun(function () {
    UltiSite.LastChanges.findOne();
    Meteor.call('tournamentCoordinates', function (err, res) {
      console.log('Got coordinates:', err, res.length);
      if (!err) {
        self.coordinateSource.clear(true);
        self.coordinateSource.addFeatures(
          res
            .filter(function (tournament) {
              return !!tournament.address.geocoords;
            })
            .map(function (tournament) {
              var coords = tournament.address.geocoords.split(',');
              coords = [parseFloat(coords[0]), parseFloat(coords[1])];
              var coordinate = transform(coords, 'EPSG:4326', 'EPSG:3857');
              return createIcon(new Point(coordinate), tournament);
            })
        );
      }
    });
  });
});
Template.tournamentMap.onRendered(function () {
  this.$('.popup').fadeOut();
  this.map = new Map({
    target: this.$('.tournament-map')[0],
    numZoomLevels: 20,
    layers: [
      new Tile({
        source: new SourceOSM({
          tilePixelRatio: 2,
        }),
      }),
      new Vector({
        source: this.coordinateSource,
      }),
    ],
  });
  this.map.setView(
    new View({
      center: transform([11, 51], 'EPSG:4326', 'EPSG:3857'),
      zoom: 5,
    })
  );
  this.map.updateSize();
});
Template.tournamentMap.helpers({
  popupInfos: function () {
    return Template.instance().popupInfos.get();
  },
});

Template.tournamentMap.events({
  'click .tournament-map': function (e, t) {
    var pixel = t.map.getEventPixel(e);
    var features = [];
    t.map.forEachFeatureAtPixel(pixel, function (feature) {
      features.push(feature);
    });
    if (features.length == 1)
      FlowRouter.go('tournament', {
        _id: features[0].getProperties()._id,
      });
  },
  'mousemove .tournament-map .popup': function (e, t) {
    e.stopPropagation();
  },
  'mousemove .tournament-map': function (e, t) {
    var pixel = t.map.getEventPixel(e);
    var features = [];
    t.map.forEachFeatureAtPixel(pixel, function (feature) {
      features.push(feature.getProperties());
    });
    if (features.length > 0 && t.popupInfos.get().length === 0) {
      t.$('.popup')
        .css('left', pixel[0] - 50)
        .css('top', pixel[1] - 50);
      t.$('.popup').fadeIn();
      t.popupInfos.set(features);
    } else if (features.length === 0 && t.popupInfos.get().length > 0)
      t.$('.popup').fadeOut(function () {
        t.popupInfos.set(features);
      });
  },
});

var createIcon = function (geometry, data) {
  var iconFeature = new Feature({
    geometry: geometry,
    name: 'Location',
  });

  var iconStyle = new Style({
    image: new Icon({
      anchor: [9, 27],
      anchorXUnits: 'pixels',
      anchorYUnits: 'pixels',
      opacity: 1.0,
      src: '/icons/map-location.png',
    }),
  });
  iconFeature.setProperties(data);
  iconFeature.setStyle(iconStyle);
  return iconFeature;
};
