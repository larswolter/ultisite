import { moment } from 'meteor/momentjs:moment';
import 'ol/ol.css';
import Tile from 'ol/layer/Tile';
import Vector from 'ol/layer/Vector';
import SourceOSM from 'ol/source/OSM';
import SourceVector from 'ol/source/Vector';
import { transform } from 'ol/proj';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import Map from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import Overlay from 'ol/Overlay';
import Point from 'ol/geom/Point';

UltiSite.createMap = function (targetElement, params) {};

Template.ultisiteMap.onCreated(function () {
  console.log('ultisiteMap:', this.data);
});

Template.ultisiteMap.onRendered(function () {
  let template = this;
  let setupMap = function () {
    let coords = [10, 52];
    let markerCoords = [0, 0];
    if (template.data.marker) {
      markerCoords = template.data.marker.split(',');
    }
    if (template.data.geocoords) {
      coords = template.data.geocoords.split(',');
    }

    template.map = new Map({
      target: template.$('.map')[0],
      numZoomLevels: 20,
      layers: [
        new Tile({
          source: new SourceOSM({
            tilePixelRatio: 2,
          }),
        }),
      ],
      view: new View({
        center: transform([parseFloat(coords[0]), parseFloat(coords[1])], 'EPSG:4326', 'EPSG:3857'),
        zoom: template.data.zoom || 6,
      }),
    });

    if (template.data.marker || template.data.mapClick) {
      markerCoords = transform([parseFloat(markerCoords[0]), parseFloat(markerCoords[1])], 'EPSG:4326', 'EPSG:3857');
      template.map.marker = createIcon(new Point(markerCoords));
      template.map.addLayer(
        new Vector({
          source: new SourceVector({
            features: [template.map.marker],
          }),
        })
      );
      if (template.data.mapClick) {
        template.map.on('click', (evt) => {
          template.map.marker.setGeometry(new Point(evt.coordinate));

          template.data.mapClick(transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326').join(','), template.map);
        });
      }
    }
    if (template.data.getElementsMethod) {
      Meteor.call(template.data.getElementsMethod, function (err, res) {
        if (!err) {
          template.map.addLayer(
            new Vector({
              style: new Style({
                image: new Icon(
                  /** @type {olx.style.IconOptions} */ ({
                    anchor: [9, 27],
                    anchorXUnits: 'pixels',
                    anchorYUnits: 'pixels',
                    opacity: 1.0,
                    src: '/icons/map-location.png',
                  })
                ),
              }),
              source: new SourceVector({
                features: res.map((e) => {
                  let coords = e.address.geocoords.split(',');
                  let point = new Point(
                    transform([parseFloat(coords[0]), parseFloat(coords[1])], 'EPSG:4326', 'EPSG:3857')
                  );
                  let feat = new Feature(point);
                  feat.tournament = e;
                  return feat;
                }),
              }),
            })
          );
        } else {
          console.error('Could not retrieve tournament coordinates');
        }
      });
      let popup = new Overlay({
        element: document.getElementById('popup'),
      });
      template.map.addOverlay(popup);
      template.map.on('click', function (evt) {
        let pixel = template.map.getPixelFromCoordinate(evt.coordinate);
        console.log('Got click:', pixel);
        let features = [];
        template.map.forEachFeatureAtPixel(pixel, function (feature) {
          features.push(feature);
          console.log('got feature:', feature.tournament);
        });
        let element = popup.getElement();
        $(element).popover('destroy');
        if (features.length > 0) {
          popup.setPosition(evt.coordinate);
          $(element).popover({
            placement: 'top',
            animation: false,
            html: true,
            content: features
              .map((t) => {
                return (
                  '<p>' +
                  t.tournament.name +
                  ' <small>' +
                  moment(t.tournament.date).format('DD.MM.YYYY') +
                  '</small></p>'
                );
              })
              .join(''),
          });
          $(element).popover('show');
        }
      });
    }
    template.autorun(() => {
      console.log('map change:', Template.currentData().geocoords, Template.currentData().zoom);
      if (Template.currentData().geocoords) {
        template.map.getView().animate({
          center: transform([parseFloat(coords[0]), parseFloat(coords[1])], 'EPSG:4326', 'EPSG:3857'),
          duration: 1000,
        });
      }
      if (Template.currentData().marker && template.map.marker) {
        markerCoords = Template.currentData().marker.split(',');
        markerCoords = transform([parseFloat(markerCoords[0]), parseFloat(markerCoords[1])], 'EPSG:4326', 'EPSG:3857');
        template.map.marker.setGeometry(new Point(markerCoords));
      }
      if (Template.currentData().zoom) {
        template.map.getView().animate({ zoom: Template.currentData().zoom, duration: 1000 });
      }
      template.map.updateSize();
    });
  };
  setupMap();
  Meteor.setTimeout(() => {
    template.map.updateSize();
    console.log('Updated size:', template.$('.map').width(), template.$('.map').height());
  }, 1000);
});
Template.ultisiteMap.helpers({
  showMapCapture() {
    return typeof this.mapCapture === 'function';
  },
});
Template.ultisiteMap.events({
  'click .action-capture': function (e, t) {
    t.map.once('rendercomplete', function (event) {
      const mapCanvas = document.createElement('canvas');
      const size = t.map.getSize();
      mapCanvas.width = size[0];
      mapCanvas.height = size[1];
      const mapContext = mapCanvas.getContext('2d');
      Array.prototype.forEach.call(
        t.map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer'),
        function (canvas) {
          if (canvas.width > 0) {
            const opacity = canvas.parentNode.style.opacity || canvas.style.opacity;
            mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
            let matrix;
            const transform = canvas.style.transform;
            if (transform) {
              // Get the transform parameters from the style's transform matrix
              matrix = transform
                .match(/^matrix\(([^\(]*)\)$/)[1]
                .split(',')
                .map(Number);
            } else {
              matrix = [
                parseFloat(canvas.style.width) / canvas.width,
                0,
                0,
                parseFloat(canvas.style.height) / canvas.height,
                0,
                0,
              ];
            }
            // Apply the transform to the export map context
            CanvasRenderingContext2D.prototype.setTransform.apply(mapContext, matrix);
            const backgroundColor = canvas.parentNode.style.backgroundColor;
            if (backgroundColor) {
              mapContext.fillStyle = backgroundColor;
              mapContext.fillRect(0, 0, canvas.width, canvas.height);
            }
            mapContext.drawImage(canvas, 0, 0);
          }
        }
      );
      mapContext.globalAlpha = 1;
      mapContext.setTransform(1, 0, 0, 1, 0, 0);
      t.data.mapCapture(mapCanvas, t.map);
    });
    t.map.renderSync();
  },
});

var createIcon = function (geometry) {
  let iconFeature = new Feature({
    geometry,
    name: 'Location',
  });

  let iconStyle = new Style({
    image: new Icon(
      /** @type {olx.style.IconOptions} */ ({
        anchor: [9, 27],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        opacity: 1.0,
        src: '/icons/map-location.png',
      })
    ),
  });

  iconFeature.setStyle(iconStyle);
  return iconFeature;
};
