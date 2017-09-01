import moment from 'moment';
import sinon from 'sinon';
import Promise from 'bluebird';
import ngMock from 'ng_mock';
import expect from 'expect.js';
import _ from 'lodash';

import defaultEmailSource from '../../defaults/email_watcher';

import '../editorController';

describe('editorController', function () {
  let $httpBackend;
  let $scope;
  let $route;
  let $location;
  let $routeParams;
  let Watcher;
  let Script;
  let dataTransfer;
  let Notifier;
  let watcher;


  describe('new watcher', function () {

    const initNew = function (done) {
      ngMock.module('kibana');

      ngMock.inject(function ($rootScope, $controller, _$location_, _$httpBackend_, _$route_,
        _Watcher_, _dataTransfer_, _Notifier_, _$routeParams_, _Script_) {
        $scope = $rootScope;
        $route = _$route_;
        $location = _$location_;
        $httpBackend = _$httpBackend_;
        $routeParams = _$routeParams_;
        Watcher = _Watcher_;
        Script = _Script_;
        dataTransfer = _dataTransfer_;
        Notifier = _Notifier_;

        $route.current = {
          locals: {
            currentTime: moment('2016-08-08T11:56:42.108Z')
          }
        };

        watcher = {
          _id: '123',
          _type: 'sentinl-watcher',
          _source: _.cloneDeep(defaultEmailSource)
        };

        dataTransfer.setWatcher(watcher);

        $routeParams.watcherId = undefined;
        $location.$$path = '/editor';

        $httpBackend.when('GET', '../api/sentinl/config').respond(200, {
          es: {
            numer_of_results: 50
          },
          authentication: {
            enabled: false,
            mode: ''
          }
        });

        sinon.stub(Script, 'list', () => {
          return Promise.resolve([
            { _id: '123' },
            { _id: '456' }
          ]);
        });

        $controller('EditorController', {
          $scope,
          $route,
          $uibModal: {}
        });

        $httpBackend.flush();
      });
    };

    beforeEach(function () {
      initNew();
    });

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
      Notifier.prototype._notifs.length = 0;
    });

    it('set watcher defaults', function () {
      expect($scope.watcher._id).to.equal(watcher._id);
      expect(_.isEqual(_.keys($scope.watcher._source).sort(), _.keys(watcher._source).sort())).to.be(true);
    });

  });


  describe('edit watcher', function () {

    const initEdit = function (done) {
      ngMock.module('kibana');

      ngMock.inject(function ($rootScope, $controller, _$location_, _$httpBackend_, _$route_,
        _Watcher_, _dataTransfer_, _Notifier_, _$routeParams_, _Script_) {
        $scope = $rootScope;
        $route = _$route_;
        $location = _$location_;
        $httpBackend = _$httpBackend_;
        $routeParams = _$routeParams_;
        Watcher = _Watcher_;
        Script = _Script_;
        dataTransfer = _dataTransfer_;
        Notifier = _Notifier_;

        $route.current = {
          locals: {
            currentTime: moment('2016-08-08T11:56:42.108Z')
          }
        };

        watcher = {
          _id: '123',
          _type: 'sentinl-watcher',
          _source: _.cloneDeep(defaultEmailSource)
        };

        $routeParams.watcherId = watcher._id;
        $location.$$path = '/editor';

        $httpBackend.when('GET', '../api/sentinl/config').respond(200, {
          es: {
            numer_of_results: 50
          },
          authentication: {
            enabled: false,
            mode: ''
          }
        });

        sinon.stub(Watcher, 'get', () => {
          return Promise.resolve(watcher);
        });

        sinon.stub(Script, 'list', () => {
          return Promise.resolve([
            { _id: '123' },
            { _id: '456' }
          ]);
        });

        $controller('EditorController', {
          $scope,
          $route,
          $uibModal: {}
        });

      });
    };

    beforeEach(function () {
      initEdit();
    });

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
      Notifier.prototype._notifs.length = 0;
    });

    it('get watcher data', function (done) {
      setTimeout(function () {
        $httpBackend.flush();
        expect($scope.watcher._id).to.equal(watcher._id);
        expect(_.isEqual(_.keys($scope.watcher._source).sort(), _.keys(watcher._source).sort())).to.be(true);
        done();
      });
    });

  });

});
