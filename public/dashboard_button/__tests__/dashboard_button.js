import { NavBarExtensionsRegistryProvider } from 'ui/registry/navbar_extensions';
import ngMock from 'ng_mock';
import expect from 'expect.js';
import sinon from 'sinon';
import { assign, map } from 'lodash';
import api from '../../constants/api';

describe('Dashboard watcher button', function () {
  let $scope;
  let $http;
  let kibiState;
  let indexPatterns;
  let savedScripts;
  let Private;

  let watcherNavbarController;
  let getStateStub;
  let $httpStub;

  const mockTemplateSourceShow = `({
      dashboard: {
        show: () => true
      }
    })`;
  const mockTemplateSourceHide = `({
      dashboard: {
        show: () => false
      }
    })`;

  beforeEach(ngMock.module('kibana'));
  beforeEach(ngMock.inject(function (_$rootScope_, _$http_, _kibiState_, _indexPatterns_, _savedScripts_, _Private_) {
    $scope = _$rootScope_;
    $http = _$http_;
    kibiState = _kibiState_;
    indexPatterns = _indexPatterns_;
    savedScripts = _savedScripts_;
    Private = _Private_;

    sinon.stub(kibiState, 'getDashboardOnView').returns({
      title: 'all articles',
      savedSearchId: 123
    });

    getStateStub = sinon.stub(kibiState, 'getState').returns(Promise.resolve({
      index: 'index-pattern:article',
      time: {},
      filters: []
    }));

    sinon.stub(indexPatterns, 'get').returns(Promise.resolve({ title: 'article' }));

    sinon.stub(savedScripts, 'findByType').returns(Promise.resolve({
      hits: [
        { scriptSource: mockTemplateSourceShow },
        { scriptSource: mockTemplateSourceHide }
      ]
    }));

    $httpStub = sinon.stub($http, 'post');
    $httpStub.withArgs(api.ES.GET_MAPPING, { index: ['article'] }).returns({});

    const navbarExtensionsRegistry = Private(NavBarExtensionsRegistryProvider);
    watcherNavbarController = navbarExtensionsRegistry.byAppName.dashboard.find(nav => nav.label === 'Watcher');
  }));


  afterEach(function () {
    $httpStub.restore();
  });

  describe('controller initialisation', () => {
    it('gets the list of templates', async () => {
      const expectedTemplate = { scriptSource: mockTemplateSourceShow };
      assign(expectedTemplate, eval(mockTemplateSourceShow)); // eslint-disable-line no-eval

      return watcherNavbarController.locals.controller($scope, $http, kibiState, indexPatterns, savedScripts, Private)
        .then(() => {
          expect($httpStub.called).to.be(true);
          expect($scope.errorMessage).to.not.be.ok();
          expect($scope.templates).to.have.length(1);
          expect($scope.templates[0].scriptSource).to.be(mockTemplateSourceShow);
          expect($scope.templates[0]).to.only.have.keys('scriptSource', 'dashboard');
          expect($scope.templates[0].dashboard.show).to.be.a('function');
        });
    });

    it('throws error when dashboard has no time field', async () => {
      getStateStub.returns(Promise.resolve({ index: 'index-pattern:articles' }));

      return watcherNavbarController.locals.controller($scope, $http, kibiState, indexPatterns, savedScripts, Private)
        .then(() => expect($scope.errorMessage).to.match(/.*time field.*/));
    });
  });

  describe('create watcher', () => {
    beforeEach(() => watcherNavbarController.locals.controller($scope, $http, kibiState, indexPatterns, savedScripts, Private));

    it('stores watcher data', () => {
      return $scope.createWatcher()
        .then(() => {
          const watcher = JSON.parse(window.localStorage.getItem('sentinl_saved_query'));
          expect(watcher).to.have.keys(
            'title', 'disable', 'report', 'save_payload', 'impersonate', 'spy', 'trigger',
            'input', 'condition', 'actions', 'dashboard_link'
          );
          expect(watcher.input.search.request.index).to.be('article');
        });
    });
  });
});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
