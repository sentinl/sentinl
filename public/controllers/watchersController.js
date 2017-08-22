/* global angular */
import _ from 'lodash';
import moment from 'moment';
import $ from 'jquery';
import ace from 'ace';

import confirmMessage from '../templates/confirm-message.html';
import { app } from '../app.module';

// WATCHERS CONTROLLER
app.controller('WatchersController', function ($rootScope, $scope, $route, $interval,
  $timeout, timefilter, Private, createNotifier, $window, $http, $uibModal, $log, navMenu,
  globalNavState, $location, dataTransfer, Watcher) {

  $scope.title = 'Sentinl: Watchers';
  $scope.description = 'Kibi/Kibana Report App for Elasticsearch';

  const notify = createNotifier({
    location: 'Sentinl Watchers'
  });

  $scope.topNavMenu = navMenu.getTopNav('watchers');
  $scope.tabsMenu = navMenu.getTabs();
  navMenu.setKbnLogo(globalNavState.isOpen());
  $scope.$on('globalNavState:change', () => navMenu.setKbnLogo(globalNavState.isOpen()));

  timefilter.enabled = false;
  $scope.watchers = [];

  /**
  * Opens watcher editor or wizard.
  *
  * @param {object} watcher - watcher object.
  * @param {string} type - editor, wizard.
  */
  $scope.editWatcher = function (watcher, type) {
    let path = `/${type}`;

    if (_.isObject(watcher)) {
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
  const listWatchers = function () {
    Watcher.list()
      .then((response) => {
        $scope.watchers = response;
        importWatcherFromLocalStorage();
      })
      .catch(notify.error)
      .finally(importWatcherFromLocalStorage);
  };

  listWatchers();

  // List the saved watcher.
  $scope.$on('editorCtrl-Watcher.save', () => {
    listWatchers();
  });


  /**
  * Deletes watcher.
  *
  * @param {string} id - watcher id.
  */
  $scope.deleteWatcher = function (id) {
    const index = $scope.watchers.findIndex((watcher) => watcher._id === id);

    const confirmModal = $uibModal.open({
      template: confirmMessage,
      controller: 'ConfirmMessageController',
      size: 'sm'
    });

    confirmModal.result.then((response) => {
      if (response === 'yes') {
        Watcher.delete($scope.watchers[index]._id).then((id) => {
          $scope.watchers.splice(index, 1);
          notify.info(`Watcher ${id} deleted`);
        }).catch((error) => {
          if (Number.isInteger(index)) {
            $scope.watchers.splice(index, 1);
          } else {
            notify.error(error);
          }
        });
      }
    });
  };

  /**
  * Saves watcher.
  *
  * @param {integer} index - index number of watcher in $scope.watchers array.
  */
  const saveWatcher = function (index) {
    Watcher.save($scope.watchers[index])
      .then((id) => {
        const status = $scope.watchers[index]._source.disable ? 'disabled' : 'enabled';
        notify.info(`Watcher ${id} ${status}!`);
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

  const currentTime = moment($route.current.locals.currentTime);
  $scope.currentTime = currentTime.format('HH:mm:ss');
  const utcTime = moment.utc($route.current.locals.currentTime);
  $scope.utcTime = utcTime.format('HH:mm:ss');
  const unsubscribe = $interval(function () {
    $scope.currentTime = currentTime.add(1, 'second').format('HH:mm:ss');
    $scope.utcTime = utcTime.add(1, 'second').format('HH:mm:ss');
  }, 1000);
  $scope.$watch('$destroy', unsubscribe);

});
