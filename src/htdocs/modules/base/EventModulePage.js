'use strict';

var Accordion = require('accordion/Accordion'),
    Attribution = require('./Attribution'),
    ContentsXML = require('./ContentsXML'),
    EventUtil = require('./EventUtil'),
    Formatter = require('./Formatter'),
    Util = require('util/Util');



var DEFAULTS = {
  eventPage: null,
  formatter: new Formatter(),
  module: null,
  eventDetails: null,
  productTypes: null,
  // URL hash fragment identifying this page; unique within the parent module.
  hash: 'page',
  // Title of this specific module page
  title: 'Page'
};

var EventModulePage = function (options) {

  options = Util.extend({}, DEFAULTS, options);

  this._eventPage = options.eventPage;
  this._module = options.module;
  this._hash = options.hash;
  this._title = options.title;
  this._event = options.eventDetails;
  this._formatter = options.formatter;
  this._productTypes = options.productTypes;

  this._initialize();
};

/**
 * Called after page content is added to the event page.
 */
EventModulePage.prototype.onAdd = function () {
};

/**
 * Called before page content is removed from the event page.
 */
EventModulePage.prototype.onRemove = function () {
};

EventModulePage.prototype.destroy = function () {
  // TODO
};

EventModulePage.prototype.getAttribution = function (product) {
  return EventUtil.getAttribution(product || this.getProductToRender());
};

EventModulePage.prototype.getHeader = function () {
  return this._header;
};

EventModulePage.prototype.getContent = function () {
  return this._content;
};

EventModulePage.prototype.getFooter = function () {
  return this._footer;
};

EventModulePage.prototype.getHash = function () {
  return this._hash;
};

EventModulePage.prototype.getTitle = function () {
  return this._title;
};

EventModulePage.prototype._initialize = function () {
  this._header = document.createElement('header');
  this._header.classList.add('event-module-header');
  this._header.classList.add('clearfix');

  this._content = document.createElement('section');
  this._content.classList.add('event-module-content');
  this._content.classList.add('clearfix');

  this._footer = document.createElement('footer');
  this._footer.classList.add('event-module-footer');
  this._footer.classList.add('clearfix');
  this.loadDownloadMarkup = this.loadDownloadMarkup.bind(this);

  this._setHeaderMarkup();
  this._setContentMarkup();
  this._setFooterMarkup();
};

EventModulePage.prototype._setHeaderMarkup = function () {
  if (this._module !== null) {
    this._header.innerHTML = this._module.getHeaderMarkup(this);
  }
};

EventModulePage.prototype._setContentMarkup = function () {
  var product;

  product = this.getProductToRender();

  if (product) {
    this._content.innerHTML = '';
    this._content.appendChild(this.getDetailsContent(product));
  } else {
    this._content.innerHTML = [
      '<p class="alert error">',
        'No data available.',
        '<br/>',
        '<small>Last rendered: ', (new Date()).toUTCString(), '</small>',
      '</p>'
    ].join('');
  }
};

/**
 * @APIMethod
 *
 * Returns the content details for a specific product. Implementing classes
 * should override this method.
 *
 * @param product {Object}
 *      The product for which to render details.
 */
EventModulePage.getDetailsContent = function (product) {
  var div,
      fragment;

  fragment = document.createDocumentFragment();
  div = fragment.appendChild(document.createElement('div'));

  div.innerHTML = [
    product.id,
    '<br/>',
    '<small>',
      'Last rendered: ', (new Date()).toUTCSTring(),
    '</small>'
  ].join('');

  return fragment;
};

/**
 * @APIMethod
 *
 * Finds the product to render or returns null if no product is found. Checks
 * the URL hash for a product source/code and uses that if found, otherwise
 * uses the first product of the supported types.
 */
EventModulePage.prototype.getProductToRender = function () {
  var code,
      codeParts,
      i,
      product,
      products,
      productToRender,
      source;

  productToRender = null;
  products = this.getProducts();
  codeParts = EventUtil.getCodeFromHash();

  if (products.length) {
    if (codeParts) {
      codeParts = codeParts.split('_');
      source = codeParts[0];
      code = codeParts.slice(1).join('_');

      for (i = 0; i < products.length; i++) {
        product = products[i];
        if (product.code === code && product.source === source) {
          productToRender = product;
        }
      }
    } else {
      productToRender = products[0];
    }
  }

  return productToRender;
};

EventModulePage.prototype._setFooterMarkup = function () {
  var footerMarkup ='',
      el;

  if (this._module !== null) {
    footerMarkup = this._module.getFooterMarkup(this);
  }

  this.setDownloadMarkup();

  //This isn't currently used. But it makes sense to leave it.
  if (typeof footerMarkup === 'string') {

    if (footerMarkup !== '') {
      el = document.createElement('div');
      el.innerHTML = footerMarkup;
      footerMarkup = el;
    } else {
      footerMarkup = null;
    }
  }

  if (footerMarkup) {
    this._footer.appendChild(footerMarkup);
  }
};

EventModulePage.prototype.setDownloadMarkup = function () {
  var el,
      product;

  //Get a product to add to the downloads list.
  product = this.getProductToRender();

  //IRIS page, and tests can return no products.
  if (product) {

    el = document.createElement('section');
    new Accordion({
      el: el,
      accordions: [{
        toggleText: 'Downloads',
        toggleElement: 'h3',
        contentText: '<div class="page-downloads"></div>',
        classes: 'accordion-standard accordion-closed accordion-page-downloads'
      }]
    });

    this._footer.appendChild(el);

    el.addEventListener('click', this.loadDownloadMarkup);
    this._downloadsEl = el;
  }
};

EventModulePage.prototype.loadDownloadMarkup = function (e) {
  var product = this.getProductToRender();

  e.preventDefault();
  this._downloadsEl.removeEventListener('click',this.loadDownloadMarkup);

  if (product.phasedata) {
    product = product.phasedata;
  }

  this.getDownloads(product);
};

/**
 * Find the products to display on this page.
 *
 * @return {Array<Object>} allProducts,
 *         all products that match options.productTypes.
 *
 */
EventModulePage.prototype.getProducts = function () {
  var productTypes,
      allProducts;

  productTypes = this._productTypes;
  allProducts = [];

  // loop through different productTypes
  if (productTypes) {
    for (var i = 0; i < productTypes.length; i++) {
      allProducts = allProducts.concat(EventUtil.getProducts(
          this._event, productTypes[i]));
    }
  }

  return allProducts;
};

/**
 * Gets the downloadable products and attachs to the footer.
 */
EventModulePage.prototype.getDownloads = function (product) {
  var el = document.createElement('dl'),
      downloadEl = this._downloadsEl.querySelector('.page-downloads'),
      statusEl = document.createElement('p');

  el.className = 'page-download';
  statusEl.innerHTML = 'Loading contents &hellip;';

  downloadEl.appendChild(statusEl);
  downloadEl.appendChild(el);

  new ContentsXML({
    product: product,
    callback: function (contents) {
    // build content
      var header = '<dt class="product">' +
          '<h4 class="type">' + product.type +
            ' <small>(' + product.code + ')</small>' +
          '</h4>' +
          '<small class="attribution">Contributed by ' +
              Attribution.getContributorReference(product.source) +
          '</small>' +
        '</dt>';
      downloadEl.removeChild(statusEl);
      el.innerHTML = header + contents.getDownloads();
    },
    errback: function (contents,err) {
      if (err.message === 'product has no contents.xml content') {
        downloadEl.removeChild(el);
        downloadEl.removeChild(statusEl);
      } else {
        statusEl.className = 'alert error';
        statusEl.innerHTML = 'Unable to load downloads &hellip;';
      }
    }
  });
};


EventModulePage.prototype.getCatalogSummary = function (product) {
  var props = product.properties || {},
      eventSource = props.eventsource,
      eventSourceCode = props.eventsourcecode,
      eventId = '';

  if (eventSource) {
    eventId = (eventSource + eventSourceCode).toLowerCase();
  }

  return '<span>' +
        (eventSource ? eventSource.toUpperCase() : '&ndash;') +
        '</span>' +
        '<abbr title="' + eventId + '">Catalog</abbr>';
};

EventModulePage.prototype.getCatalogDetail = function (product) {
  var props = product.properties,
      eventSource = props.eventsource,
      eventSourceCode = props.eventsourcecode,
      eventId = '';

  if (!eventSource) {
    return '&ndash';
  }

  eventId = (eventSource + eventSourceCode).toLowerCase();
  return eventSource.toUpperCase() + ' <small>(' + eventId + ')</small>';
};


EventModulePage.prototype.getPreferredSummaryMarkup = function (product, hash, name) {
  var preferredProductMarkup = document.createElement('section');

  this._options.module.getPage(hash, function (page) {
    var products = page.getProducts(),
        preferredLink = document.createElement('a');

    preferredProductMarkup.innerHTML = '<h3>' + name + '</h3>';
    preferredProductMarkup.appendChild(page.buildSummaryMarkup(product));

    // Add link to product-summary page when more than one product exists
    if (products.length > 1) {
      preferredLink.href = '#' + hash;
      preferredLink.className = 'view-all';
      preferredLink.innerHTML = 'View all ' + name + 's (' + products.length +
          ' total)';
      preferredProductMarkup.appendChild(preferredLink);
    }
  });

  this._content.appendChild(preferredProductMarkup);
};


/**
 * Replace relative paths in content.
 *
 * @param html {String}
 *        html markup.
 * @param contents {Object<path => Content>}
 *        contents to replace.
 * @return {String}
 *         markup any quoted paths are replaced with quoted content urls.
 *         "path" => "content.url".
 */
EventModulePage.prototype._replaceRelativePaths = function (html, contents) {
  var content,
      path;

  for (path in contents) {
    if (path !== '') {
      content = contents[path];
      html = html.replace(new RegExp('"' + path + '"', 'g'),
          '"' + content.url + '"');
    }
  }
  return html;
};


module.exports = EventModulePage;
