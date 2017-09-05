import moment from 'moment';
import sinon from 'auto-release-sinon';
import ngMock from 'ng_mock';
import expect from 'expect.js';
import _ from 'lodash';
import noDigestPromises from 'test_utils/no_digest_promises';

import defaultEmailSource from '../../defaults/email_watcher';
import defaultReportSource from '../../defaults/report_watcher';

describe('Watcher', function () {

  let Watcher;
  let $httpBackend;
  let savedWatchers;
  let Promise;

  const init = function () {
    ngMock.module('kibana');

    ngMock.inject((_Watcher_, _savedWatchers_, _$httpBackend_, _Promise_) => {
      Promise = _Promise_;
      Watcher = _Watcher_;
      savedWatchers = _savedWatchers_;
      $httpBackend = _$httpBackend_;
    });
  };

  beforeEach(function () {
    noDigestPromises.activate();
    init();
  });

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('can get an instance of the factory', function () {
    expect(Watcher).to.be.a('function');
  });

  it('make _source flat', function () {
    let watcher = {
      _id: Watcher.createId(),
      _source: _.cloneDeep(defaultEmailSource)
    };

    watcher = Watcher.flatSource(watcher);
    const flattedFields = _.keys(watcher).filter((field) => field !== 'id');

    expect(_.isEqual(flattedFields.sort(), Watcher.fields.sort())).to.be(true);
    expect(watcher._source).to.be(undefined);
    expect(watcher._id).to.be(undefined);
    expect(watcher.id).to.be.a('string');
  });

  it('make _source nested', function () {
    let watcher = _.cloneDeep(defaultEmailSource);
    watcher.id = Watcher.createId();

    watcher = Watcher.nestedSource(watcher);
    const nestedFields = _.keys(watcher._source);

    expect(_.isEqual(nestedFields.sort(), Watcher.fields.sort())).to.be(true);
    expect(watcher._source).to.be.an('object');
    expect(watcher.id).to.be(undefined);
    expect(watcher._id).to.be.a('string');
  });


  describe('Kibi API', function () { // savedObjectsAPI

    const initKibiAPI = function () {
      Watcher.savedObjectsAPIEnabled = true;
    };

    beforeEach(function () {
      initKibiAPI();

      $httpBackend.when('GET', '../api/sentinl/config').respond(200, {
        es: {
          number_of_results: 50
        }
      });
    });

    it('list watchers', function (done) {
      this.timeout(30000);
      sinon.stub(savedWatchers, 'find', () => {
        return Promise.resolve({
          hits: [
            { id: '123' },
            { id: '456' }
          ]
        });
      });

      Watcher.list()
        .then((response) => {
          expect(response.length).to.eql(2);
        })
        .catch(done);

      $httpBackend.flush();
      setTimeout(done, 25000);
    });

    it('get watcher', function (done) {
      const id = '123';

      sinon.stub(savedWatchers, 'get', () => {
        const watcher = _.cloneDeep(defaultEmailSource);
        watcher.id = id;
        return Promise.resolve(watcher);
      });

      Watcher.get(id)
        .then((watcher) => {
          expect(watcher._id).to.eql(id);
          expect(watcher._source).to.be.an('object');
          expect(_.isEqual(_.keys(watcher._source).sort(), _.keys(defaultEmailSource).sort())).to.be(true);
        })
        .catch(done)
        .finally(done);
    });

    it('create new watcher', function (done) {
      const id = '123';
      const type = 'email';

      sinon.stub(savedWatchers, 'get', () => {
        const watcher = _.cloneDeep(defaultEmailSource);
        watcher.id = id;
        return Promise.resolve(watcher);
      });

      Watcher.new(type)
        .then((watcher) => {
          expect(watcher._source).to.be.an('object');
          expect(_.isEqual(_.keys(watcher._source).sort(), _.keys(defaultEmailSource).sort())).to.be(true);
        })
        .catch(done)
        .finally(done);
    });

    it('save watcher', function (done) {
      const id = '123';
      const watcher = {
        _id: id,
        _source: _.cloneDeep(defaultEmailSource),
        save: function () { return Promise.resolve(id); }
      };

      Watcher.save(watcher)
        .then((response) => {
          expect(response).to.be.eql(id);
        })
        .catch(done)
        .finally(done);
    });

    it('delete watcher', function (done) {
      const id = '123';

      sinon.stub(savedWatchers, 'delete', () => {
        return Promise.resolve([ undefined ]);
      });

      Watcher.delete(id)
        .then((response) => {
          expect(response).to.be.eql(id);
        })
        .catch(done)
        .finally(done);
    });

  });


  describe('API', function () {

    const initSentinlAPI = function () {
      Watcher.savedObjectsAPIEnabled = false;
    };

    beforeEach(function () {
      initSentinlAPI();
    });

    it('list watchers', function (done) {
      $httpBackend.expectGET('../api/sentinl/list').respond(200, {
        hits: {
          hits: [
            { _id: 1 },
            { _id: 2 }
          ]
        }
      });

      Watcher.list()
        .then((response) => {
          expect(response.length).to.eql(2);
        })
        .catch(done)
        .finally(done);

      $httpBackend.flush();
    });

    it('get watcher', function (done) {
      const id = 1;
      $httpBackend.expectGET(`../api/sentinl/get/watcher/${id}`).respond(200, {
        hits: {
          hits: [
            { _id: id }
          ]
        }
      });

      Watcher.get(id)
        .then((response) => {
          expect(response.hits.hits[0]._id).to.eql(id);
        })
        .catch(done)
        .finally(done);

      $httpBackend.flush();
    });

    it('create new email watcher', function (done) {
      const type = 'email';
      Watcher.new(type)
        .then((watcher) => {
          expect(watcher._id.length > 0).to.be(true);
          expect(_.isEqual(watcher._source, defaultEmailSource)).to.eql(true);
        })
        .catch(done)
        .finally(done);
    });

    it('create new report watcher', function (done) {
      const type = 'report';
      Watcher.new(type)
        .then((watcher) => {
          expect(watcher._id.length > 0).to.be(true);
          expect(_.isEqual(watcher._source, defaultReportSource)).to.eql(true);
        })
        .catch(done)
        .finally(done);
    });

    it('save watcher', function (done) {
      const watcher = {
        _id: Watcher.createId(),
        _source: _.cloneDeep(defaultEmailSource)
      };

      $httpBackend.when('GET', '../api/sentinl/config').respond(200, {
        es: {
          index: 'watcher',
          type: 'sentinl-watcher'
        }
      });
      $httpBackend.expectPOST(`../api/sentinl/watcher/${watcher._id}`).respond(200, {});

      Watcher.save(watcher)
        .then((response) => {
          expect(response).to.be.eql(watcher._id);
        })
        .catch(done)
        .finally(done);

      $httpBackend.flush();
    });

    it('delete watcher', function (done) {
      const id = Watcher.createId();
      $httpBackend.expectDELETE(`../api/sentinl/watcher/${id}`).respond(200, { ok: true });

      Watcher.delete(id)
        .then((response) => {
          expect(response).to.be.eql(id);
        })
        .catch(done)
        .finally(done);

      $httpBackend.flush();
    });

  });

});
