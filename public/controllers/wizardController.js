/* global angular */
import _ from 'lodash';
import confirmMessage from '../templates/confirm-message.html';

import { app } from '../app.module';
import WatcherHelper from '../classes/WatcherHelper';

// WIZARD CONTROLLER
app.controller('WizardController', function ($rootScope, $scope, $route, $interval,
  $timeout, timefilter, Private, createNotifier, $window, $http, $uibModal,
  $log, navMenu, globalNavState, $routeParams, sentinlService, dataTransfer, $location) {

  $scope.topNavMenu = navMenu.getTopNav('wizard');
  $scope.tabsMenu = navMenu.getTabs('wizard', [{ name: 'Wizard', url: '#/wizard' }]);
  navMenu.setKbnLogo(globalNavState.isOpen());
  $scope.$on('globalNavState:change', () => navMenu.setKbnLogo(globalNavState.isOpen()));

  const notify = createNotifier({
    location: 'Sentinl Wizard'
  });

  // Init wizard form
  const initWizard = function () {
    const wHelper = new WatcherHelper();

    $scope.form = {
      status: !$scope.watcher._source.disable ? 'Enabled' : 'Disable',
      messages: {
        success: null,
        danger: null,
        timeout: 3000
      },
      scripts: {
        transform: {},
        input: {},
        condition: {}
      },
      actions: {
        new: {
          edit: false
        },
        types: [ 'webhook', 'email', 'email_html', 'report', 'slack', 'console' ],
        status: {}
      },
      rawEnabled: false,
      tabs: {
        input: { disable: false },
        condition: { disable: false },
        transform: { disable: false }
      }
    };


    $scope.actionOfType = function (action, type) {
      return _.has(action, type);
    };


    $scope.actionsExist = function (actions) {
      return _.keys(actions).length;
    };


    $scope.aceOptions = function (mode, lines = 10) {
      return {
        mode: mode,
        useWrapMode : true,
        showGutter: true,
        rendererOptions: {
          maxLines: lines,
          minLines: 5
        },
        editorOptions: {
          autoScrollEditorIntoView: false
        },
        onLoad: function ($$editor) {
          $$editor.$blockScrolling = Infinity;
        }
      };
    };

    const initActionTitles = function () {
      _.forEach($scope.watcher._source.actions, (settings, name) => { settings.$$title = name; });
    };


    const initSchedule = function () {
      $scope.watcher._source.$$schedule = {
        hours: 0,
        mins: 0,
        secs: 0
      };
      _.forEach($scope.watcher._source.trigger.schedule.later.split(','), (period) => {
        if (period.match(/hour/i)) {
          $scope.watcher._source.$$schedule.hours = +_.trim(period).split(' ')[1];
        }
        if (period.match(/min/i)) {
          $scope.watcher._source.$$schedule.mins = +_.trim(period).split(' ')[1];
        }
        if (period.match(/sec/i)) {
          $scope.watcher._source.$$schedule.secs = +_.trim(period).split(' ')[1];
        }
      });
    };


    const initThrottlePeriods = function () {
      const getHours = function (str) {
        return str.match(/([0-9]?[0-9])h/i) ? +str.match(/([0-9]?[0-9])h/i)[1] : 0;
      };
      const getMins = function (str) {
        return str.match(/([0-9]?[0-9])m/i) ? +str.match(/([0-9]?[0-9])m/i)[1] : 0;
      };
      const getSecs = function (str) {
        return str.match(/([0-9]?[0-9])s/i) ? +str.match(/([0-9]?[0-9])s/i)[1] : 0;
      };

      _.forEach($scope.watcher._source.actions, (action) => {
        if (!action.throttle_period) {
          action.throttle_period = '30s';
        }
        action.$$throttle = {
          hours: getHours(action.throttle_period),
          mins: getMins(action.throttle_period),
          secs: getSecs(action.throttle_period)
        };
      });
    };


    const saveSchedule = function () {
      let schedule = [];
      _.forEach($scope.watcher._source.$$schedule, (value, key) => {
        if (value) {
          schedule.push(`every ${value} ${key}`);
        }
      });
      $scope.watcher._source.trigger.schedule.later = schedule.join(', ');
      delete $scope.watcher._source.$$schedule;
    };


    const saveThrottle = function () {
      _.forEach($scope.watcher._source.actions, (action) => {
        _.forEach(action.$$throttle, (value, key) => {
          if (!value) action.$$throttle[key] = 0;
        });
        action.throttle_period = `${action.$$throttle.hours}h${action.$$throttle.mins}m${action.$$throttle.secs}s`;
        delete action.$$throttle;
      });
    };


    $scope.isEmpty = function (obj) {
      return _.isEmpty(obj);
    };


    const displayFormMsg = function (type, msg) {
      $scope.form.messages.success = null;
      $scope.form.messages.danger = null;

      if (type === 'success') {
        $scope.form.messages.success = msg;
      } else if (type === 'danger') {
        $scope.form.messages.danger = msg;
      }

      $timeout(() => {
        $scope.form.messages.success = null;
        $scope.form.messages.danger = null;
      }, $scope.form.messages.timeout);
    };


    $scope.saveScript = function (type) {
      const title = `${type}Title`;

      if ($scope.watcherForm[title].$viewValue && $scope.watcherForm[title].$viewValue.length) {
        $scope.watcherForm[title].$valid = true;
        $scope.watcherForm[title].$invalid = false;
      } else {
        $scope.watcherForm[title].$valid = false;
        $scope.watcherForm[title].$invalid = true;
      }

      if ($scope.watcherForm[title].$valid) {
        const id = Math.random().toString(36).slice(2);
        $scope.form.scripts[type][id] = {
          title: $scope.watcher.$$scripts[type].title,
          body: $scope.watcher.$$scripts[type].body
        };
        $http.post(`../api/sentinl/save/one_script/${type}/${id}`, $scope.form.scripts[type][id])
        .then((msg) => {
          if (msg.data.ok) {
            displayFormMsg('success', 'Script saved!');
          } else {
            displayFormMsg('danger', 'Fail to save the script!');
          }
        })
        .catch(notify.error);
      }
    };


    $scope.selectScript = function (type, id) {
      $scope.watcher.$$scripts[type] = {
        id: id,
        title: $scope.form.scripts[type][id].title,
        body: $scope.form.scripts[type][id].body
      };
    };


    $scope.removeScript = function (type) {
      const id = $scope.watcher.$$scripts[type].id;
      $http.delete(`../api/sentinl/remove/one_script/${type}/${id}`)
      .then((msg) => {
        if (msg.data.ok) {
          displayFormMsg('success', 'Script deleted!');
        } else {
          displayFormMsg('danger', 'Fail to delete the script!');
        }
      })
      .catch(notify.error);
      delete $scope.form.scripts[type][id];
    };


    $scope.toggleWatcher = function () {
      if (!$scope.watcher._source.disable) {
        $scope.form.status = 'Enabled';
        $scope.watcher._source.disable = false;
      } else {
        $scope.form.status = 'Disabled';
        $scope.watcher._source.disable = true;
      }
    };


    $scope.removeAction = function (actionName) {
      const confirmModal = $uibModal.open({
        template: confirmMessage,
        controller: 'ConfirmMessageController',
        size: 'sm'
      });

      confirmModal.result.then((response) => {
        if (response === 'yes') {
          delete $scope.watcher._source.actions[actionName];

          if ($scope.watcher._source.report && !wHelper.numOfActionTypes($scope.watcher, 'report')) {
            delete $scope.watcher._source.report;
          }
        }
      }, () => {
        $log.info(`You choose not deleting the action "${actionName}"`);
      });
    };


    const renameActions = function (actions) {
      const newActions = {};
      _.forEach(actions, (settings, name) => {
        newActions[settings.$$title] = settings;
        delete newActions[settings.$$title].$$title;
      });
      return newActions;
    };


    const saveEditorsText = function () {
      _.forEach($scope.watcher.$$scripts, (script, field) => {
        if (script.body && script.body.length) {
          if (field === 'input') {
            $scope.watcher._source[field] = angular.fromJson(script.body);
          } else {
            $scope.watcher._source[field].script.script = script.body;
          }
        }
      });

      _.forEach($scope.watcher._source.actions, (settings, name) => {
        _.forEach($scope.form.actions.types, (type) => {
          if (_.has(settings, type)) {
            delete settings[type].$$edit;
          }

          if (type === 'webhook' && _.has(settings, type)) {
            if (settings[type]._headers && settings[type]._headers.length) {
              settings[type].headers = angular.fromJson(settings[type]._headers);
            } else {
              delete settings[type].headers;
            }
            delete settings[type]._headers;
          }
        });
      });
    };


    const initScripts = function () {
      $scope.watcher.$$scripts = {};

      _.forEach($scope.form.scripts, (script, field) => {
        // for migration purposes
        // add some fields if they don't exist in old watcher which was created under Sentinl v4
        if (field !== 'input' && !_.has($scope.watcher._source[field], 'script.script')) {
          $scope.watcher._source[field] = { script: { script: '' } };
        }
        if (!$scope.watcher._source.input) {
          $scope.watcher._source.input = {};
        }

        let value = field === 'input' ? $scope.watcher._source.input : $scope.watcher._source[field].script.script;

        $scope.watcher.$$scripts[field] = {
          id: null,
          title: null,
          body: field === 'input' ? angular.toJson(value, 'pretty') : value
        };

        $http.get(`../api/sentinl/get/scripts/${field}`).then((resp) => {
          _.forEach(resp.data.hits.hits, (script) => {
            $scope.form.scripts[field][script._id] = script._source;
          });
        }).catch(notify.error);
      });
    };


    // Disable tabs (Input, Condition and Transform) if there are only report actions
    const initTabs = function () {
      const actionTypes = {};
      _.forEach($scope.watcher._source.actions, (settings, name) => {
        _.forEach($scope.form.actions.types, (type) => {
          if (settings[type]) actionTypes[type] = true;
        });
      });

      if (_.keys(actionTypes).length === 1 && _.keys(actionTypes)[0] === 'report') {
        _.forEach($scope.form.tabs, (tab) => { tab.disable = true; });
      } else {
        _.forEach($scope.form.tabs, (tab) => { tab.disable = false; });
      }
    };


    const initRaw = function () {
      $scope.watcher.$$raw = angular.toJson($scope.watcher, 'pretty');
    };


    const init = function () {
      try {
        initTabs();
      } catch (e) {
        notify.error(`Fail to initialize wizard tabs: ${e}`);
      }

      try {
        initScripts();
      } catch (e) {
        notify.error(`Fail to initialize scripts: ${e}`);
      }

      try {
        initRaw();
      } catch (e) {
        notify.error(`Fail to initialize raw settings: ${e}`);
      }

      try {
        initActionTitles();
      } catch (e) {
        notify.error(`Fail to initialize actions: ${e}`);
      }

      try {
        initSchedule();
      } catch (e) {
        notify.error(`Fail to initialize schedule: ${e}`);
      }

      try {
        initThrottlePeriods();
      } catch (e) {
        notify.error(`Fail to initialize throttle periods: ${e}`);
      }
    };


    const saveWizard = function () {
      const saveTimeout = 1000;
      $scope.watcherForm.$valid = true;
      $scope.watcherForm.$invalid = false;

      if ($scope.form.rawEnabled) {
        try {
          // All settings will have been overwritten if enable is checked and the watcher is saved.
          $scope.watcher = angular.fromJson($scope.watcher.$$raw);
        } catch (e) {
          notify.error(`Invalid Raw configuration: ${e}`);
          $scope.watcherForm.$valid = false;
          $scope.watcherForm.$invalid = true;
        }

        if ($scope.watcherForm.$valid) {
          sentinlService.saveWatcher($scope.watcher)
          .then(() => $timeout(() => notify.warning('SENTINL Watcher successfully saved!'), saveTimeout))
          .catch(notify.error);
        }

        return;
      }

      if ($scope.watcherForm.$valid) {
        try {
          saveSchedule();
        } catch (e) {
          notify.error(`Invalid schedule configuration: ${e}`);
          $scope.watcherForm.$valid = false;
          $scope.watcherForm.$invalid = true;
        }

        try {
          saveThrottle();
        } catch (e) {
          notify.error(`Invalid throttle configuration: ${e}`);
          $scope.watcherForm.$valid = false;
          $scope.watcherForm.$invalid = true;
        }

        try {
          saveEditorsText();
        } catch (e) {
          notify.error(`Invalid action, Transform or Condition configuration: ${e}`);
          $scope.watcherForm.$valid = false;
          $scope.watcherForm.$invalid = true;
        }

        try {
          $scope.watcher._source.actions = renameActions($scope.watcher._source.actions);
        } catch (e) {
          notify.error(`Fail to rename action: ${e}`);
          $scope.watcherForm.$valid = false;
          $scope.watcherForm.$invalid = true;
        }

      }

      if ($scope.watcherForm.$valid) {
        sentinlService.saveWatcher($scope.watcher)
        .then(() => $timeout(() => notify.warning('SENTINL Watcher successfully saved!'), saveTimeout))
        .catch(notify.error);
      }
    };


    const cancelWizard = function () {
      $location.path('/');
    };


    $scope.$on('newAction:added', () => {
      try {
        initTabs();
      } catch (e) {
        notify.error(`Fail to initialize wizard tabs: ${e}`);
      }
    });


    $scope.$on('navMenu:cancelWizard', () => cancelWizard());
    $scope.$on('navMenu:saveWizard', () => {
      saveWizard();
      init();
    });


    // fill wizard form
    init();
  };


  // Get watcher
  $scope.watcher = {};

  if ($routeParams.watcherId && $routeParams.watcherId.length) { // edit existing watcher
    sentinlService.getWatcher($routeParams.watcherId).then((resp) => {
      $scope.watcher = resp.data.hits.hits[0];
      initWizard();
    });
  } else { // forwarded from dashboard spy panel
    $scope.watcher = dataTransfer.getWatcher();
    initWizard();
  }

});
