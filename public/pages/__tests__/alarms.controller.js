import moment from 'moment';
import sinon from 'sinon';
import ngMock from 'ng_mock';
import expect from 'expect.js';
import noDigestPromises from 'test_utils/no_digest_promises';

import '../alarms/alarms.controller';

describe('Alarms Controller', function () {

  var $scope;
  var $httpBackend;
  var $route;
  let Promise;

  function init({hits = []}) {
    ngMock.module('kibana');

    ngMock.inject(function ($rootScope, $controller, _$route_, $injector, _$httpBackend_, _Promise_) {
      Promise = _Promise_;
      $httpBackend = _$httpBackend_;
      $httpBackend.whenGET(/\.\.\/api\/sentinl\/set\/interval\/.+/).respond(200, {
        status: '200 OK'
      });
      $httpBackend.whenGET('../api/sentinl/list/alarms').respond(200, {
        hits: {
          hits: hits
        }
      });

      $route = _$route_;
      $route.current = {
        locals: {
          currentTime: moment('2016-08-08T11:56:42.108Z')
        }
      };
      $scope = $rootScope;
      $controller('AlarmsController', {
        $scope,
        $route,
        $uibModal: {}
      });
      $scope.$digest();
      $httpBackend.flush();
    });
  }

  beforeEach(function () {
    noDigestPromises.activate();
  });

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('2 http requests should be made when controller is created', function () {
    init({hits: [{id: 1}, {id: 2}]});
    expect($scope.alarms.length).to.equal(2);
    expect($scope.alarms).to.eql([{id: 1}, {id: 2}]);
  });

});
