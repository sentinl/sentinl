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
  globalNavState, $location, dataTransfer, sentinlService) {

  $scope.title = 'Sentinl: Watchers';
  $scope.description = 'Kibana Alert App for Elasticsearch';

  const notify = createNotifier({
    location: 'Sentinl Watchers'
  });

  $scope.topNavMenu = navMenu.getTopNav('watchers');
  $scope.tabsMenu = navMenu.getTabs();
  navMenu.setKbnLogo(globalNavState.isOpen());
  $scope.$on('globalNavState:change', () => navMenu.setKbnLogo(globalNavState.isOpen()));

  timefilter.enabled = false;
  $scope.watchers = [];


  $scope.startWizard = function (watcher) {
    let path = '/wizard';

    if (_.isObject(watcher)) {
      dataTransfer.setWatcher(watcher);
    } else {
      path += `/${watcher}`;
    }

    $location.path(path);
  };


  const importWatcherFromLocalStorage = function () {
    /* New Entry from Saved Kibana Query */
    if ($window.localStorage.getItem('sentinl_saved_query')) {
      const spyPanelWatcher = angular.fromJson($window.localStorage.getItem('sentinl_saved_query'));
      $window.localStorage.removeItem('sentinl_saved_query');
      $scope.startWizard(spyPanelWatcher);
    }
  };

  const listWatchers = function () {
    sentinlService.listWatchers()
    .then((response) => {
      $scope.watchers = response.data.hits.hits;
      importWatcherFromLocalStorage();
    })
    .catch((error) => {
      notify.error(error);
      importWatcherFromLocalStorage();
    });
  };

  listWatchers();


  $scope.watcherDelete = function (watcherId) {
    const index = $scope.watchers.findIndex((watcher) => watcher._id === watcherId);

    const confirmModal = $uibModal.open({
      template: confirmMessage,
      controller: 'ConfirmMessageController',
      size: 'sm'
    });

    confirmModal.result.then((response) => {
      if (response === 'yes') {
        return sentinlService.deleteWatcher($scope.watchers[index]._id).then((resp) => {
          $timeout(() => {
            listWatchers();
            notify.info('Watcher successfully deleted!');
          }, 1000);
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


  const watcherSave = function ($index, callFromWatcherEditorForm = false) {
    let watcher;
    if ($scope.editor && !callFromWatcherEditorForm) {
      watcher = angular.fromJson($scope.editor.getValue());
    } else {
      watcher = $scope.watchers[$index];
    }

    console.log('saving object:', watcher);
    return sentinlService.saveWatcher(watcher).then(() => {
      $timeout(() => {
        listWatchers();
        notify.info('Watcher enabled!');
      }, 1000);
    }).catch(notify.error);
  };


  $scope.toggleWatcher = function (watcherId) {
    const index = $scope.watchers.findIndex((watcher) => watcher._id === watcherId);
    $scope.watchers[index]._source.disable = !$scope.watchers[index]._source.disable;
    watcherSave(index);
  };


  /* New Entry */
  $scope.watcherNew = function (newwatcher) {
    if (!newwatcher) {
      const wid = 'new_watcher_' + Math.random().toString(36).substr(2, 9);
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
    $scope.startWizard(newwatcher);
  };


  $scope.reporterNew = function (newwatcher) {
    if (!newwatcher) {
      const wid = 'reporter_' + Math.random().toString(36).substr(2, 9);
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
    $scope.startWizard(newwatcher);
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
