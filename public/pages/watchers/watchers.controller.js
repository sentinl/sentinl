/* global angular */
import { isObject, find, keys, forEach } from 'lodash';
import moment from 'moment';
import $ from 'jquery';
import ace from 'ace';

// WATCHERS CONTROLLER
function  WatchersController($rootScope, $scope, $route, $interval,
  $timeout, timefilter, Private, createNotifier, $window, $http, $uibModal, $log, navMenu,
  globalNavState, $location, dataTransfer, Watcher, Script, Promise, COMMON, confirmModal) {
  'ngInject';

  $scope.title = COMMON.watchers.title;
  $scope.description = COMMON.description;

  const notify = createNotifier({
    location: COMMON.watchers.title,
  });

  $scope.topNavMenu = navMenu.getTopNav('watchers');
  $scope.tabsMenu = navMenu.getTabs();

  timefilter.enabled = false;
  $scope.watchers = [];

  /**
  * Run watcher on demand.
  *
  * @param {string} id - watcher id
  */
  $scope.playWatcher = async function (task) {
    try {
      const resp = await Watcher.play(task._id);
      if (resp.warning) {
        notify.warning(resp.message);
      } else {
        notify.info('watcher executed');
      }
    } catch (err) {
      notify.error(err.message);
    }
  };

  /**
  * Opens watcher editor or wizard.
  *
  * @param {object} watcher - watcher object.
  * @param {string} type - editor, wizard.
  */
  $scope.editWatcher = function (watcher, type) {
    let path = `/${type}`;

    if (isObject(watcher)) {
      dataTransfer.setWatcher(watcher);
    } else {
      path += `/${watcher}`;
    }

    $location.path(path);
  };

  /**
  * Gets watcher object created by Kibana dashboard spy button.
  */
  const importWatcherFromLocalStorage = function () {
    /* New Entry from Saved Kibana Query */
    if ($window.localStorage.getItem('sentinl_saved_query')) {
      const spyPanelWatcher = angular.fromJson($window.localStorage.getItem('sentinl_saved_query'));
      $window.localStorage.removeItem('sentinl_saved_query');
      $scope.editWatcher(spyPanelWatcher, 'wizard');
    }
  };

  /**
  * Lists all existing watchers.
  */
  const listWatchers = async function () {
    return Watcher.list().then(function (resp) {
      $scope.watchers = resp;
    }).catch(notify.error).then(function () {
      importWatcherFromLocalStorage();
    });
  };

  listWatchers();

  // List the saved watcher.
  $scope.$on('editorCtrl-Watcher.save', () => {
    listWatchers();
  });

  /**
  * Delete watcher
  *
  * @param {string} id of watcher
  */
  $scope.deleteWatcher = function (id) {
    const index = $scope.watchers.findIndex((watcher) => watcher._id === id);
    const watcher = $scope.watchers[index];

    async function doDelete() {
      try {
        const id = await Watcher.delete(watcher._id);
        notify.info(`Deleted watcher ${watcher._source.title}`);
        $scope.watchers.splice(index, 1);
      } catch (err) {
        if (Number.isInteger(index)) {
          $scope.watchers.splice(index, 1);
        } else {
          notify.error(`failto delete watcher, ${err}`);
        }
      }
    }

    const confirmModalOptions = {
      onConfirm: doDelete,
      confirmButtonText: 'Delete watcher',
    };

    confirmModal(`Are you sure you want to delete the watcher ${watcher._source.title}?`, confirmModalOptions);
  };

  /**
  * Saves watcher.
  *
  * @param {integer} index - index number of watcher in $scope.watchers array.
  */
  const saveWatcher = function (index) {
    Watcher.save($scope.watchers[index])
      .then(function (id) {
        const status = $scope.watchers[index]._source.disable ? 'Disabled' : 'Enabled';
        const watcher = find($scope.watchers, (watcher) => watcher._id === id);
        notify.info(`${status} watcher "${watcher._source.title}"`);
      })
      .catch(notify.error);
  };

  /**
  * Enables or disables watcher.
  *
  * @param {string} id - watcher id.
  */
  $scope.toggleWatcher = function (id) {
    const index = $scope.watchers.findIndex((watcher) => watcher._id === id);
    $scope.watchers[index]._source.disable = !$scope.watchers[index]._source.disable;
    saveWatcher(index);
  };

  /**
  * Creates new watcher.
  *
  * @param {string} type - action type (email, report).
  */
  $scope.newWatcher = function (type) {
    Watcher.new(type)
      .then((watcher) => $scope.editWatcher(watcher, 'editor'))
      .catch(notify.error);
  };

  const templates = {
    input: {},
    condition: {},
    transform: {}
  };

  /**
  * Load templates for watcher fields.
  *
  * @param {array} templates - list of field names for templates
  */
  Promise.map(keys(templates), function (field) {
    return Script.list(field).then(function (_templates_) {
      if (_templates_.length) {
        forEach(_templates_, function (template) {
          templates[field][template._id] = template;
        });
      }
      return null;
    });
  }).then(function () {
    dataTransfer.setTemplates(templates);
    return null;
  }).catch(notify.error);

  const currentTime = moment($route.current.locals.currentTime);
  $scope.currentTime = currentTime.format('HH:mm:ss');
  const utcTime = moment.utc($route.current.locals.currentTime);
  $scope.utcTime = utcTime.format('HH:mm:ss');
  const unsubscribe = $interval(function () {
    $scope.currentTime = currentTime.add(1, 'second').format('HH:mm:ss');
    $scope.utcTime = utcTime.add(1, 'second').format('HH:mm:ss');
  }, 1000);
  $scope.$watch('$destroy', unsubscribe);

};

export default WatchersController;
