import _ from 'lodash';
import moment from 'moment';
import chrome from 'ui/chrome';
import $ from 'jquery';
import ace from 'ace';
import Notifier from 'ui/notify/notifier';

import confirmMessage from '../templates/confirm-message.html';
const impactLogo = require('plugins/sentinl/sentinl-white-logo.svg');
const smallLogo = require('plugins/sentinl/sentinl.svg');

import { app } from '../app.module';

// WATCHERS CONTROLLER
app.controller('sentinlWatchers', function ($rootScope, $scope, $route, $interval,
  $timeout, timefilter, Private, Notifier, $window, $http, $modal, $log, NavMenu, globalNavState) {

  $scope.title = 'Sentinl: Watchers';
  $scope.description = 'Kibana Alert App for Elasticsearch';

  $scope.notify = new Notifier();

  $scope.topNavMenu = NavMenu.getTopNav('watchers');
  $scope.tabsMenu = NavMenu.getTabs();

  timefilter.enabled = false;
  $scope.watchers = [];

  const setLogo = function () {
    if (globalNavState.isOpen()) {
      chrome.setBrand({
        logo: `url(${impactLogo}) left no-repeat`,
      })
      .setNavBackground('#222222');
    } else {
      chrome.setBrand({
        logo: `url(${smallLogo}) left no-repeat`
      })
      .setNavBackground('#222222');
    }
  };

  setLogo();

  $scope.$on('globalNavState:change', () => {
    setLogo();
  });

  function importWatcherFromLocalStorage() {
    /* New Entry from Saved Kibana Query */
    if ($window.localStorage.getItem('sentinl_saved_query')) {
      $scope.watcherNew(JSON.parse($window.localStorage.getItem('sentinl_saved_query')));
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

  /* ACE Editor */
  $scope.editor;
  $scope.editor_status = { readonly: false, undo: false, new: false };
  $scope.setAce = function ($index, edit) {
    $scope.editor = ace.edit('editor-' + $index);
    var _session = $scope.editor.getSession();
    $scope.editor.setReadOnly(edit);
    $scope.editor_status.readonly = edit;
    _session.setUndoManager(new ace.UndoManager());

    $scope.editor_status.undo = $scope.editor.session.getUndoManager().isClean();

    if (!edit) { $scope.editor.getSession().setMode('ace/mode/json'); }
    else { $scope.editor.getSession().setMode('ace/mode/text'); }
  };

  $scope.watcherDelete = function ($index) {
    const confirmModal = $modal.open({
      template: confirmMessage,
      controller: 'ConfirmMessageController',
      size: 'sm'
    });

    confirmModal.result.then((response) => {
      if (response === 'yes') {
        return $http.delete('../api/sentinl/watcher/' + $scope.watchers[$index]._id)
        .then(
          (resp) => {
            $timeout(function () {
              $route.reload();
              $scope.notify.warning('SENTINL Watcher successfully deleted!');
            }, 1000);
          },
          $scope.notify.error
        );
      }
    });
  };

  $scope.wizardSave = function ($index) {
    $scope.$broadcast('wizardSave', $index);
  };

  $scope.$on('wizardSaveConfirm', (event, wizard) => {
    if (wizard.watcher) {
      $scope.watchers[wizard.index] = wizard.watcher;
    }
    if (!wizard.collapse) {
      $scope.watcherSave(wizard.index);
    }
  });

  $scope.toggleWatcher = function (index) {
    $scope.watchers[index]._source.disable = !$scope.watchers[index]._source.disable;
    $scope.watcherSave(index);
  };

  $scope.watcherSave = function ($index, callFromWatcherEditorForm = false) {
    let watcher;
    if ($scope.editor && !callFromWatcherEditorForm) {
      watcher = JSON.parse($scope.editor.getValue());
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

  $scope.getWatchers = function () {
    return $scope.watchers;
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
