import jQuery from 'jquery';

UltiSite.createMap = function (targetElement, params) {

};


Template.ultisiteMap.onCreated(function () {
  console.log('ultisiteMap:', this.data);
});

Template.ultisiteMap.onRendered(function () {
  let template = this;
  let setupMap = function () {
      let coords = [10, 52];
      let markerCoords = [0, 0];
      if (template.data.marker)
          {markerCoords = template.data.marker.split(',');}
      if (template.data.geocoords)
          {coords = template.data.geocoords.split(",");}

      template.map = new ol.Map({
          target: template.$('.map')[0],
          numZoomLevels: 20,
          layers: [
              new ol.layer.Tile({
                  source: new ol.source.OSM({
                      tilePixelRatio: 2,
                    }),
                }),

            ],
          view: new ol.View({
              center: ol.proj.transform([parseFloat(coords[0]), parseFloat(coords[1])], 'EPSG:4326', 'EPSG:3857'),
              zoom: template.data.zoom || 6,
            }),
        });

      if (template.data.marker || template.data.mapClick) {
          markerCoords = ol.proj.transform([parseFloat(markerCoords[0]), parseFloat(markerCoords[1])], 'EPSG:4326', 'EPSG:3857');
          template.map.marker = createIcon(new ol.geom.Point(markerCoords));
          template.map.addLayer(new ol.layer.Vector({
              source: new ol.source.Vector({
                  features: [template.map.marker],
                }),
            }));
          if (template.data.mapClick) {
              template.map.on('click', (evt) => {
                  template.map.marker.setGeometry(new ol.geom.Point(evt.coordinate));

                  template.data.mapClick(ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326').join(','), template.map);
                });
            }
        }
      if (template.data.getElementsMethod) {
          Meteor.call(template.data.getElementsMethod, function (err, res) {
              if (!err)
                  {template.map.addLayer(new ol.layer.Vector({
                        style: new ol.style.Style({
                            image: new ol.style.Icon( /** @type {olx.style.IconOptions} */({
                                anchor: [9, 27],
                                anchorXUnits: 'pixels',
                                anchorYUnits: 'pixels',
                                opacity: 1.0,
                                src: '/icons/map-location.png'
                            }))
                        }),
                        source: new ol.source.Vector({
                            features: res.map((e) => {
                                let coords = e.address.geocoords.split(',');
                                let point = new ol.geom.Point(ol.proj.transform([parseFloat(coords[0]), parseFloat(coords[1])], 'EPSG:4326', 'EPSG:3857'));
                                let feat = new ol.Feature(point);
                                feat.tournament = e;
                                return feat;
                            })
                        })
                    }));}
              else
                    {console.error('Could not retrieve tournament coordinates');}
            });
          let popup = new ol.Overlay({
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
                      'placement': 'top',
                      'animation': false,
                      'html': true,
                      'content': features.map((t) => {
                          return '<p>' + t.tournament.name + ' <small>' + moment(t.tournament.date).format('DD.MM.YYYY') + '</small></p>';
                        }).join(''),
                    });
                  $(element).popover('show');
                }
            });
        }
      template.autorun(() => {
          console.log('map change:', Template.currentData().geocoords, Template.currentData().zoom);
          if (Template.currentData().geocoords) {
              let pan = ol.animation.pan({
                  duration: 1000,
                  source: /** @type {ol.Coordinate} */ (template.map.getView().getCenter()),
                });
              template.map.beforeRender(pan);
              const coords = Template.currentData().geocoords.split(',');
              template.map.getView().setCenter(ol.proj.transform([parseFloat(coords[0]), parseFloat(coords[1])], 'EPSG:4326', 'EPSG:3857'));
            }
          if (Template.currentData().marker && template.map.marker) {
              markerCoords = Template.currentData().marker.split(',');
              markerCoords = ol.proj.transform([parseFloat(markerCoords[0]), parseFloat(markerCoords[1])], 'EPSG:4326', 'EPSG:3857');
              template.map.marker.setGeometry(new ol.geom.Point(markerCoords));
            }
          if (Template.currentData().zoom) {
              let zoom = ol.animation.zoom({
                  duration: 1000,
                  resolution: /** @type {ol.Coordinate} */ (template.map.getView().getResolution()),
                });
              template.map.beforeRender(zoom);
              template.map.getView().setZoom(Template.currentData().zoom);
            }
          template.map.updateSize();
        });
    };
  if (typeof ol === 'undefined') {
      jQuery.getScript('/libs/ol.js', setupMap);
      $('<link>', { rel: 'stylesheet', type: 'text/css', 'href': '/libs/ol.css' }).appendTo('head');
    } else
        {setupMap();}
  Meteor.setTimeout(() => {
      template.map.updateSize();
      console.log('Updated size:', template.$('.map').width(), template.$('.map').height());
    }, 1000);
});
Template.ultisiteMap.helpers({
  showMapCapture () {
        return typeof this.mapCapture === 'function';
    },
});
Template.ultisiteMap.events({
  'click .action-capture': function (e, t) {
      t.map.once('postcompose', function (event) {
          t.data.mapCapture(event.context.canvas, t.map);
        });
      t.map.renderSync();
    },
});

var createIcon = function (geometry) {
  let iconFeature = new ol.Feature({
      geometry,
      name: 'Location',
    });

  let iconStyle = new ol.style.Style({
      image: new ol.style.Icon(/** @type {olx.style.IconOptions} */({
          anchor: [9, 27],
          anchorXUnits: 'pixels',
          anchorYUnits: 'pixels',
          opacity: 1.0,
          src: '/icons/map-location.png',
        })),
    });

  iconFeature.setStyle(iconStyle);
  return iconFeature;
};
