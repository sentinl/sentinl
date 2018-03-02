import moment from 'moment';
import sinon from 'sinon';
import ngMock from 'ng_mock';
import expect from 'expect.js';
import _ from 'lodash';

describe('Alarm', function () {

  let Alarm;
  let $httpBackend;

  const init = function () {
    ngMock.module('kibana');

    ngMock.inject((_Alarm_, _$httpBackend_) => {
      Alarm = _Alarm_;
      $httpBackend = _$httpBackend_;
    });
  };

  beforeEach(function () {
    init();
  });

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('can get an instance of the factory', function () {
    expect(Alarm).to.be.a('object');
  });

  describe('API', function () {

    it('list alarms', function (done) {
      $httpBackend.expectGET('../api/sentinl/list/alarms').respond(200, {
        hits: {
          hits: [
            { _id: 1 },
            { _id: 2 }
          ]
        }
      });

      Alarm.list()
        .then((response) => {
          expect(response.data.hits.hits.length).to.eql(2);
        })
        .catch(done)
        .finally(done);

      $httpBackend.flush();
    });

    it('set timefilter', function (done) {
      const timeInterval = {
        from:'now/d',
        to:'now/d',
        mode:'quick'
      };

      const path = '../api/sentinl/set/interval/' + JSON.stringify(timeInterval).replace(/\//g, '%2F');
      $httpBackend.expectGET(path).respond(200, { ok: true });

      Alarm.updateFilter(timeInterval)
        .then((response) => {
          expect(response.status).to.be.eql('200');
        })
        .catch(done)
        .finally(done);

      $httpBackend.flush();
    });

    it('delete alarm', function (done) {
      const index = 'sentinl-alarms';
      const type = 'sentinl-alarm';
      const id = '2935490jfedksjld';

      $httpBackend.expectDELETE(`../api/sentinl/alarm/${index}/${type}/${id}`).respond(200, { ok: true });

      Alarm.delete(index, type, id)
        .then((response) => {
          expect(response).to.be.eql(id);
        })
        .catch(done)
        .finally(done);

      $httpBackend.flush();
    });

  });

});
