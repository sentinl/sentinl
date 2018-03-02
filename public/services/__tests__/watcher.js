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
  let EMAILWATCHER;
  let REPORTWATCHER;

  const init = function () {
    ngMock.module('kibana');

    ngMock.inject(($injector, _Watcher_, _$httpBackend_, _Promise_, _REPORTWATCHER_, _EMAILWATCHER_) => {
      Promise = _Promise_;
      Watcher = _Watcher_;
      savedWatchers = $injector.has('savedWatchers') ? $injector.get('savedWatchers') : undefined;
      $httpBackend = _$httpBackend_;
      EMAILWATCHER = _EMAILWATCHER_;
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

  it('make _source flat', function () {
    let watcher = {
      _id: uuid(),
      _source: cloneDeep(EMAILWATCHER)
    };

    watcher = Watcher.flatSource(watcher);
    const flattedFields = keys(watcher).filter((field) => field !== 'id');

    forEach(flattedFields.sort(), function (field) {
      expect(includes(Watcher.fields.sort(), field)).to.be(true);
    });
    expect(watcher._source).to.be(undefined);
    expect(watcher._id).to.be(undefined);
    expect(watcher.id).to.be.a('string');
  });

  it('make _source nested', function () {
    let watcher = cloneDeep(EMAILWATCHER);
    watcher.id = uuid();

    watcher = Watcher.nestedSource(watcher);
    const nestedFields = keys(watcher._source);

    forEach(nestedFields.sort(), function (field) {
      expect(includes(Watcher.fields.sort(), field)).to.be(true);
    });
    expect(watcher._source).to.be.an('object');
    expect(watcher.id).to.be(undefined);
    expect(watcher._id).to.be.a('string');
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
        const watcher = cloneDeep(EMAILWATCHER);
        watcher.id = id;
        return Promise.resolve(watcher);
      });

      Watcher.get(id)
        .then((watcher) => {
          expect(watcher._id).to.eql(id);
          expect(watcher._source).to.be.an('object');
          expect(isEqual(keys(watcher._source).sort(), keys(EMAILWATCHER).sort())).to.be(true);
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
        const watcher = cloneDeep(EMAILWATCHER);
        watcher.id = id;
        return Promise.resolve(watcher);
      });

      Watcher.new(type)
        .then((watcher) => {
          expect(watcher._source).to.be.an('object');
          expect(isEqual(keys(watcher._source).sort(), keys(EMAILWATCHER).sort())).to.be(true);
        })
        .catch(done)
        .finally(done);
    });

    it('save watcher', function (done) {
      if (!savedWatchers) {
        done();
      }

      const id = '123';
      const watcher = {
        _id: id,
        _source: cloneDeep(EMAILWATCHER),
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
