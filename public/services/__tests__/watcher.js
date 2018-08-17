import moment from 'moment';
import sinon from 'sinon';
import ngMock from 'ng_mock';
import expect from 'expect.js';
import uuid from 'uuid/v4';
import { cloneDeep, keys, forEach, includes, isEqual } from 'lodash';
import noDigestPromises from 'test_utils/no_digest_promises';

describe('Watcher', function () {

  let Watcher;
  let $httpBackend;
  let savedWatchers;
  let Promise;
  let sentinlHelper;
  let EMAILWATCHERADVANCED;
  let REPORTWATCHER;

  const init = function () {
    ngMock.module('kibana');

    ngMock.inject(($injector, _Watcher_, _$httpBackend_, _Promise_, _sentinlHelper_, _REPORTWATCHER_, _EMAILWATCHERADVANCED_) => {
      Promise = _Promise_;
      Watcher = _Watcher_;
      savedWatchers = $injector.has('savedWatchers') ? $injector.get('savedWatchers') : undefined;
      $httpBackend = _$httpBackend_;
      sentinlHelper = _sentinlHelper_;
      EMAILWATCHERADVANCED = _EMAILWATCHERADVANCED_;
      REPORTWATCHER = _REPORTWATCHER_;
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
    expect(Watcher).to.be.a('object');
  });


  describe('Kibi API', function () { // savedObjectsAPI

    const initKibiAPI = function () {
      Watcher.isSiren = true;
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
      if (!savedWatchers) {
        done();
      }

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
      if (!savedWatchers) {
        done();
      }

      const id = '123';

      sinon.stub(savedWatchers, 'get', () => {
        const watcher = cloneDeep(EMAILWATCHERADVANCED);
        watcher.id = id;
        return Promise.resolve(watcher);
      });

      Watcher.get(id)
        .then((watcher) => {
          expect(watcher.id).to.eql(id);
          expect(watcher).to.be.an('object');
          expect(isEqual(keys(sentinlHelper.pickWatcherSource(watcher)).sort(), keys(EMAILWATCHERADVANCED).sort())).to.be(true);
        })
        .catch(done)
        .finally(done);
    });

    it('create new watcher', function (done) {
      if (!savedWatchers) {
        done();
      }

      const id = '123';
      const type = 'email';

      sinon.stub(savedWatchers, 'get', () => {
        const watcher = cloneDeep(EMAILWATCHERADVANCED);
        watcher.id = id;
        return Promise.resolve(watcher);
      });

      Watcher.new(type)
        .then((watcher) => {
          expect(watcher).to.be.an('object');
          expect(isEqual(keys(sentinlHelper.pickWatcherSource(watcher)).sort(), keys(EMAILWATCHERADVANCED).sort())).to.be(true);
        })
        .catch(done)
        .finally(done);
    });

    it('save watcher', function (done) {
      if (!savedWatchers) {
        return done();
      }

      const watcher = cloneDeep(EMAILWATCHERADVANCED);
      watcher.id = '123';
      watcher.save = function () { return Promise.resolve(watcher.id); };

      Watcher.save(watcher)
        .then((response) => {
          expect(response).to.be.eql(watcher.id);
        })
        .catch(done)
        .finally(done);
    });

    it('delete watcher', function (done) {
      if (!savedWatchers) {
        done();
      }

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
});
