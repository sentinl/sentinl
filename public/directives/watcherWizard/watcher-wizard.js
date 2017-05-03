import uiModules from 'ui/modules';
import _ from 'lodash';
import confirmMessage from '../../templates/confirm-message.html';
import watcherEmailAction from './watcher-wizard.html';

uiModules
.get('api/sentinl', [])
.directive('watcherWizard', function ($modal, $route, $log, $http, $timeout, Notifier) {
  function wizardDirective($scope, element, attrs) {

    $scope.notify = new Notifier();

    $scope.watcher.$json = JSON.stringify($scope.watcher, null, 2);

    $scope.form = {
      status: !$scope.watcher._source.disable ? 'Enabled' : 'Disable',
      actions: {
        new: {
          edit: false
        },
        types: [ 'webhook', 'email', 'email_html', 'report', 'slack', 'console' ]
      }
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
        onLoad: function (_editor) {
          _editor.$blockScrolling = Infinity;
        }
      };
    };

    const initActionTitles = function () {
      _.forOwn($scope.watcher._source.actions, (settings, name) => { settings._title = name; });
    };

    const initSchedule = function () {
      $scope.watcher._source._schedule = {
        hours: 0,
        mins: 0,
        secs: 0
      };
      _.each($scope.watcher._source.trigger.schedule.later.split(','), (period) => {
        if (period.match(/hour/i)) {
          $scope.watcher._source._schedule.hours = +_.trim(period).split(' ')[1];
        }
        if (period.match(/min/i)) {
          $scope.watcher._source._schedule.mins = +_.trim(period).split(' ')[1];
        }
        if (period.match(/sec/i)) {
          $scope.watcher._source._schedule.secs = +_.trim(period).split(' ')[1];
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

      _.forOwn($scope.watcher._source.actions, (actions) => {
        actions._throttle = {
          hours: getHours(actions.throttle_period),
          mins: getMins(actions.throttle_period),
          secs: getSecs(actions.throttle_period)
        };
      });
    };

    const saveSchedule = function () {
      let schedule = [];
      _.forOwn($scope.watcher._source._schedule, (value, key) => {
        if (value) {
          schedule.push(`every ${value} ${key}`);
        }
      });
      $scope.watcher._source.trigger.schedule.later = schedule.join(', ');
      delete $scope.watcher._source._schedule;
    };

    const saveThrottle = function () {
      _.forOwn($scope.watcher._source.actions, (action) => {
        _.forOwn(action._throttle, (value, key) => {
          if (!value) action._throttle[key] = 0;
        });
        action.throttle_period = `${action._throttle.hours}h${action._throttle.mins}m${action._throttle.secs}s`;
        delete action._throttle;
      });
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
        size: 'sm',
        resolve: {
          action: function () {
            return actionName;
          }
        }
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
          actionSettings[type]._edit = !actionSettings[type]._edit;
        }
      });

      // edit one action at a time
      // close all other actions
      _.forOwn($scope.watcher._source.actions, (settings, name) => {
        _.each($scope.form.actions.types, (type) => {
          if (_.has(settings, type)) {
            if (name !== actionName) settings[type]._edit = false;
          }
        });
      });
    };

    const renameActions = function (actions) {
      const newActions = {};
      _.forOwn(actions, (settings, name) => {
        newActions[settings._title] = settings;
        delete newActions[settings._title]._title;
      });
      return newActions;
    };

    const saveEditorsText = function () {

      _.each(['_input', '_condition', '_transform'], (field) => {
        if (_.has($scope.watcher._source, field)) {
          if ($scope.watcher._source[field]) {
            if (field === '_input') {
              $scope.watcher._source[field.substring(1)] = JSON.parse($scope.watcher._source[field]);
            } else {
              $scope.watcher._source[field.substring(1)].script.script = $scope.watcher._source[field];
            }
          }
          delete $scope.watcher._source[field];
        }
      });

      _.forOwn($scope.watcher._source.actions, (settings, name) => {
        _.each($scope.form.actions.types, (type) => {
          if (_.has(settings, type)) {
            delete settings[type]._edit;
          }

          if (type === 'webhook' && _.has(settings, type)) {
            if (settings[type]._headers) {
              settings[type].headers = JSON.parse(settings[type]._headers);
              delete settings[type]._headers;
            }
            delete settings[type]._proxy;
          }
        });
      });

    };

    const init = function () {
      initActionTitles();
      initSchedule();
      initThrottlePeriods();
      $scope.watcher._source._input = JSON.stringify($scope.watcher._source.input, null, 2);
      $scope.watcher._source._transform = $scope.watcher._source.transform.script.script;
      $scope.watcher._source._condition = $scope.watcher._source.condition.script.script;
    };

    const save = function () {
      try {
        if ($scope.watcher._source._input && $scope.watcher._source._input.length) {
          JSON.parse($scope.watcher._source._input);
        }
      } catch (e) {
        $scope.notify.error(e);
        $scope.watcherForm.$valid = false;
        $scope.watcherForm.$invalid = true;
      }

      if ($scope.watcherForm.$valid) {
        saveSchedule();
        saveThrottle();
        saveEditorsText();
        $scope.watcher._source.actions = renameActions($scope.watcher._source.actions);
      }
    };

    $scope.$on('wizardSave', (event, index) => {
      if (+index === +$scope.index) {
        save();
        $scope.$emit('wizardSaveConfirm', index);
      }
    });

    init();
  }

  return {
    restrict: 'E',
    template: watcherEmailAction,
    scope: {
      watcher: '=',
      index: '='
    },
    link: wizardDirective
  };
});
