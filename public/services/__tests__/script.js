import moment from 'moment';
import sinon from 'sinon';
import ngMock from 'ng_mock';
import expect from 'expect.js';
import _ from 'lodash';
import uuid from 'uuid/v4';
import noDigestPromises from 'test_utils/no_digest_promises';

describe('Script', () => {

  let Script;
  let savedScripts;
  let $httpBackend;
  let Promise;
  let WATCHERSCRIPT;

  const init = function () {
    ngMock.module('kibana');

    ngMock.inject(($injector, _Script_, _$httpBackend_, _Promise_, _WATCHERSCRIPT_) => {
      Promise = _Promise_;
      Script = _Script_;
      savedScripts = $injector.has('savedScripts') ? $injector.get('savedScripts') : undefined;
      $httpBackend = _$httpBackend_;
      WATCHERSCRIPT = _WATCHERSCRIPT_;
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
      Script.isSiren = true;
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
        const a = _.cloneDeep(WATCHERSCRIPT);
        a.id = '123';
        const b = _.cloneDeep(WATCHERSCRIPT);
        b.id = '456';
        return Promise.resolve({ hits: [ a, b ] });
      });

      Script.list()
        .then((response) => {
          expect(response.length).to.eql(2);
          expect(response[0]._source).to.be.an('object');
          expect(_.isEqual(response[0]._source, WATCHERSCRIPT)).to.be(true);
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
      const script = _.cloneDeep(WATCHERSCRIPT);
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
});
