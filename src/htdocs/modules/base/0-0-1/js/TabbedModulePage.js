/* global define */
define([
	'util/Util',
	'./EventModulePage',
	'./ContentsXML',
	'tablist/TabList'
], function (
	Util,
	EventModulePage,
	ContentsXML,
	TabList
) {
	'use strict';


	/**
	 * Construct a new TabbedModulePage.
	 *
	 * @param options {Object}
	 *        page options.
	 * @param options.productType {String}
	 *        Required.
	 *        used by getProduct().
	 * @param options.onlyPreferred {Boolean}
	 *        Optional, default false.
	 *        used by getProduct().
	 * @param options.onlyPreferredSource {Boolean}
	 *        Optional, default false.
	 *        used by getProduct().
	 * @param options.className {String}
	 *        Optional.
	 *        classes to add to container element.
	 */
	var TabbedModulePage = function (options) {
		this._options = options;
		EventModulePage.call(this, options);
	};

	// extend from EventModulePage
	TabbedModulePage.prototype = Object.create(EventModulePage.prototype);


	/**
	 * Render TabbedModulePage content.
	 *
	 * This implementation calls getProduct() for content to render.
	 *     If array is empty,
	 *         page content is generated by getEmptyContent().
	 *     If array contains one object,
	 *         page content is generated by getDetails(object).
	 *     If array contains more than one object,
	 *         page content is a tablist;
	 *         tab titles are generated by getSummary(object),
	 *         tab contents are generated by getDetails(object).
	 */
	TabbedModulePage.prototype._setContentMarkup = function () {
		var products = this.getProducts(),
		    len = products.length,
		    contentEl,
		    content,
		    tabList,
		    product,
		    i;

		// this may not be needed,
		// keeping this class name from affecting other pages
		//     that may reuse the same content element
		contentEl = this.getContent().appendChild(document.createElement('div'));
		contentEl.className = this._options.className || '';

		if (len === 0) {
			// no products
			content = this.getEmptyContent();
			// one product
		} else if (len === 1) {
			content = this.getDetail(products[0]);
		} else {
			// many products
			content = document.createElement('div');
			tabList = new TabList(Util.extend(
					{},
					this._options.tabList,
					{el: content}));
			for (i = 0; i < len; i++) {
				product = products[i];
				tabList.addTab({
					title: this.getSummary(product),
					content: this.getDetail(product)
				});
			}
		}

		// add content
		if (typeof content === 'string') {
			contentEl.innerHTML = content;
		} else {
			contentEl.appendChild(content);
		}
	};

	/**
	 * Find the products (or other information) to display on this page.
	 *
	 * This implementation uses these configurable options:
	 *     productType {String} find products of this type.
	 *     onlyPreferred {Boolean} only include the most preferred product.
	 *     onlyPreferredSource {Boolean} include all products
	 *         from the most preferred product's source.
	 *
	 * @return {Array<Object>} array of "products" to display on this page.
	 */
	TabbedModulePage.prototype.getProducts = function () {
		var options = this._options,
		    productType = options.productType,
		    onlyPreferred = options.onlyPreferred,
		    onlyPreferredSource = options.onlyPreferredSource,
		    allProducts = this._event.properties.products[productType],
		    products = [],
		    source,
		    product,
		    i,
		    len;
		if (allProducts) {
			if (onlyPreferred) {
				products.push(allProducts[0]);
			} else if (onlyPreferredSource) {
				source = allProducts[0].source;
				for (i = 0, len = allProducts.length; i < len; i++) {
					product = allProducts[i];
					if (product.source === source) {
						products.push(product);
					}
				}
			} else {
				products = allProducts;
			}
		}
		return products;
	};

	/**
	 * Content when there are no products to display.
	 *
	 * @return {String} html markup.
	 */
	TabbedModulePage.prototype.getEmptyContent = function () {
		return 'No ' + this._options.productType + ' products for this event';
	};

	/**
	 * Get tab title for one product.
	 *
	 * @param product {Object}
	 *        product to format.
	 * @return {String|DOMElement} tab title.
	 */
	TabbedModulePage.prototype.getSummary = function (product) {
		return product.source + ' ' + product.code;
	};

	/**
	 * Get tab content for one product.
	 *
	 * @param product {Object}
	 *        object to format.
	 * @return {String|DOMElement} tab content.
	 */
	TabbedModulePage.prototype.getDetail = function (product) {
		var el = document.createElement('div');
		el.innerHTML = 'Loading contentsXML...';
		new ContentsXML({
				product: product,
				callback: function (contents) {
					el.innerHTML = contents.toHtml();
				},
				errback: function () {
					el.innerHTML = 'Error loading contentsXML';
				}});
		return el;
	};


	// return constructor
	return TabbedModulePage;
});
