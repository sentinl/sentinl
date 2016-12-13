import moment from 'moment';
import sinon from 'auto-release-sinon';
import Promise from 'bluebird';
import ngMock from 'ngMock';
import expect from 'expect.js';

import '../reportController';

describe('Report Controller', function () {
  var $scope;
  var $httpBackend;
  var $route;

  function init({hits = []}) {
    ngMock.module('kibana', function ($provide) {
      $provide.constant('kbnDefaultAppId', '');
      $provide.constant('kibiDefaultDashboardTitle', '');
      $provide.constant('elasticsearchPlugins', ['siren-join']);
    });

    ngMock.inject(function (kibiState, $rootScope, $controller, _$route_, $injector, _$httpBackend_) {
      $httpBackend = _$httpBackend_;
      $httpBackend.whenGET(/\.\.\/api\/sentinl\/set\/interval\/.+/).respond(200, {
        status: '200 OK'
      });
      $httpBackend.whenGET('../api/sentinl/list/reports').respond(200, {
        hits: {
          hits: hits
        }
      });

      $route = _$route_;
      $route.current = {
        locals: {
          currentTime: moment('2016-12-08T11:56:42.108Z')
        }
      };
      $scope = $rootScope;
      $controller('sentinlReports', { $scope, $route });
      $scope.$digest();
      $httpBackend.flush();
    });
  }


  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('Title and description', function () {
    init({});
    expect($scope.title).to.equal('Sentinl: Reports');
    expect($scope.description).to.be('Kibi/Kibana Report App for Elasticsearch');
  });

  it('2 http requests should be made when controller is created', function () {
    init({hits: [{id: 1}, {id: 2}]});
    expect($scope.elasticReports.length).to.equal(2);
    expect($scope.elasticReports).to.eql([{id: 1}, {id: 2}]);
  });

  it('should refresh when timefilter.time changed', function () {
    init({});
    const spy = sinon.spy($route, 'reload');
    $scope.timefilter = {
      time: {
        from: 'now/y',
        mode: 'quick',
        to: 'now/y'
      }
    };
    $scope.$digest();
    sinon.assert.calledOnce(spy);
    $httpBackend.flush();
  });

});
