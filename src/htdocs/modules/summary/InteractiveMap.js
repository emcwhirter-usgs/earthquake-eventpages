'use strict';

var EventModulePage = require('base/EventModulePage'),
    L = require('leaflet'),
    Util = require('util/Util'),

    MousePosition = require('map/MousePosition'),
    MouseOverLayer = require('map/MouseOverLayer'),
    ContoursLayer = require('./ContoursLayer'),
    ShakeMapStationLayer = require('./ShakeMapStationLayer'),
    DYFIUTMLayer = require('./DYFIUTMLayer');


var DEFAULTS = {
};

var InteractiveMap = function (options) {
  options = Util.extend({}, DEFAULTS, options || {});
  this._map = {};
  this._wrapper = document.createElement('div');
  this._closeButton = document.createElement('button');
  this._eventConfig = options.eventConfig;
  EventModulePage.call(this, options);
};

InteractiveMap.prototype = Object.create(EventModulePage.prototype);

InteractiveMap.prototype._initialize = function () {
  EventModulePage.prototype._initialize.apply(this);
  if (this._eventPage) {
    this._eventPage.on('render', this._onAfterRender, this);
  }
};

InteractiveMap.prototype.destroy = function () {
  if (this._eventPage) {
    this._eventPage.off('render', this._onAfterRender, this);
  }
  this._closeButton.removeEventListener('click', this._onClick);

};

InteractiveMap.prototype.onAdd = function () {
  window.addEventListener('keyup', this._onKeyUp);
  if (this._eventConfig.fromShakemap) {
    this._stationLayer.addTo(this._map);
    this._eventConfig.fromShakemap = false;
  }

  if (this._eventConfig.fromDYFI) {
    if (this._dyfiLayer10km) {
      this._dyfiLayer10km.addTo(this._map);
    }
    else if (this._dyfiLayer1km) {
      this._dyfiLayer1km.addTo(this._map);
    }
    else {
      this._dyfiLayer.addTo(this._map);
    }
    this._eventConfig.fromDYFI = false;
  }
};

InteractiveMap.prototype.onRemove = function () {
  window.removeEventListener('keyup', this._onKeyUp);
};

InteractiveMap.prototype._setContentMarkup = function () {
  var latmax, latmin, lngmax, lngmin,
      _el = document.createElement('div');

  var layerControl = null,
      terrainLayer = null,
      grayscaleLayer = null,
      streetLayer = null,
      satelliteLayer = null,
      platesLayer = null,
      faultsLayer = null,
      latitude = null,
      longitude = null,
      epicenterMarker,
      map;

  this._content.classList.add('summary-interactive-map-wrapper');
  _el.classList.add('summary-interactive-map');
  this._closeButton.innerHTML = 'Close Map';
  this._closeButton.className = 'summary-interactive-map-close cancel';
  _el.innerHTML = '';

  // This css is added in JS because css files are loading asynchronous
  // and these rules must be applied before the map is initialized other wise
  // the map is not properly displayed.
  this._content.setAttribute('style', 'position:fixed;top:0;right:0;bottom:0;left:0;');
  _el.setAttribute('style', 'height:100%;');

  this._closeButton.setAttribute('title', 'Close');
  this._onClick = this._onClick.bind(this);
  this._onKeyUp = this._onKeyUp.bind(this);

  this._closeButton.addEventListener('click', this._onClick);

  this._map = map = new L.Map(_el, {
    center: [0.0, 0.0],
    zoom: 2,
    zoomAnimation: true,
    attributionControl: false
  });

  layerControl = new L.Control.Layers();

  // Terrain layer
  terrainLayer = new L.TileLayer(
      'http://{s}.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}.jpg',
      {'subdomains': ['server', 'services']});
  map.addLayer(terrainLayer);
  layerControl.addBaseLayer(terrainLayer, 'Terrain');

  // Grayscale layer
  grayscaleLayer = new L.TileLayer(
      'http://{s}.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}.jpg',
      {'subdomains': ['server', 'services']});
  layerControl.addBaseLayer(grayscaleLayer, 'Grayscale');

  // Street Layer
  streetLayer = new L.TileLayer(
      'http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg',
      {'subdomains': '1234'});
  layerControl.addBaseLayer(streetLayer, 'Street');

  //Satellite Layer
  satelliteLayer = new L.TileLayer(
      'http://otile{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg',
      {'subdomains': '1234'});
  layerControl.addBaseLayer(satelliteLayer, 'Satellite');

  // Plates
  platesLayer = new L.TileLayer(
      'http://earthquake.usgs.gov/basemap/tiles/plates/{z}/{x}/{y}.png');
  map.addLayer(platesLayer);
  layerControl.addOverlay(platesLayer, 'Tectonic Plates');

  if (this._event) {
    // Do some event-specific stuff if the event is defined
    latitude = this._event.geometry.coordinates[1];
    longitude = this._event.geometry.coordinates[0];

    // Show a 2deg map centered on earthquake epicenter)
    latmin = Math.max(latitude - 2.0, -90.0);
    latmax = Math.min(latitude + 2.0, 90.0);

    lngmin = longitude - 2.0;
    lngmax = longitude + 2.0;

    this._defaultBounds = [[latmax, lngmin], [latmin, lngmax]];

    if (latitude >= 24.6 && latitude <= 50.0 && longitude >= -125.0 && longitude <= -65.0) {
      // Add faults layer, this is a US event
      faultsLayer = new MouseOverLayer({
        tileUrl: 'http://earthquake.usgs.gov/basemap/tiles/faults/{z}/{x}/{y}.png',
        dataUrl: 'http://earthquake.usgs.gov/basemap/tiles/faults/{z}/{x}/{y}.grid.json?callback={cb}',
        tiptext: '{NAME}'
      });
      map.addLayer(faultsLayer);
      layerControl.addOverlay(faultsLayer, 'U.S. Faults');
    }
    // Place a marker at the earthquake location
    epicenterMarker = new L.Marker([latitude, longitude], {
      zIndexOffset: 99999,
      icon: new L.Icon({
        iconUrl: 'images/star.png',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    });
    epicenterMarker.bindPopup([
      'Epicenter',
      ' ',
      'M',
      this._event.properties.mag
    ].join(''));
    map.addLayer(epicenterMarker);

    if (this._event.properties.products.dyfi) {
      var dyfi = this._event.properties.products.dyfi[0],
          dyfiContents = dyfi.contents;

      if ('dyfi_geo_10km.geojson' in dyfiContents) {
        this._dyfiLayer10km = new DYFIUTMLayer({
          url: dyfiContents['dyfi_geo_10km.geojson'].url
        });
        layerControl.addOverlay(this._dyfiLayer10km, 'DYFI Responses 10km');
      }
      if ('dyfi_geo_1km.geojson' in dyfiContents) {
        this._dyfiLayer1km = new DYFIUTMLayer({
          url: dyfiContents['dyfi_geo_1km.geojson'].url
        });
        layerControl.addOverlay(this._dyfiLayer1km, 'DYFI Responses 1km');
      }
      if (typeof this._dyfiLayer10km === 'undefined' &&
            typeof this._dyfiLayer1km === 'undefined' &&
            'dyfi_geo.geojson' in dyfiContents) {
        this._dyfiLayer = new DYFIUTMLayer({
          url: dyfiContents['dyfi_geo.geojson'].url
        });
        layerControl.addOverlay(this._dyfiLayer, 'DYFI Responses');
      }
    }

    // Adds shake map contours data to map
    if (this._event.properties.products.shakemap) {
      var contourLayer = null,
          shakemap = this._event.properties.products.shakemap[0],
          shakemapContents = shakemap.contents;

      if ('download/cont_mi.json' in shakemapContents) {
        this._contourLayer = contourLayer = new ContoursLayer({
          url: shakemapContents['download/cont_mi.json'].url
        });
        layerControl.addOverlay(contourLayer, 'ShakeMap MMI Contours');
        contourLayer.addTo(map);
      }

      if ('download/stationlist.json' in shakemapContents) {
        this._stationLayer = new ShakeMapStationLayer(
            shakemapContents['download/stationlist.json'].url);
        layerControl.addOverlay(this._stationLayer, 'ShakeMap Stations');
      }
    }
  }

  // Add Map Controls
  if (!Util.isMobile()) {
    map.addControl(new MousePosition());
    map.addControl(new L.Control.Scale({'position':'bottomleft'}));
  }
  map.addControl(layerControl);

  this._content.appendChild(_el);
  this._content.appendChild(this._closeButton);
};

InteractiveMap.prototype._onAfterRender = function () {
  if (this._map && this._map.getContainer() &&
      this._map.getContainer().parentNode) {
    this._map.invalidateSize();
    if (this._defaultBounds) {
      this._map.fitBounds(this._defaultBounds);
    }
  }
};

InteractiveMap.prototype._onClick = function () {
  window.history.go(-1);
  // if the interactive map is opened directly there is no 'back'
  setTimeout(function () {
    if (window.location.hash === '#general_map') {
      // still on map, show general summary
      window.location = '#general_summary';
    }
  }, 200);
};

InteractiveMap.prototype._onKeyUp = function (e) {
  if (e.keyCode === 27) {
    this._onClick();
  }
};

module.exports = InteractiveMap;
