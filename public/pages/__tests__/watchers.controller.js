import moment from 'moment';
import sinon from 'sinon';
import ngMock from 'ng_mock';
import expect from 'expect.js';
import _ from 'lodash';
import noDigestPromises from 'test_utils/no_digest_promises';

import '../watchers/watchers.controller';

describe('watchersController', function () {
  let $httpBackend;
  let $scope;
  let $route;
  let $location;
  let Watcher;
  let Script;
  let Promise;
  let dataTransfer;
  let EMAILWATCHER;

  const init = function (done) {
    ngMock.module('kibana');

    ngMock.inject(function ($rootScope, $controller, _$location_, _$httpBackend_, _$route_, _Watcher_,
      _Script_, _dataTransfer_, _Promise_, _EMAILWATCHER_) {
      $scope = $rootScope;
      $route = _$route_;
      $location = _$location_;
      $httpBackend = _$httpBackend_;
      Watcher = _Watcher_;
      Script = _Script_;
      dataTransfer = _dataTransfer_;
      Promise = _Promise_;
      EMAILWATCHER = _EMAILWATCHER_;

      $httpBackend.when('GET', '../api/sentinl/config').respond(200, {
        es: {
          numer_of_results: 50
        },
        authentication: {
          enabled: false,
          mode: ''
        }
      });

      sinon.stub(Watcher, 'list', () => {
        return Promise.resolve([
          { _id: '123' },
          { _id: '456' }
        ]);
      });

      sinon.stub(Script, 'list', () => {
        return Promise.resolve([
          { _id: '123' },
          { _id: '456' }
        ]);
      });

      $route.current = {
        locals: {
          currentTime: moment('2016-08-08T11:56:42.108Z')
        }
      };

      $controller('WatchersController', {
        $scope,
        $route,
        $uibModal: {}
      });

      $scope.$apply();
    });
  };

  const failTest = function (error) {
    expect(error).to.be(undefined);
  };

  beforeEach(function () {
    init();
    noDigestPromises.activate();
  });

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('watchers have been loaded', function (done) {
    setTimeout(function () { // catch promise response
      expect($scope.watchers.length).to.equal(2);
      done();
      $httpBackend.flush();
    });
  });

  it('templates have been loaded', function (done) {
    setTimeout(function () { // catch promise response
      const templates = dataTransfer.getTemplates();

      _.forEach(_.keys(templates), function (field) {
        expect(_.keys(templates[field]).length).to.equal(2);
      });

      done();
      $httpBackend.flush();
    });
  });

  it('create new watcher', function (done) {
    const watcher = {
      _id: '123',
      _type: 'sentinl-watcher',
      _source: _.cloneDeep(EMAILWATCHER)
    };

    sinon.stub(Watcher, 'new', () => {
      return Promise.resolve(watcher);
    });

    $scope.newWatcher();

    setTimeout(function () {
      expect($location.path()).to.equal('/editor');

      const watcherFromStorage = dataTransfer.getWatcher();
      expect(watcherFromStorage._id).to.equal(watcher._id);
      expect(_.isEqual(_.keys(watcherFromStorage._source).sort(), _.keys(watcher._source).sort())).to.be(true);

      done();
    });
  });

});
