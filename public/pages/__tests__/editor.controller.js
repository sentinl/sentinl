import moment from 'moment';
import sinon from 'sinon';
import ngMock from 'ng_mock';
import expect from 'expect.js';
import _ from 'lodash';
import noDigestPromises from 'test_utils/no_digest_promises';

import '../editor/editor.controller';

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
  let Promise;
  let EMAILWATCHER;

  let templates = {
    condition: {
      '123': {
        _id: '123',
        _source: {
          title: 'my title',
          body: '{\'script\':{\'script\':\'payload.hits.total > 100\'}}'
        }
      }
    },
    input: {
      '456': {
        _id: '456'
      }
    },
    transform: {
      '789': {
        _id: '789'
      }
    }
  };


  describe('new watcher', function () {

    const initNew = function ($provide) {
      ngMock.module('kibana');

      ngMock.inject(function ($rootScope, $controller, _$location_, _$httpBackend_, _$route_,
        _Watcher_, _Script_, _dataTransfer_, _Notifier_, _$routeParams_, _Promise_, _EMAILWATCHER_) {
        $scope = $rootScope;
        $route = _$route_;
        $location = _$location_;
        $httpBackend = _$httpBackend_;
        $routeParams = _$routeParams_;
        Watcher = _Watcher_;
        Script = _Script_;
        dataTransfer = _dataTransfer_;
        Notifier = _Notifier_;
        Promise = _Promise_;
        EMAILWATCHER = _EMAILWATCHER_;

        $route.current = {
          locals: {
            currentTime: moment('2016-08-08T11:56:42.108Z')
          }
        };

        watcher = {
          _id: '123',
          _type: 'sentinl-watcher',
          _source: _.cloneDeep(EMAILWATCHER)
        };

        dataTransfer.setWatcher(watcher);
        dataTransfer.setTemplates(templates);

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

        $controller('EditorController', {
          $scope,
          $route,
          $uibModal: {}
        });

        $httpBackend.flush();
      });
    };

    beforeEach(function () {
      ngMock.module('kibana', function ($provide) {
        $provide.constant('sentinlConfig', {});
      });

      initNew();
      noDigestPromises.activate();
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

    it('templates have been loaded', function (done) {
      setTimeout(function () { // catch promise response
        _.forEach($scope.form.templates, function (field) {
          expect(_.keys(field).length).not.to.equal(0); // we have Sentinl default templates too
        });
        done();
        $httpBackend.flush();
      });
    });

    it('save template', function (done) {
      const id = '1q2w';
      const field = 'condition';
      $scope.watcherForm = {
        [field + 'Title']: {
          $viewValue: 'my title'
        }
      };

      sinon.stub(Script, 'new', () => {
        return Promise.resolve(id);
      });

      $scope.saveScript(field);

      setTimeout(function () {
        expect($scope.form.templates[field][id]).to.be.an('object');
        expect($scope.form.templates[field][id]._id).to.equal($scope.watcher['$$' + field].id); // saved template is current
        done();
      });
    });

    it('delete template', function (done) {
      const _id_ = '1q2w';
      const field = 'condition';
      $scope.watcher['$$' + field] = {
        id: _id_
      };

      sinon.stub(Script, 'delete', () => {
        return Promise.resolve(_id_);
      });

      $scope.removeScript(field);

      setTimeout(function () {
        expect($scope.form.templates[field][_id_]).to.be(undefined);
        done();
      });
    });

    it('select template', function () {
      const id = '123';
      const field = 'condition';

      $scope.selectScript(field, id);

      expect($scope.watcher['$$' + field]).to.be.an('object');
      expect($scope.watcher['$$' + field].id).to.equal(id);
    });
  });

  describe('edit watcher', function () {

    const initEdit = function (done) {
      ngMock.module('kibana');

      ngMock.inject(function ($rootScope, $controller, _$location_, _$httpBackend_, _$route_,
        _Watcher_, _dataTransfer_, _Notifier_, _$routeParams_) {
        $scope = $rootScope;
        $route = _$route_;
        $location = _$location_;
        $httpBackend = _$httpBackend_;
        $routeParams = _$routeParams_;
        Watcher = _Watcher_;
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
          _source: _.cloneDeep(EMAILWATCHER)
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

        $controller('EditorController', {
          $scope,
          $route,
          $uibModal: {}
        });

      });
    };

    beforeEach(function () {
      ngMock.module('kibana', function ($provide) {
        $provide.constant('sentinlConfig', {});
      });

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
