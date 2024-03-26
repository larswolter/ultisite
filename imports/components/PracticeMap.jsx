import React, { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import { useGeographic } from 'ol/proj';
import 'ol/ol.css';

// eslint-disable-next-line react-hooks/rules-of-hooks
useGeographic();

window.history.replaceState({}, 'Wetter', window.location.toString().split('?')[0]);

const PracticeMap = ({ location: { geocoords } }) => {
  const [map, setMap] = useState();
  const mapRef = useRef();
  const coordinates = geocoords.split(',').map((c) => Number(c));

  useEffect(() => {
    setMap(
      new Map({
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
        ],
        view: new View({ center: coordinates, zoom: 16 }),
      })
    );
  }, []);
  useEffect(() => {
    if (map && mapRef.current) {
      map.setTarget(mapRef.current);
      map.getView().setCenter(coordinates);
      return () => {
        map.setTarget(null);
      };
    }
  }, [coordinates, map, mapRef]);
  return <div style={{ width: '100%', height: 200 }} ref={mapRef}></div>;
};

export default PracticeMap;
