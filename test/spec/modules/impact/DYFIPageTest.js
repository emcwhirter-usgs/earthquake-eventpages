/* global chai, sinon, describe, it, beforeEach, afterEach */
'use strict';

var expect = chai.expect,
    DYFIPage = require('impact/DYFIPage'),
    ImpactModule = require('impact/ImpactModule'),
    Xhr = require('util/Xhr'),

    cdi_zip = require('./cdi_zip'),
    nc72119970 = require('./nc72119970'),
    Usb000ldeh = require('./usb000ldeh');


var eventDetails = Usb000ldeh;
var impactModule = new ImpactModule({eventDetails: eventDetails});
var module_info = {hash:'maps', title:'Maps',
    eventDetails:eventDetails, module:impactModule};

var _fireClickEvent = function (target) {
  var clickEvent = document.createEvent('MouseEvents');
  clickEvent.initMouseEvent('click', true, true, window, 1, 0, 0);
  target.dispatchEvent(clickEvent);
};


describe('DYFIPage test suite.', function () {
  describe('Constructor', function () {
    it('Can be defined.', function () {
      /* jshint -W030 */
      expect(DYFIPage).not.to.be.undefined;
      /* jshint +W030 */
    });

    it('Can be instantiated', function () {

      var c = new DYFIPage(module_info);
      expect(c).to.be.an.instanceof(DYFIPage);
    });
  });

  describe('_setContentMarkup', function () {
    it('has such a method', function() {
      /* jshint -W030 */
      expect((new DYFIPage(module_info))._setContentMarkup).
          to.not.be.undefined;
      /* jshint +W030 */
    });
  });

  // testing inheritance from EventModulePage
  describe('_initialize', function () {
    it('has such a method', function() {
      /* jshint -W030 */
      expect((new DYFIPage(module_info))._initialize).to.not.be.undefined;
      /* jshint +W030 */
    });
  });

  // just testing inheritance from EventModule.js
  describe('destroy()', function () {
    it('has such a method', function () {
      /* jshint -W030 */
      expect((new DYFIPage(module_info)).destroy).to.not.be.undefined;
      /* jshint +W030 */
    });
  });


  describe('getContent', function () {

    var expect = chai.expect,
        stub, content, tbody, rows, hiddenRows, page,
        impactModule = new ImpactModule({eventDetails: nc72119970}),
        module_info = {hash:'dyfi', title:'Did You Feel It?',
            eventDetails:eventDetails, module:impactModule};

    beforeEach(function () {
      stub = sinon.stub(Xhr, 'ajax', function (options) {
        var xmlDoc;
        if (window.DOMParser) {
          var parser = new DOMParser();
          xmlDoc = parser.parseFromString(cdi_zip.xml,'text/xml');
        }
        options.success(xmlDoc, {responseXML: xmlDoc});
        // content = DYFIPage.prototype._buildResponsesTable(
        //    DYFIPage.prototype._buildResponsesArray(xmlDoc));
      });

      page = new DYFIPage(module_info);
      page._setContentMarkup();

      // Select responses tab
      _fireClickEvent(page._content.querySelector('nav :last-child'));

      content = page._content;
      tbody = content.querySelector('tbody');
      rows  = tbody.querySelectorAll('tr');
    });

    afterEach(function() {
      stub.restore();
    });

    it('can get content.', function () {
      // should equal 104
      expect(rows.length).not.to.equal(0);
    });

    it('has all 104 locations from event "nc72119970" in the DOM',
        function () {
      expect(rows.length).to.equal(104);
    });

    // TODO :: Re-enabled once CORS is configured
    it.skip('shows all 104 locations after the button click', function () {

      var button = content.querySelector('#showResponses');
      _fireClickEvent(button);

      rows  = tbody.querySelectorAll('tr');
      hiddenRows = tbody.querySelectorAll('.hidden');

      expect(rows.length - hiddenRows.length).to.equal(104);
    });

  });

  describe('CreeateTabListData()', function () {
    var options = {
      eventId: 'usb000ldeh',
      contents: Usb000ldeh.properties.products.dyfi[0].contents,
      dataObject: [
        {
          title:'Intensity Map',
          suffix:'_ciim.jpg',
          usemap:'imap_base',
          mapSuffix:'_ciim_imap.html'
        },
        {
          title:'Geocoded Map',
          suffix:'_ciim_geo.jpg',
          usemap:'imap_geo',
          mapSuffix:'_ciim_geo_imap.html'
        },
        {
          title:'Zoom Map',
          suffix:'_ciim_zoom.jpg',
          usemap:'imap_zoom',
          mapSuffix:'_ciim_zoom_imap.html'
        },
        {
          title:'Intensity Vs. Distance',
          suffix:'_plot_atten.jpg'
        },
        {
          title:'Responses Vs. Time',
          suffix:'_plot_numresp.jpg'
        }
      ]
    };

    it('has the correct number of tabs', function () {
      var tablist = new DYFIPage(module_info)._createTabListData(options);

      expect(tablist.length).to.equal(options.dataObject.length);
    });

    it('Each tablist entry is an instance of a tab', function () {
      var tabList = new DYFIPage(module_info)._createTabListData(options),
          i,
          len,
          tab;

      for (i = 0, len = tabList.length; i < len; i++) {
        tab = tabList[i];
        /* jshint -W030 */
        expect(tab.hasOwnProperty('title')).to.be.true;
        expect(tab.hasOwnProperty('content')).to.be.true;
        /* jshint +W030 */
      }
    });

  });
});
