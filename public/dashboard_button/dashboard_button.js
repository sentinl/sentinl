import { NavBarExtensionsRegistryProvider } from 'ui/registry/navbar_extensions';
import { cloneDeep, assign, map, get } from 'lodash';
import rison from 'rison';
import { FilterBarQueryFilterProvider } from 'ui/filter_bar/query_filter';
import api from '../constants/api';
import './dashboard_button.less';

import EMAILWATCHERDASHBOARD from '../constants/email_watcher_dashboard';

function controller($scope, $http, kibiState, indexPatterns, savedScripts, Private) {
  $scope.createWatcher = function () {
    const watcher = cloneDeep(EMAILWATCHERDASHBOARD);
    watcher.dashboard_link = getDashboardUrl();

    const dash = kibiState.getDashboardOnView();
    watcher.title = `Watcher for ${dash.title}`;

    return kibiState.getState(kibiState.getCurrentDashboardId())
      .then(state => indexPatterns.get(state.index).then(indexPattern => {
        state.index = indexPattern.title;
        return state;
      }))
      .then(stripTypeFromFilters)
      .then(state => {
        watcher.input.search.request = state;
        window.localStorage.setItem('sentinl_saved_query', JSON.stringify(watcher));
      });
  };

  $scope.getErrors = function () {
    $scope.errorMessage = '';
    if (get($scope.selectedTemplate, 'dashboard.checkForError')) {
      kibiState.getState(kibiState.getCurrentDashboardId())
        .then($scope.selectedTemplate.dashboard.checkForError)
        .then(error => $scope.errorMessage = error);
    }
  };

  const queryFilter = Private(FilterBarQueryFilterProvider);
  $scope.$listen(queryFilter, 'update', $scope.getErrors);

  const dash = kibiState.getDashboardOnView();
  return kibiState.getState(kibiState.getCurrentDashboardId())
    .then(state => checkForErrors(dash, state))
    .then(state => indexPatterns.get(state.index))
    .then(indexPattern => getTemplates(savedScripts, dash, indexPattern.title, $http))
    .then(templates => {
      $scope.templates = templates;
      $scope.selectedTemplate = templates.sort((a, b) => get(a, 'dashboard.order', 9999) - get(b, 'dashboard.order', 9999))[0];
    })
    .catch(error => {
      $scope.errorMessage = error.message;
      $scope.selectDisabled = true;
    });
}

function checkForErrors(dash, state) {
  if (!dash.savedSearchId) {
    throw new Error('Dashboard must use a saved search');
  } else if (!state.time) {
    throw new Error('Data must have a time field');
  }

  return state;
}

function getTemplates(savedScripts, dash, indexPattern, $http) {
  return savedScripts.findByType('watcher')
    .then(data => data.hits || [])
    .then(templates => templates.map(template => assign(template, eval(template.scriptSource)))) // eslint-disable-line no-eval
    .then(templates => filterApplicableWatcherTypes($http, dash, indexPattern, templates));
}

async function filterApplicableWatcherTypes($http, dash, indexPattern, templates) {
  const mapping = await $http.post(api.ES.GET_MAPPING, { index: [indexPattern] });
  return templates.filter(template => !get(template, 'dashboard.show') || template.dashboard.show(dash, mapping.data));
}

function getDashboardUrl() {
  if (!window.location.href.includes('?')) {
    return window.location.href;
  }

  const [urlBase, query] = window.location.href.split('?', 2);
  let queryParameters = {};
  query.split('&').forEach(parameter => {
    const [key, value] = parameter.split('=');
    queryParameters[key] = (value.startsWith('h@')) ? JSON.parse(sessionStorage[value]) : rison.decode(value);
  });

  return urlBase + '?' + map(queryParameters, (value, key) => `${key}=${rison.encode(value)}`).join('&');
}

function stripTypeFromFilters(state) {
  state.filters
    .filter(filter => filter.meta.type === 'phrase')
    .forEach(filter => delete filter.query.match[filter.meta.key].type);
  return state;
}

NavBarExtensionsRegistryProvider.register(function () {
  return {
    appName: 'dashboard',
    key: 'key',
    label: 'Watcher',
    template: require('./dashboard_button.html'),
    locals: { controller },
    description: 'description',
    hideButton: () => false,
    disableButton: () => false,
    tooltip: () => 'Create a new watcher from this dashboard search',
    order: -10000
  };
});
