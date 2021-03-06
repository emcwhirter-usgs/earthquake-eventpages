'use strict';

var Attribution = require('base/Attribution'),
    EventModulePage = require('base/EventModulePage'),
    Util = require('util/Util'),

    BeachBall = require('./tensor/BeachBall'),
    Tensor = require('./tensor/Tensor');

// default options
var DEFAULTS = {
  tabList: {
    tabPosition: 'top'
  }
};

/**
 * Construct a new MomentTensorPage.
 *
 * @param options {Object}
 *        page options.
 */
var MomentTensorPage = function (options) {
  options = Util.extend({}, DEFAULTS, options);

  EventModulePage.call(this, options);
};

// extend EventModulePage.
MomentTensorPage.prototype = Object.create(EventModulePage.prototype);

/**
 * Called by EventModulePage._setContentMarkup(), handles
 * displaying all detailed information for an origin product.
 *
 * @param  {object} product, origin product to display
 *
 */
MomentTensorPage.prototype.getDetailsContent = function (product) {
  var tensor = Tensor.fromProduct(product),
      el = document.createElement('div'),
      author;

  this._product = product;

  author = product.properties['beachball-source'] || product.source;

  // set layout
  el.className = 'tensor-detail';
  el.innerHTML = [
    this._getTitle(tensor),
    '<div class="row clearfix">',
      '<div class="column two-of-five">',
        this._getInfo(tensor),
        this._getPlanes(tensor),
      '</div>',
      '<div class="column three-of-five beachball"></div>',
    '</div>',
    this._getAxes(tensor)
  ].join('');

  // add beachball
  el.querySelector('.beachball').appendChild(
      new BeachBall({
        tensor: tensor,
        size: 320,
        fillColor: tensor.fillColor,
        labelAxes: true,
        labelPlanes: true
      }).getCanvas());

  return el;
};


/**
 * Format tensor information.
 *
 * @param tensor {Tensor}
 *        tensor to format.
 * @return {String} markup for information.
 */
MomentTensorPage.prototype._getInfo = function (tensor) {
  var formatter = this._formatter,
      moment = tensor.moment,
      magnitude = tensor.magnitude,
      percentDC = tensor.percentDC,
      depth = tensor.depth,
      half_duration = tensor.product.properties.duration/2 || '&ndash;';

  moment = (moment / tensor.scale).toFixed(3) +
      'e+' + tensor.exponent + ' ' + tensor.units;
  magnitude = magnitude.toFixed(2);
  percentDC = Math.round(percentDC * 100) + '%';
  depth = formatter.depth(depth, 'km');

  return [
    '<table class="info-table"><tbody>',
    '<tr><th scope="row">Moment</th>',
      '<td>', moment, '</td></tr>',
    '<tr><th scope="row">Magnitude</th>',
      '<td>', magnitude, '</td></tr>',
    '<tr><th scope="row">Depth</th>',
      '<td>', depth, '</td></tr>',
    '<tr><th scope="row">Percent <abbr title="Double Couple">DC</abbr></th>',
      '<td>', percentDC, '</td></tr>',
    '<tr><th scope="row">Half Duration</th>',
      '<td>', half_duration, '</td></tr>',
    '<tr><th scope="row">Catalog</th><td>',
      this.getCatalogDetail(tensor.product), '</td></tr>',
    '<tr><th scope="row">Data Source</th><td>',
      Attribution.getContributorReference(tensor.source), '</td></tr>',
    '<tr><th scope="row">Contributor</th><td>',
      Attribution.getContributorReference(tensor.product.source), '</td></tr>',
    '</tbody></table>'
  ].join('');
};

/**
 * Format tensor title.
 *
 * @param tensor {Tensor}
 *        tensor to format.
 * @return {String} title for tensor detail area.
 */
MomentTensorPage.prototype._getTitle = function (tensor) {
  var type = tensor.type,
      title;

  if (type === 'Mww') {
    title = 'W-phase Moment Tensor (Mww)';
  } else if (type === 'Mwc') {
    title = 'Centroid Moment Tensor (Mwc)';
  } else if (type === 'Mwb') {
    title = 'Body-wave Moment Tensor (Mwb)';
  } else if (type === 'Mwr') {
    title = 'Regional Moment Tensor (Mwr)';
  } else {
    title = type;
  }
  return '<h3>' + title + '</h3>';
};


/**
 * Format tensor principal axes.
 *
 * @param tensor {Tensor}
 *        tensor to format.
 * @return {String} markup for principal axes content.
 */
MomentTensorPage.prototype._getAxes = function (tensor) {
  var scale = tensor.scale,
      T,
      N,
      P;

  function formatAxis (axis) {
    var azimuth = axis.azimuth(),
        plunge = axis.plunge(),
        pi = Math.PI,
        two_pi = 2 * pi,
        r2d = 180 / pi;

    if (plunge < 0) {
      plunge *= -1;
      azimuth += pi;
    }
    if (azimuth < 0) {
      azimuth += two_pi;
    } else if (azimuth > two_pi) {
      azimuth -= two_pi;
    }

    return {
      value: (axis.value / scale).toFixed(3),
      azimuth: Math.round(azimuth * r2d),
      plunge: Math.round(plunge * r2d)
    };
  }

  T = formatAxis(tensor.T);
  N = formatAxis(tensor.N);
  P = formatAxis(tensor.P);

  return '<div class="clearfix">' +
      '<h4>Principal Axes</h4>' +
      '<table class="principal-axes-table">' +
      '<thead><tr>' +
        '<th>Axis</th>' +
        '<th>Value</th>' +
        '<th>Plunge</th>' +
        '<th>Azimuth</th>' +
      '</thead>' +
      '<tbody>' +
        '<tr>' +
          '<th scope="row">T</th>' +
          '<td>' + T.value + '</td>' +
          '<td>' + T.plunge + '&deg;</td>' +
          '<td>' + T.azimuth + '&deg;</td>' +
        '</tr>' +
        '<tr>' +
          '<th scope="row">N</th>' +
          '<td>' + N.value + '</td>' +
          '<td>' + N.plunge + '&deg;</td>' +
          '<td>' + N.azimuth + '&deg;</td>' +
        '</tr>' +
        '<tr>' +
          '<th scope="row">P</th>' +
          '<td>' + P.value + '</td>' +
          '<td>' + P.plunge + '&deg;</td>' +
          '<td>' + P.azimuth + '&deg;</td>' +
        '</tr>' +
      '</tbody>' +
      '</table>' +
      '</div>';
};

/**
 * Format tensor nodal planes.
 *
 * @param tensor {Tensor}
 *        tensor to format.
 * @return {String} markup for nodal planes content.
 */
MomentTensorPage.prototype._getPlanes = function (tensor) {
  var np1 = tensor.NP1,
      np2 = tensor.NP2,
      round = Math.round;

  return [
      '<h4>Nodal Planes</h4>',
      '<table class="nodal-plane-table">',
      '<thead><tr>',
        '<th>Plane</th>',
        '<th>Strike</th>',
        '<th>Dip</th>',
        '<th>Rake</th>',
      '</thead>',
      '<tbody>',
        '<tr>',
        '<th scope="row"><abbr title="Nodal Plane 1">NP1</abbr></th>',
        '<td>', round(np1.strike), '&deg;</td>',
        '<td>', round(np1.dip), '&deg;</td>',
        '<td>', round(np1.rake), '&deg;</td>',
        '</tr>',
        '<tr>',
        '<th scope="row"><abbr title="Nodal Plane 2">NP2</abbr></th>',
        '<td>', round(np2.strike), '&deg;</td>',
        '<td>', round(np2.dip), '&deg;</td>',
        '<td>', round(np2.rake), '&deg;</td>',
        '</tr>',
      '</tbody>',
      '</table>'
  ].join('');
};

MomentTensorPage.prototype.getBeachball = function(tensor) {
  return new BeachBall({
      tensor: tensor,
      size: 200,
      plotAxes: false,
      plotPlanes: true,
      fillColor: tensor.fillColor
    }).getCanvas().toDataURL();
};

MomentTensorPage.prototype.destroy = function () {
  this._options = null;

  EventModulePage.prototype.destroy.call(this);
};


module.exports = MomentTensorPage;
