import moment from 'moment';
import sinon from 'sinon';
import ngMock from 'ng_mock';
import expect from 'expect.js';
import _ from 'lodash';
import uuid from 'uuid/v4';
import noDigestPromises from 'test_utils/no_digest_promises';

import defaultWatcherScript from '../../defaults/watcher_script';

describe('Script', () => {

  let Script;
  let savedScripts;
  let $httpBackend;
  let Promise;

  const init = function () {
    ngMock.module('kibana');

    ngMock.inject(($injector, _Script_, _$httpBackend_, _Promise_) => {
      Promise = _Promise_;
      Script = _Script_;
      savedScripts = $injector.has('savedScripts') ? $injector.get('savedScripts') : undefined;
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
    expect(Script).to.be.a('object');
  });


  describe('Kibi API', function () {

    const initKibiAPI = function () {
      Script.savedObjectsAPIEnabled = true;
    };

    beforeEach(function () {
      initKibiAPI();

      $httpBackend.when('GET', '../api/sentinl/config').respond(200, {
        es: {
          number_of_results: 50
        }
      });
    });

    it('list scripts', function (done) {
      if (!savedScripts) {
        done();
      }

      this.timeout(30000);

      sinon.stub(savedScripts, 'find', () => {
        const a = _.cloneDeep(defaultWatcherScript);
        a.id = '123';
        const b = _.cloneDeep(defaultWatcherScript);
        b.id = '456';
        return Promise.resolve({ hits: [ a, b ] });
      });

      Script.list()
        .then((response) => {
          expect(response.length).to.eql(2);
          expect(response[0]._source).to.be.an('object');
          expect(_.isEqual(response[0]._source, defaultWatcherScript)).to.be(true);
        })
        .catch(done);

      $httpBackend.flush();
      setTimeout(done, 25000);
    });

    it('create new script', function (done) {
      if (!savedScripts) {
        done();
      }

      const id = '123';
      const script = _.cloneDeep(defaultWatcherScript);
      script.id = id;
      script.save = () => Promise.resolve(id);

      sinon.stub(savedScripts, 'get', () => {
        return Promise.resolve(script);
      });

      Script.new(script)
        .then((response) => {
          expect(response).to.be.eql(id);
        })
        .catch(done)
        .finally(done);
    });

    it('delete script', function (done) {
      if (!savedScripts) {
        done();
      }

      const id = '123';

      sinon.stub(savedScripts, 'delete', () => {
        return Promise.resolve([ undefined ]);
      });

      Script.delete(id)
        .then((response) => {
          expect(response).to.be.eql(id);
        })
        .catch(done)
        .finally(done);
    });

  });


  describe('API', function () {

    const initSentinlAPI = function () {
      Script.savedObjectsAPIEnabled = false;
    };

    beforeEach(() => {
      initSentinlAPI();
    });

    it('list scripts', function (done) {
      const type = 'transform';
      $httpBackend.expectGET(`../api/sentinl/list/scripts/${type}`).respond(200, {
        hits: {
          hits: [
            { _id: 1 },
            { _id: 2 }
          ]
        }
      });

      Script.list(type)
        .then((response) => {
          expect(response.length).to.eql(2);
        })
        .catch(done)
        .finally(done);

      $httpBackend.flush();
    });

    it('create new script', function (done) {
      const script = { _id: uuid() };
      $httpBackend.expectPOST(`../api/sentinl/save/script/${script._id}`).respond(200, {});

      Script.new(script)
        .then((response) => {
          expect(response).to.eql(script._id);
        })
        .catch(done)
        .finally(done);

      $httpBackend.flush();
    });

    it('delete script', function (done) {
      const id = uuid();
      $httpBackend.expectDELETE(`../api/sentinl/remove/script/${id}`).respond(200, {});

      Script.delete(id)
        .then((response) => {
          expect(response).to.eql(id);
        })
        .catch(done)
        .finally(done);

      $httpBackend.flush();
    });

  });

});
