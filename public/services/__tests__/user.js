import moment from 'moment';
import sinon from 'sinon';
import ngMock from 'ng_mock';
import expect from 'expect.js';
import _ from 'lodash';

describe('User', function () {

  let User;
  let $httpBackend;

  const init = function () {
    ngMock.module('kibana');

    ngMock.inject((_User_, _$httpBackend_) => {
      User = _User_;
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
    expect(User).to.be.a('object');
  });


  describe('API', function () {

    const initSentinlAPI = function () {
      User.savedObjectsAPIEnabled = false;
    };

    beforeEach(function () {
      initSentinlAPI();
    });

    it('create user', function (done) {
      const id = '28937fc3uijh290';
      const username = 'admin';
      const password = 'admin';

      $httpBackend.expectPOST(`../api/sentinl/user/${id}/${username}/${password}`).respond(200, { ok: true });

      User.new(id, username, password)
        .then((response) => {
          expect(response).to.be.eql(id);
        })
        .catch(done)
        .finally(done);

      $httpBackend.flush();
    });

  });

});
