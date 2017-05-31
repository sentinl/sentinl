/* global angular */
import _ from 'lodash';
import moment from 'moment';
import $ from 'jquery';
import ace from 'ace';
import Notifier from 'ui/notify/notifier';

import confirmMessage from '../templates/confirm-message.html';
import { app } from '../app.module';
import WatcherHelper from '../classes/WatcherHelper';

// WATCHERS CONTROLLER
app.controller('sentinlWatchers', function ($rootScope, $scope, $route, $interval,
  $timeout, timefilter, Private, Notifier, $window, $http, $modal, $log, navMenu, globalNavState) {

  $scope.title = 'Sentinl: Watchers';
  $scope.description = 'Kibana Alert App for Elasticsearch';

  const wHelper = new WatcherHelper();
  $scope.notify = new Notifier();

  $scope.topNavMenu = navMenu.getTopNav('watchers');
  $scope.tabsMenu = navMenu.getTabs();
  navMenu.setKbnLogo(globalNavState.isOpen());
  $scope.$on('globalNavState:change', () => navMenu.setKbnLogo(globalNavState.isOpen()));

  timefilter.enabled = false;
  $scope.watchers = [];

  function importWatcherFromLocalStorage() {
    /* New Entry from Saved Kibana Query */
    if ($window.localStorage.getItem('sentinl_saved_query')) {
      $scope.watcherNew(angular.fromJson($window.localStorage.getItem('sentinl_saved_query')));
      $window.localStorage.removeItem('sentinl_saved_query');
    }
  };

  $http.get('../api/sentinl/list')
  .then((response) => {
    $scope.watchers = response.data.hits.hits;
    importWatcherFromLocalStorage();
  })
  .catch((error) => {
    $scope.notify.error(error);
    importWatcherFromLocalStorage();
  });

  $scope.watcherDelete = function (watcherId) {
    const index = $scope.watchers.findIndex((watcher) => watcher._id === watcherId);

    const confirmModal = $modal.open({
      template: confirmMessage,
      controller: 'ConfirmMessageController',
      size: 'sm'
    });

    confirmModal.result.then((response) => {
      if (response === 'yes') {
        return $http.delete('../api/sentinl/watcher/' + $scope.watchers[index]._id)
        .then((resp) => {
          $timeout(() => {
            $route.reload();
            $scope.notify.warning('SENTINL Watcher successfully deleted!');
          }, 1000);
        }).catch((error) => {
          if (Number.isInteger(index)) {
            $scope.watchers.splice(index, 1);
          } else {
            $scope.notify.error(error);
          }
        });
      }
    });
  };

  $scope.wizardSave = function () {
    $scope.$broadcast('sentinlWatchers:save');
  };

  $scope.$on('watcherWizard:save_confirmed', (event, wizard) => {
    const index = $scope.watchers.findIndex((watcher) => watcher._id === wizard.id);

    // the two-way binding doesn't sync the watcher if you create a child object inside
    // but but syncs if you change a property value
    // related issue: https://github.com/sirensolutions/sentinl-private/issues/216
    if (wizard.watcher) {
      $scope.watchers[index] = wizard.watcher;
    }
    if (!wizard.collapse) {
      $scope.watcherSave(index);
    }
  });

  $scope.toggleWatcher = function (watcherId) {
    const index = $scope.watchers.findIndex((watcher) => watcher._id === watcherId);
    $scope.watchers[index]._source.disable = !$scope.watchers[index]._source.disable;
    $scope.watcherSave(index);
  };

  $scope.watcherSave = function ($index, callFromWatcherEditorForm = false) {
    let watcher;
    if ($scope.editor && !callFromWatcherEditorForm) {
      watcher = angular.fromJson($scope.editor.getValue());
    } else {
      watcher = $scope.watchers[$index];
    }

    console.log('saving object:', watcher);
    return $http.post(`../api/sentinl/watcher/${watcher._id}`, watcher)
    .then(
      () => {
        $timeout(() => {
          $route.reload();
          $scope.notify.warning('SENTINL Watcher successfully saved!');
        }, 1000);
      },
      $scope.notify.error
    );
  };

  /* New Entry */
  $scope.watcherNew = function (newwatcher) {
    if (!newwatcher) {
      var wid = 'new_watcher_' + Math.random().toString(36).substr(2, 9);
      newwatcher = {
        _index: 'watcher',
        _type: 'watch',
        _id: wid,
        _new: 'true',
        _source: {
          title: 'watcher_title',
          disable: false,
          uuid: wid,
          trigger: {
            schedule: {
              later: 'every 5 minutes'
            }
          },
          input: {
            search: {
              request: {
                index: [],
                body: {},
              }
            }
          },
          condition: {
            script: {
              script: 'payload.hits.total > 100'
            }
          },
          transform: {
            script: {
              script: ''
            }
          },
          actions: {
            email_admin: {
              throttle_period: '15m',
              email: {
                to: 'alarm@localhost',
                from: 'sentinl@localhost',
                subject: 'Sentinl Alarm',
                priority: 'high',
                body: 'Found {{payload.hits.total}} Events'
              }
            }
          }
        }
      };
    }
    $scope.watchers.unshift(newwatcher);
  };
  $scope.reporterNew = function (newwatcher) {
    if (!newwatcher) {
      var wid = 'reporter_' + Math.random().toString(36).substr(2, 9);
      newwatcher = {
        _index: 'watcher',
        _type: 'watch',
        _id: wid,
        _new: 'true',
        _source: {
          title: 'reporter_title',
          disable: false,
          uuid: wid,
          trigger: {
            schedule: {
              later: 'every 1 hour'
            }
          },
          condition: {
            script: {
              script: ''
            }
          },
          transform: {
            script: {
              script: ''
            }
          },
          report : true,
          actions: {
            report_admin: {
              throttle_period: '15m',
              report: {
                to: 'report@localhost',
                from: 'sentinl@localhost',
                subject: 'Sentinl Report',
                priority: 'high',
                body: 'Sample Sentinl Screenshot Report',
                save: true,
                snapshot : {
                  res : '1280x900',
                  url : 'http://127.0.0.1/app/kibana#/dashboard/Alerts',
                  path : '/tmp/',
                  params : {
                    username : 'username',
                    password : 'password',
                    delay : 5000,
                    crop : false
                  }
                }
              }
            }
          }
        }
      };
    }
    $scope.watchers.unshift(newwatcher);
  };

  var currentTime = moment($route.current.locals.currentTime);
  $scope.currentTime = currentTime.format('HH:mm:ss');
  var utcTime = moment.utc($route.current.locals.currentTime);
  $scope.utcTime = utcTime.format('HH:mm:ss');
  var unsubscribe = $interval(function () {
    $scope.currentTime = currentTime.add(1, 'second').format('HH:mm:ss');
    $scope.utcTime = utcTime.add(1, 'second').format('HH:mm:ss');
  }, 1000);
  $scope.$watch('$destroy', unsubscribe);

});
