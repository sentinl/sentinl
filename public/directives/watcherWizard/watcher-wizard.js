import uiModules from 'ui/modules';
import Notifier from 'ui/notify/notifier';
import _ from 'lodash';
import confirmMessage from '../../templates/confirm-message.html';
import watcherEmailAction from './watcher-wizard.html';


uiModules
.get('api/sentinl', [])
.directive('watcherWizard', function ($modal, $route, $log, $http, $timeout, Notifier) {
  function wizardDirective($scope, element, attrs) {

    $scope.notify = new Notifier();

    $scope.form = {
      status: !$scope.watcher._source.disable ? 'Enabled' : 'Disable',
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
      raw_enabled: false
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


    $scope.isEmpty = function (obj) {
      return _.isEmpty(obj);
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
          title: $scope.watcher.$scripts[type].title,
          body: $scope.watcher.$scripts[type].body
        };
        $http.post(`../api/sentinl/save/one_script/${type}/${id}`, $scope.form.scripts[type][id]).catch($scope.notify.error);
      }
    };


    $scope.selectScript = function (type, id) {
      $scope.watcher.$scripts[type] = {
        id: id,
        title: $scope.form.scripts[type][id].title,
        body: $scope.form.scripts[type][id].body
      };
    };


    $scope.removeScript = function (type) {
      const id = $scope.watcher.$scripts[type].id;
      $http.delete(`../api/sentinl/remove/one_script/${type}/${id}`).catch($scope.notify.error);
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
      _.forEach($scope.watcher.$scripts, (script, field) => {
        if ($scope.watcher._source[field]) {
          if (field === 'input') {
            $scope.watcher._source[field] = JSON.parse(script.body);
          } else {
            $scope.watcher._source[field].script.script = script.body;
          }
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

    const initScripts = function () {
      $scope.watcher.$scripts = {};
      _.forEach($scope.form.scripts, (script, field) => {
        let value = field === 'input' ? $scope.watcher._source.input : $scope.watcher._source[field].script.script;

        $scope.watcher.$scripts[field] = {
          id: null,
          title: null,
          body: field === 'input' ? JSON.stringify(value, null, 2) : value
        };

        $http.get(`../api/sentinl/get/scripts/${field}`).then((resp) => {
          _.forEach(resp.data.hits.hits, (script) => {
            $scope.form.scripts[field][script._id] = script._source;
          });
        }).catch($scope.notify.error);
      });
    };

    const init = function () {
      $scope.watcher.$raw = JSON.stringify($scope.watcher, null, 2);
      initScripts();
      initActionTitles();
      initSchedule();
      initThrottlePeriods();
    };


    const save = function () {
      $scope.form.errors = [];

      if ($scope.form.raw_enabled) {
        try {
          // All settings will have been overwritten if enable is checked and the watcher is saved.
          $scope.watcher = JSON.parse($scope.watcher.$raw);
        } catch (e) {
          $scope.form.errors.push(`Raw settings: ${e}`);
          $scope.watcherForm.$valid = false;
          $scope.watcherForm.$invalid = true;
        }
        return;
      }

      try {
        if ($scope.watcher._source._input && $scope.watcher._source._input.length) {
          JSON.parse($scope.watcher._source._input);
        }
      } catch (e) {
        $scope.form.errors.push(`Input settings: ${e}`);
        $scope.watcherForm.$valid = false;
        $scope.watcherForm.$invalid = true;
      }

      if ($scope.watcherForm.$valid) {
        saveSchedule();
        saveThrottle();
        saveEditorsText();
        $scope.watcher._source.actions = renameActions($scope.watcher._source.actions);
        $scope.form.saved = true;
      }
    };


    $scope.$on('$destroy', () => {
      if (!$scope.form.saved) {
        const data = {
          index: $scope.index,
          watcher: JSON.parse($scope.watcher.$raw),
          collapse: true
        };
        $scope.$emit('wizardSaveConfirm', data);
      }
    });


    $scope.$on('wizardSave', (event, index) => {
      if (+index === +$scope.index) {
        save();

        if ($scope.watcherForm.$valid) {
          const data = {
            index: index
          };
          if ($scope.form.raw_enabled) {
            data.watcher = $scope.watcher;
          }
          $scope.$emit('wizardSaveConfirm', data);
        }
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
