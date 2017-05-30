/* global angular */
import _ from 'lodash';
import Notifier from 'ui/notify/notifier';
import confirmMessage from '../../templates/confirm-message.html';
import watcherEmailAction from './watcher-wizard.html';

import { app } from '../../app.module';

app.directive('watcherWizard', function ($modal, $route, $log, $http, $timeout, Notifier) {
  function wizardDirective($scope, element, attrs) {

    $scope.notify = new Notifier();

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
        types: [ 'webhook', 'email', 'email_html', 'report', 'slack', 'console' ]
      },
      rawEnabled: false
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
      _.forOwn($scope.watcher._source.actions, (settings, name) => { settings.$$title = name; });
    };


    const initSchedule = function () {
      $scope.watcher._source.$$schedule = {
        hours: 0,
        mins: 0,
        secs: 0
      };
      _.each($scope.watcher._source.trigger.schedule.later.split(','), (period) => {
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

      _.forOwn($scope.watcher._source.actions, (action) => {
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
      _.forOwn($scope.watcher._source.$$schedule, (value, key) => {
        if (value) {
          schedule.push(`every ${value} ${key}`);
        }
      });
      $scope.watcher._source.trigger.schedule.later = schedule.join(', ');
      delete $scope.watcher._source.$$schedule;
    };


    const saveThrottle = function () {
      _.forOwn($scope.watcher._source.actions, (action) => {
        _.forOwn(action.$$throttle, (value, key) => {
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
        .catch($scope.notify.error);
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
      .catch($scope.notify.error);
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
      const confirmModal = $modal.open({
        template: confirmMessage,
        controller: 'ConfirmMessageController',
        size: 'sm'
      });

      confirmModal.result.then((response) => {
        if (response === 'yes') {
          delete $scope.watcher._source.actions[actionName];
        }
      }, () => {
        $log.info(`You choose not deleting the action "${actionName}"`);
      });
    };


    $scope.addAction = function () {
      $scope.form.actions.new.edit = !$scope.form.actions.new.edit;
    };


    $scope.editAction = function (actionName, actionSettings) {
      // toggle edit for the selected action
      _.each($scope.form.actions.types, (type) => {
        if (_.has(actionSettings, type)) {
          actionSettings[type].$$edit = !actionSettings[type].$$edit;
        }
      });

      // edit one action at a time
      // close all other actions
      _.forOwn($scope.watcher._source.actions, (settings, name) => {
        _.each($scope.form.actions.types, (type) => {
          if (_.has(settings, type)) {
            if (name !== actionName) settings[type].$$edit = false;
          }
        });
      });
    };


    const renameActions = function (actions) {
      const newActions = {};
      _.forOwn(actions, (settings, name) => {
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

      _.forOwn($scope.watcher._source.actions, (settings, name) => {
        _.each($scope.form.actions.types, (type) => {
          if (_.has(settings, type)) {
            delete settings[type].$$edit;
          }

          if (type === 'webhook' && _.has(settings, type)) {
            if (settings[type]._headers) {
              settings[type].headers = angular.fromJson(settings[type]._headers);
              delete settings[type]._headers;
            }
            delete settings[type].$$proxy;
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
        }).catch($scope.notify.error);
      });
    };


    const initRaw = function () {
      $scope.watcher.$$raw = angular.toJson($scope.watcher, 'pretty');
    };


    const init = function () {
      try {
        initScripts();
      } catch (e) {
        $scope.notify.error(`Fail to initialize scripts: ${e}`);
      }

      try {
        initRaw();
      } catch (e) {
        $scope.notify.error(`Fail to initialize raw settings: ${e}`);
      }

      try {
        initActionTitles();
      } catch (e) {
        $scope.notify.error(`Fail to initialize actions: ${e}`);
      }

      try {
        initSchedule();
      } catch (e) {
        $scope.notify.error(`Fail to initialize schedule: ${e}`);
      }

      try {
        initThrottlePeriods();
      } catch (e) {
        $scope.notify.error(`Fail to initialize throttle periods: ${e}`);
      }
    };


    const saveWizard = function () {
      $scope.watcherForm.$valid = true;
      $scope.watcherForm.$invalid = false;

      if ($scope.form.rawEnabled) {
        try {
          // All settings will have been overwritten if enable is checked and the watcher is saved.
          $scope.watcher = angular.fromJson($scope.watcher.$$raw);
        } catch (e) {
          $scope.notify.error(`Invalid Raw configuration: ${e}`);
          $scope.watcherForm.$valid = false;
          $scope.watcherForm.$invalid = true;
        }

        if ($scope.watcherForm.$valid) {
          $scope.form.saved = true;
        }

        return;
      }

      if ($scope.watcherForm.$valid) {
        try {
          saveSchedule();
        } catch (e) {
          $scope.notify.error(`Invalid schedule configuration: ${e}`);
          $scope.watcherForm.$valid = false;
          $scope.watcherForm.$invalid = true;
        }

        try {
          saveThrottle();
        } catch (e) {
          $scope.notify.error(`Invalid throttle configuration: ${e}`);
          $scope.watcherForm.$valid = false;
          $scope.watcherForm.$invalid = true;
        }

        try {
          saveEditorsText();
        } catch (e) {
          $scope.notify.error(`Invalid action, Transform or Condition configuration: ${e}`);
          $scope.watcherForm.$valid = false;
          $scope.watcherForm.$invalid = true;
        }

        try {
          $scope.watcher._source.actions = renameActions($scope.watcher._source.actions);
        } catch (e) {
          $scope.notify.error(`Fail to rename action: ${e}`);
          $scope.watcherForm.$valid = false;
          $scope.watcherForm.$invalid = true;
        }

      }

      if ($scope.watcherForm.$valid) {
        $scope.form.saved = true;
      }
    };


    $scope.$on('$destroy', () => {
      if (!$scope.form.saved) {
        const data = {
          id: $scope.watcher._id,
          watcher: angular.fromJson($scope.watcher.$$raw),
          collapse: true
        };
        $scope.$emit('watcherWizard:save_confirmed', data);
      }
    });


    $scope.$on('sentinlWatchers:save', (event) => {
      saveWizard();

      if ($scope.watcherForm.$valid) {
        const data = {
          id: $scope.watcher._id,
          watcher: $scope.form.rawEnabled ? $scope.watcher : null
        };

        $scope.$emit('watcherWizard:save_confirmed', data);
      } else {
        $scope.notify.warning('Watcher settings are invalid.');
      }
    });


    init();
  }

  return {
    restrict: 'E',
    template: watcherEmailAction,
    scope: {
      watcher: '='
    },
    link: wizardDirective
  };
});
