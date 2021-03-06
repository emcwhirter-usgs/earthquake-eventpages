/* global chai, sinon, describe, it, beforeEach, afterEach */
'use strict';

var expect = chai.expect,
    DYFIFormPage = require('impact/DYFIFormPage'),
    ImpactModule = require('impact/ImpactModule'),

    nc72119970 = require('./nc72119970'),
    Usb000ldeh = require('./usb000ldeh');


describe('DYFIFormPage test suite.', function () {
  describe('Constructor', function () {
    it('Can be defined', function () {
      /* jshint -W030 */
      expect(DYFIFormPage).not.to.be.undefined;
      /* jshint +W030 */
    });

    it('Can be instantiated', function () {
      var c = new DYFIFormPage();
      expect(c).to.be.an.instanceof(DYFIFormPage);
    });
  });

  describe('_setContentMarkup', function () {
    it('has such a method', function() {
      expect((new DYFIFormPage())).to.respondTo('_setContentMarkup');
    });
  });

  // testing inheritance from EventModulePage
  describe('_initialize', function () {
    it('has such a method', function() {
      expect((new DYFIFormPage())).to.respondTo('_initialize');
    });
  });

  // just testing inheritance from EventModule
  describe('destroy', function () {
    it('has such a method', function () {
      expect((new DYFIFormPage())).to.respondTo('destroy');
    });
  });

  describe('_updateSubmitEnabled', function () {
    var form,
        getAnswers = function () { return {'value': true};};

    function isDisabled () {
      var button = form._dialog.el.querySelector('.dyfi-button-submit');
      return button.hasAttribute('disabled');
    }

    it('submit button is properly enabled/disabled for unknown events', function (done) {
      form = new DYFIFormPage();
      form._fetchDialog(function () {

        // Initially disabled
        /* jshint -W030 */
        expect(isDisabled()).to.be.true;
        /* jshint +W030 */

        // Stub the questions so it appears the requisite information has
        // been input by the user
        sinon.stub(form._questions.ciim_mapLat, 'getAnswers', getAnswers);
        sinon.stub(form._questions.ciim_mapLon, 'getAnswers', getAnswers);
        sinon.stub(form._questions.fldSituation_felt, 'getAnswers',
            getAnswers);
        // Still disabled
        /* jshint -W030 */
        expect(isDisabled()).to.be.true;
        /* jshint +W030 */
        sinon.stub(form._questions.ciim_time, 'getAnswers', getAnswers);

        form._updateSubmitEnabled();

        /* jshint -W030 */
        expect(isDisabled()).to.be.false;
        /* jshint +W030 */

        done();
      });
    });

    it('submit button is properly enabled/disabled for regular events', function (done) {
      form = new DYFIFormPage({eventDetails: {}});
      form._fetchDialog(function () {
        // Initially disabled
        /* jshint -W030 */
        expect(isDisabled()).to.be.true;
        /* jshint +W030 */

        // Stub the questions so it appears the requisite information has
        // been input by the user
        sinon.stub(form._questions.ciim_mapLat, 'getAnswers', getAnswers);
        sinon.stub(form._questions.ciim_mapLon, 'getAnswers', getAnswers);
        sinon.stub(form._questions.fldSituation_felt, 'getAnswers',
            getAnswers);

        form._updateSubmitEnabled();

        /* jshint -W030 */
        expect(isDisabled()).to.be.false;
        /* jshint +W030 */

        done();
      });
    });
  });

  describe('Event Bindings...', function () {
    var form = null,
        spy = null;

    beforeEach(function (done) {
      form = new DYFIFormPage();
      spy = sinon.spy(form, '_updateSubmitEnabled');
      form._fetchDialog(done);
    });

    afterEach(function () {
      spy.restore();
      form.destroy();
    });

    // button clicks trigger locationView.show
    it('listens for clicks on show location button', function () {
      var clickEvent = document.createEvent('MouseEvents');
      clickEvent.initMouseEvent('click', true, true, window, 1, 0, 0);

      var button = form._dialog.el.querySelector(
          '.dyfi-required-questions button');
      button.dispatchEvent(clickEvent);

      expect(spy.callCount).to.equal(1);
    });

    // lat/lon changes trigger form._updateSubmitEnabled
    it('listens for lat/lon changes', function () {
      var questions = form._questions;


      questions.ciim_mapLat.trigger('change');
      // _updateSubmitEnabled is called once during _fetchDialog method so
      // start at 2
      expect(spy.callCount).to.equal(2);

      questions.ciim_mapLon.trigger('change');
      expect(spy.callCount).to.equal(3);
    });

    // felt yes/no changes trigger form._updateSubmitEnabled
    it('listens for yes/no (felt) changes', function () {
      var questions = form._questions;

      questions.fldSituation_felt.trigger('change');
      // _updateSubmitEnabled is called once during _fetchDialog method so
      // start at 2
      expect(spy.callCount).to.equal(2);
    });
  });

  describe('onSubmit', function (){
    var event = Usb000ldeh;
    var curmodule = null;
    var module_info;
    var page;
    var eventData;
    var hidden_form;

    it('has such a method', function() {
        expect((new DYFIFormPage())).to.respondTo('_onSubmit');
    });
    curmodule = new ImpactModule({eventDetails: nc72119970});
    module_info = {hash:'tellus', title:'Tell Us!',
        eventDetails:event, module:curmodule};

    page = new DYFIFormPage(module_info);
    //form._fetchDialog(done);
    page._showForm();
    eventData = page._collectAnswers();

    it('always has default answers', function() {
      /* jshint -W030 */
      expect(eventData.code).to.exist;
      expect(eventData.network).to.exist;
      expect(eventData.dyficode).to.exist;
      expect(eventData.ciim_time).to.exist;
      expect(eventData.ciim_zip).to.exist;
      expect(eventData.ciim_city).to.exist;
      expect(eventData.ciim_region).to.exist;
      expect(eventData.ciim_country).to.exist;
      /* jshint +W030 */
    });
    hidden_form = page._createHiddenDYFIForm(eventData);
    it('creates a hidden form', function () {
      /* jshint -W030 */
      expect(hidden_form).to.not.be.undefined;
      /* jshint +W030 */
    });
    it('has a form with a dyfiIframe target', function () {
      /* jshint -W030 */
      expect(hidden_form.target).to.equal('dyfiIframe');
      /* jshint +W030 */
    });

    page.destroy();
  });

});
