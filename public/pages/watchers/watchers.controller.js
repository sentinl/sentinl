/* global angular */
import { get, isObject, find, keys, forEach } from 'lodash';
import moment from 'moment';
import $ from 'jquery';
import ace from 'ace';
import { SentinlError } from '../../services';
import { toastNotificationsFactory, timefilterFactory } from '../../factories';

const toastNotifications = toastNotificationsFactory();

// WATCHERS CONTROLLER
function  WatchersController($injector, $scope, $route, $interval, $window, sentinlLog, navMenu, $location,
   dataTransfer, confirmModal, wizardHelper, watcherService, userService) {
  'ngInject';

  const log = sentinlLog;
  log.initLocation('Watchers');

  function errorMessage(message, err) {
    err = new SentinlError(message, err);
    log.error(err);
    toastNotifications.addDanger(err.message);
  }

  $scope.topNavMenu = navMenu.getTopNav('watchers');
  $scope.tabsMenu = navMenu.getTabs();

  const timefilter = timefilterFactory($injector);
  timefilter.enable(false);

  $scope.watchers = [];
  $scope.wizardHelper = wizardHelper;

  $scope.watcherService = watcherService;
  $scope.userService = userService;

  $scope.inputInfo = function (watcher) {
    const index = get(watcher, 'input.search.request.index');
    if (Array.isArray(index)) {
      return index.join(',');
    } else if (index) {
      return index;
    }
    return get(watcher, 'input.search.kable.expression') || get(watcher, 'input.search.timelion.sheet');
  };

  /**
  * Run watcher on demand.
  *
  * @param {string} id - watcher id
  */
  $scope.playWatcher = async function (task) {
    try {
      const resp = await $scope.watcherService.play(task.id);
      if (resp.warning) {
        toastNotifications.addWarning(resp.message);
      } else {
        toastNotifications.addSuccess('watcher executed');
      }
    } catch (err) {
      errorMessage('play watcher', err);
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
    try {
      $scope.watchers = await $scope.watcherService.list();
    } catch (err) {
      errorMessage('list watchers', err);
      importWatcherFromLocalStorage();
    }
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
    const index = $scope.watchers.findIndex((watcher) => watcher.id === id);
    const watcher = $scope.watchers[index];

    async function doDelete() {
      try {
        await $scope.watcherService.delete(watcher.id);
        toastNotifications.addSuccess(`deleted watcher ${watcher.title}`);
        $scope.watchers.splice(index, 1);

        try {
          const user = await $scope.userService.get(watcher.id);
          await $scope.userService.delete(user.id);
          toastNotifications.addSuccess(`deleted user ${user.id}`);
        } catch (err) {
          log.warn(err.toString());
        }
      } catch (err) {
        errorMessage('delete watcher', err);
      }
    }

    const confirmModalOptions = {
      onConfirm: doDelete,
      confirmButtonText: 'Delete watcher',
    };

    confirmModal(`Are you sure you want to delete the watcher ${watcher.title}?`, confirmModalOptions);
  };

  /**
  * Saves watcher.
  *
  * @param {integer} index - index number of watcher in $scope.watchers array.
  */
  const saveWatcher = async function (index) {
    try {
      await $scope.watcherService.save($scope.watchers[index]);
      const status = $scope.watchers[index].disable ? 'Disabled' : 'Enabled';
      toastNotifications.addSuccess(`${status} watcher "${$scope.watchers[index].title}"`);
    } catch (err) {
      errorMessage('save watcher', err);
    }
  };

  /**
  * Enables or disables watcher.
  *
  * @param {string} id - watcher id.
  */
  $scope.toggleWatcher = function (id) {
    const index = $scope.watchers.findIndex((watcher) => watcher.id === id);
    $scope.watchers[index].disable = !$scope.watchers[index].disable;
    saveWatcher(index);
  };

  /**
  * Creates new watcher.
  *
  * @param {string} type - action type (email, report).
  */
  $scope.newWatcher = async function (type) {
    try {
      const watcher = await $scope.watcherService.new(type);
      $scope.editWatcher(watcher, 'editor');
    } catch (err) {
      errorMessage('create watcher', err);
    }
  };

  const currentTime = moment($route.current.locals.currentTime);
  $scope.currentTime = currentTime.format('HH:mm:ss');
  const utcTime = moment.utc($route.current.locals.currentTime);
  $scope.utcTime = utcTime.format('HH:mm:ss');
  const unsubscribe = $interval(function () {
    $scope.currentTime = currentTime.add(1, 'second').format('HH:mm:ss');
    $scope.utcTime = utcTime.add(1, 'second').format('HH:mm:ss');
  }, 1000);
  $scope.$watch('$destroy', unsubscribe);

  $scope.getWatcherType = function (watcher) {
    if (get(watcher, 'wizard.chart_query_params')) {
      return 'wizard';
    } else if (get(watcher, 'custom.type')) {
      return 'custom';
    } else {
      return 'advanced';
    }
  };
};

export default WatchersController;
