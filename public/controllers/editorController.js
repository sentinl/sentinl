/* global angular */
import _ from 'lodash';
import confirmMessage from '../templates/confirm-message.html';

import { app } from '../app.module';
import WatcherHelper from '../classes/WatcherHelper';

// EDITOR CONTROLLER
app.controller('EditorController', function ($rootScope, $scope, $route, $interval,
  $timeout, timefilter, Private, createNotifier, $window, $uibModal,
  $log, navMenu, globalNavState, $routeParams, dataTransfer, $location, Watcher, Script, User) {
  $scope.title = 'Sentinl: Editor';

  let editorMode = $location.$$path.slice(1); // modes: editor, wizard
  if (_.includes(editorMode, '/')) editorMode = editorMode.split('/')[0];
  const tabName = editorMode.slice(0, 1).toUpperCase() + editorMode.slice(1);

  $scope.topNavMenu = navMenu.getTopNav(editorMode);
  $scope.tabsMenu = navMenu.getTabs(editorMode, [{ name: tabName, url: `#/${editorMode}` }]);
  navMenu.setKbnLogo(globalNavState.isOpen());
  $scope.$on('globalNavState:change', () => navMenu.setKbnLogo(globalNavState.isOpen()));

  const notify = createNotifier({
    location: `Sentinl Watcher ${tabName}`
  });

  /**
  * Initializes watcher editor page.
  */
  const initEditor = function () {
    const wHelper = new WatcherHelper();

    $scope.form = {
      saveTimeout: 1000,
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

    Watcher.getConfiguration()
    .then((response) => {
      $scope.watcher.$$authentication = response.data.authentication;
    })
    .catch((error) => notify.error(`Failed to get authentication info: ${error}`));

    /**
    * Checks action type.
    *
    * @param {object} action - action object.
    * @param {string} type - type (email, report, webhook, slack) of action
    */
    $scope.actionOfType = function (action, type) {
      return _.has(action, type);
    };

    /**
    * Checks if there is any action.
    *
    * @param {object} actions - all actions.
    */
    $scope.actionsExist = function (actions) {
      return _.keys(actions).length;
    };

    /**
    * Defines options for ace editor.
    *
    * @param {string} mode - ace editor mode.
    * @param {integer} lines - number of visible lines in the editor.
    */
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

    /**
    * Initilizes action titles.
    */
    const initActionTitles = function () {
      _.forEach($scope.watcher._source.actions, (settings, name) => { settings.$$title = name; });
    };

    /**
    * Initilizes watcher execution schedule.
    */
    const initSchedule = function () {
      $scope.watcher.$$schedule = {
        hours: 0,
        mins: 0,
        secs: 0
      };
      _.forEach($scope.watcher._source.trigger.schedule.later.split(','), (period) => {
        if (period.match(/hour/i)) {
          $scope.watcher.$$schedule.hours = +_.trim(period).split(' ')[1];
        }
        if (period.match(/min/i)) {
          $scope.watcher.$$schedule.mins = +_.trim(period).split(' ')[1];
        }
        if (period.match(/sec/i)) {
          $scope.watcher.$$schedule.secs = +_.trim(period).split(' ')[1];
        }
      });
    };

    /**
    * Initilizes actions throttle periods.
    */
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

    /**
    * Saves schedule.
    */
    const saveSchedule = function () {
      let schedule = [];
      _.forEach($scope.watcher.$$schedule, (value, key) => {
        if (value) {
          schedule.push(`every ${value} ${key}`);
        }
      });
      $scope.watcher._source.trigger.schedule.later = schedule.join(', ');
      delete $scope.watcher.$$schedule;
    };

    /**
    * Saves all throttle periods to the relative actions.
    */
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

    /**
    * Saves watcher scripts.
    *
    * @param {string} type - input, condition, transform.
    */
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
        //const id = Math.random().toString(36).slice(2);
        const id = Script.createId();
        $scope.form.scripts[type][id] = {
          _id: id,
          _source: {
            script_type: type,
            title: $scope.watcher.$$scripts[type].title,
            body: $scope.watcher.$$scripts[type].body
          }
        };

        Script.new($scope.form.scripts[type][id]).then((id) => {
          if (id.length) {
            notify.info(`Script ${id} saved.`);
          }
        })
        .catch(notify.error);
      }
    };

    /**
    * Selects watcher script.
    *
    * @param {string} type - input, condition, transform.
    * @param {string} id - script id.
    */
    $scope.selectScript = function (type, id) {
      $scope.watcher.$$scripts[type] = {
        id: id,
        title: $scope.form.scripts[type][id]._source.title,
        body: $scope.form.scripts[type][id]._source.body
      };
    };

    /**
    * Removes selected script.
    *
    * @param {string} type - input, condition, transform.
    */
    $scope.removeScript = function (type) {
      const id = $scope.watcher.$$scripts[type].id;
      Script.delete(id).then((id) => {
        if (id.length) {
          notify.info(`Script ${id} deleted.`);
        }
      })
      .catch(notify.error);
      delete $scope.form.scripts[type][id];
    };

    /**
    * Removes action from watcher.
    *
    * @param {string} actionName - action name.
    */
    const removeAction = function (actionName) {
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

    /**
    * Renames actions.
    *
    * @param {object} actions - all actions.
    */
    const renameActions = function (actions) {
      const newActions = {};
      _.forEach(actions, (settings, name) => {
        newActions[settings.$$title] = settings;
        delete newActions[settings.$$title].$$title;
      });
      return newActions;
    };

    /**
    * Saves all available ace editors text as watcher properties.
    */
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

    /**
    * Initializes watcher scripts (input, condition, transform).
    */
    const initScripts = function () {
      $scope.watcher.$$scripts = {};

      if (editorMode === 'wizard' && $scope.watcher._source.condition.script.script.length) {
        $scope.watcher.$$condition_value = +$scope.watcher._source.condition.script.script.split(' ')[2];
      }

      if (editorMode !== 'wizard') {
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

          Script.list(field).then((scripts) => {
            _.forEach(scripts, (script) => {
              $scope.form.scripts[field][script._id] = script;
            });
          }).catch(notify.error);
        });
      }
    };

    /**
    * Initializes editor tabs.
    */
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

    /**
    * Initilizes raw property for the Raw tab.
    */
    const initRaw = function () {
      $scope.watcher.$$raw = angular.toJson($scope.watcher._source, 'pretty');
    };

    /**
    * Initializes all watcher values.
    */
    const init = function () {
      if (editorMode !== 'wizard') {
        try {
          initTabs();
        } catch (e) {
          notify.error(`Fail to initialize editor tabs: ${e}`);
        }
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

    /**
    * Saves the editor values as watcher properties and saves the watcher.
    */
    $scope.saveEditor = function () {
      $scope.watcherForm.$valid = true;
      $scope.watcherForm.$invalid = false;

      if (editorMode === 'wizard' && $scope.watcher._source.condition.script.script.length) {
        const condition = $scope.watcher._source.condition.script.script.split(' ');
        condition[2] = $scope.watcher.$$condition_value;
        $scope.watcher._source.condition.script.script = condition.join(' ');
        delete $scope.watcher.$$condition_value;
      }

      if ($scope.form.rawEnabled) {
        try {
          // All settings will have been overwritten if enable is checked and the watcher is saved.
          $scope.watcher._source = angular.fromJson($scope.watcher.$$raw);
        } catch (e) {
          notify.error(`Invalid Raw configuration: ${e}`);
          $scope.watcherForm.$valid = false;
          $scope.watcherForm.$invalid = true;
        }

        if ($scope.watcherForm.$valid) {
          Watcher.save($scope.watcher)
            .then((id) => {
              $timeout(notify.info(`Watcher ${id} successfully saved!`), $scope.form.saveTimeout);
              $scope.cancelEditor();
            })
            .catch(notify.server);
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

        if (editorMode !== 'wizard') {
          try {
            saveEditorsText();
          } catch (e) {
            notify.error(`Invalid action, Transform or Condition configuration: ${e}`);
            $scope.watcherForm.$valid = false;
            $scope.watcherForm.$invalid = true;
          }
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
        Watcher.save($scope.watcher)
          .then((id) => {
            $timeout(notify.info(`Watcher ${id} successfully saved!`), $scope.form.saveTimeout);
            $scope.cancelEditor();
          })
          .catch(notify.server);
      }

      if (editorMode === 'wizard') $scope.cancelEditor();
    };

    /**
    * Exits to watcher list.
    */
    $scope.cancelEditor = function () {
      $location.path('/');
    };


    $scope.$on('newAction:added', () => {
      try {
        initTabs();
      } catch (e) {
        notify.error(`Fail to initialize editor tabs: ${e}`);
      }
    });

    /**
    * Saves authentication pair (username/password) for watcher authentication.
    */
    const saveAuthenticationPair = function () {
      if ($scope.watcher.$$authentication) {
        if ($scope.watcher.$$authentication.username && $scope.watcher.$$authentication.password) {
          User.new(
            $scope.watcher._id,
            $scope.watcher.$$authentication.username,
            $scope.watcher.$$authentication.password
          ).then((resp) => {
            if (resp.status === 200) {
              console.log(`User:${$scope.watcher.$$authentication.username} watcher:${$scope.watcher._id} pair was saved.`);
            }
          })
          .catch((error) => notify.error(`Failed to save authentication: ${error}`));
        }
      }
    };

    $scope.$on('action:removeAction', (event, action) => removeAction(action.name));
    $scope.$on('navMenu:cancelEditor', () => $scope.cancelEditor());
    $scope.$on('navMenu:saveEditor', () => {
      $scope.saveEditor();
      saveAuthenticationPair();
    });

    // Init form
    init();
  };

  // Watcher object
  $scope.watcher = {};

  if ($routeParams.watcherId && $routeParams.watcherId.length) { // existing watcher
    Watcher.get($routeParams.watcherId)
      .then((watcher) => {
        $scope.watcher = watcher;
        initEditor(); // start editing the watcher
      })
      .catch(notify.error);
  } else { // new watcher
    $scope.watcher = dataTransfer.getWatcher();
    if (!_.isObject($scope.watcher) || _.isEmpty($scope.watcher)) {
      $timeout(() => notify.error('Fail to get watcher data!'), 1000);
    } else {
      initEditor();  // start editing the watcher
    }
  }

});
