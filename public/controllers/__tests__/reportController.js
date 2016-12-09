import moment from 'moment';

describe('Report Controller', function () {
  var $scope;
  var sinon = require('auto-release-sinon');
  var Promise = require('bluebird');
  var ngMock = require('ngMock');
  var expect = require('expect.js');
  var $httpBackend;
  var createController;
  require('../reportController');
  function init({params = {}}) {
    ngMock.module('kibana', function ($provide) {
      $provide.constant('kbnDefaultAppId', '');
      $provide.constant('kibiDefaultDashboardTitle', '');
      $provide.constant('elasticsearchPlugins', ['siren-join']);
    });


    ngMock.inject(function (kibiState, $rootScope, $controller, $route, $injector, _$httpBackend_) {
      var currentTime = moment('2016-12-08T11:56:42.108Z');
      $route.current = {
        locals: {
          currentTime: currentTime
        }
      };
      $scope = $rootScope;
      $scope.vis = {
        params: params
      };
      //$httpBackend = $injector.get('$httpBackend');
      createController = function() {
       return $controller('sentinlReports', { $scope, $route});
     };
     $httpBackend = _$httpBackend_;
      $scope.$digest();
    });
  }

  describe('Check if title exists', function () {

    afterEach(function () {
      //$httpBackend.verifyNoOutstandingExpectation();
      //$httpBackend.verifyNoOutstandingRequest();
    });

    it('should exists', function () {
      init({});

      $httpBackend.whenGET('../api/sentinl/set/interval/:timeInterval').respond(200, {
        status: '200 OK'
      });
      var controller = createController();
      $httpBackend.flush();
      expect($scope.title).to.be('ASDFGHJK');
      expect($scope.description).to.be('ASDFGHJK');
      //expect($scope.title).to.be('ASDFGHJK');
    });
  });
});
