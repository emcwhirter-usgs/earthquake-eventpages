'use strict';

var EventModulePage = require('./EventModulePage');


/**
 * SummaryDetailsPage should be extended to create a summary/details
 * page. While extending SummaryDetailsPage a page should override:
 *
 * Details Page,
 *
 * The details section displays detailed information for a single product.
 *
 *  - getDetailsContent(),
 *
 *    Override this method to build markup for the details page and
 *    append the HTML element to this._content.
 *
 *
 * Summary Page,
 *
 * The summary section displays all products returned by getProducts().
 * getSummaryContent() builds the summary page and calls the following
 * methods to build each individual "summary card" on the summary page.
 *
 *  - getSummaryHeader(),
 *
 *    Override this method to return the header content for
 *    the "summary card".
 *
 *  - getSummaryInfo(),
 *
 *    Override this method to return the descriptive content
 *    for the "summary card".
 *
 */

var SummaryDetailsPage = function (options) {
  this._options = options || {};
  this._code = this._options.code || null;
  if (! ('markPreferred' in this._options)) {
    // default is true.
    this._options.markPreferred = true;
  }
  EventModulePage.call(this, this._options);
};

// extend EventModulePage
SummaryDetailsPage.prototype = Object.create(EventModulePage.prototype);

/**
 * Determine whether to load the summary or details
 * page, and fetch the products for the page.
 */
SummaryDetailsPage.prototype._setContentMarkup = function () {
  var products = this._products = this.getProducts();

  if (products.length === 1) {
    // If there is only one product display details
    this._content.appendChild(this.getDetailsContent(products[0]));
  } else {
    // there is more than one product display summary
    this._content.appendChild(this.getSummaryContent(products));
  }
};

/**
 * Only show downloads on details page.
 */
SummaryDetailsPage.prototype.setDownloadMarkup = function () {
  if (this._products.length === 1) {
    EventModulePage.prototype.setDownloadMarkup.apply(this);
  }
};

/**
 * Find the products to display on this page.
 *
 * @return {Array<Object>} allProducts,
 *         all products that match options.productTypes.
 *
 */
SummaryDetailsPage.prototype.getProducts = function () {
  var products = EventModulePage.prototype.getProducts.call(this),
      i, len,
      product,
      code = this._code;

  if (!code) {
    code = this._getHash();
  }

  if (code) {
    //look for specific product with this code
    len = products.length;
    for (i = 0; i < len; i++) {
      product = products[i];
      if (code === product.source + '_' + product.code) {
        return [product];
      }
    }
  }

  //didn't find specific product
  return products;
};


/**
 * Called when a details page is loaded, this method builds the
 * markup for the detail section.
 *
 * @param  {Object} product, the product to display.
 */
SummaryDetailsPage.prototype.getDetailsContent = function (product) {
  var p = document.createElement('p');

  p.innerHTML = 'Product Details for: ' + product.code;
  this._content.appendChild(p);
};

/**
 * Called when a summary page is loaded, this method builds the
 * markup for the summary sections. It loops over products and
 * builds a summary card for each product.
 *
 * @param  {Array<Object>} products, an array of products to be summarized/
 */
SummaryDetailsPage.prototype.getSummaryContent = function (products) {
  var product,
      summary,
      fragment = document.createDocumentFragment();

  for (var i = 0; i < products.length; i++) {
    product = products[i];
    summary = this.buildSummaryMarkup(product);
    if (i === 0 && this._options.markPreferred) {
      summary.classList.add('preferred');
    }
    fragment.appendChild(summary);
  }
  return fragment;
};

/**
 * Called by getSummaryContent, this method builds the summary
 * list markup and requests data for it's two sections.
 *
 * @param  {Object} product, product being summarized
 * @return {Object},
 *         A single products summarization, in HTML.
 */
SummaryDetailsPage.prototype.buildSummaryMarkup = function (product) {
  var el,
      summaryMarkup;

  el = document.createElement('a');
  el.className = this._options.hash + '-summary summary horizontal-scrolling';
  el.setAttribute('href', this._buildHash(product));

  summaryMarkup = this._getSummaryMarkup(product);
  // Add description content
  if (typeof summaryMarkup === 'object') {
    el.appendChild(summaryMarkup);
  } else {
    el.innerHTML = summaryMarkup;
  }

  return el;
};

/**
 * The content that goes into the summary section
 */
SummaryDetailsPage.prototype._getSummaryMarkup = function (product) {

  return '<p>Summary Section:</p>' +
      '<ul>' +
        '<li>' +
          '<span>' + product.source + '</span>' +
          '<abbr title="Source">src</abbr>' +
        '</li>' +
      '/<ul>'
    ;
};

/**
 * Parse the hash and build the eventCode
 *
 * @return {String}
 *         eventCode that is used to identify the correct
 *         product details to load.
 */
SummaryDetailsPage.prototype._getHash = function () {
  var hash = window.location.hash,
      moduleHash = this._options.module._hash,
      pageHash = this._options.hash,
      currentPage = '#' + moduleHash + '_' + pageHash;

  if (hash === currentPage) {
    return;
  }

  return hash.replace('#' + moduleHash + '_' + pageHash + ':', '');
};

/**
 * Build a hash that will be used as the hash value that
 * links the summary to its details section
 *
 * @param  {string} hash
 */
SummaryDetailsPage.prototype._buildHash = function (product) {
  return '#' + this._options.module._hash + '_' + this._hash + ':'+
      product.source + '_' + product.code;
};


  // clean-up resources.
SummaryDetailsPage.prototype.destroy = function () {
  this._content = null;
  this._products = null;
  this._options = null;

  EventModulePage.prototype.destroy.call(this);
};


module.exports = SummaryDetailsPage;
