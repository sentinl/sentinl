/* global angular */
import _ from 'lodash';
import confirmMessage from '../templates/confirm-message.html';

import { app } from '../app.module';
import WatcherHelper from '../classes/WatcherHelper';

import anomalyTemplate from '../defaults/templates/anomaly_default';

const defaultTemplates = {
  condition: {
    anomaly: anomalyTemplate
  }
};

// EDITOR CONTROLLER
app.controller('EditorController', function ($rootScope, $scope, $route, $interval,
  $timeout, timefilter, Private, createNotifier, $window, $uibModal,
  $log, navMenu, globalNavState, $routeParams, dataTransfer, $location, Watcher, Script, User) {
  $scope.title = 'Sentinl: Editor';
  $scope.description = 'Kibi/Kibana Report App for Elasticsearch';

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
      status: !$scope.watcher._source.disable ? 'Enabled' : 'Disable',
      templates: dataTransfer.getTemplates(),
      messages: {
        success: null,
        danger: null,
        timeout: 3000
      },
      fields: {
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

    // get authentication config info
    Watcher.getConfiguration()
      .then((response) => {
        $scope.watcher.$$authentication = response.data.authentication;
      })
      .catch(notify.error);

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
    * Saves watcher templates.
    *
    * @param {string} field - field name (input, condition, transform).
    */
    $scope.saveScript = function (field) {
      const title = `${field}Title`;

      if ($scope.watcherForm[title].$viewValue && $scope.watcherForm[title].$viewValue.length) {
        $scope.watcherForm[title].$valid = true;
        $scope.watcherForm[title].$invalid = false;
      } else {
        $scope.watcherForm[title].$valid = false;
        $scope.watcherForm[title].$invalid = true;
      }

      if ($scope.watcherForm[title].$valid) {
        const template = {
          _id: Script.createId(),
          _source: {
            description: field,
            title: $scope.watcher['$$' + field].title,
            body: $scope.watcher['$$' + field].body
          }
        };

        Script.new(template)
          .then((id) => {
            template._id = id;
            $scope.form.templates[field][id] = template;
            $scope.watcher['$$' + field].id = id;
            notify.info(`Script ${id} saved.`);
          })
          .catch(notify.error);
      }
    };

    /**
    * Selects watcher script.
    *
    * @param {string} field - field name (input, condition, transform).
    * @param {string} id - template id.
    */
    $scope.selectScript = function (field, id) {
      $scope.watcher['$$' + field] = {
        id: $scope.form.templates[field][id]._id,
        title: $scope.form.templates[field][id]._source.title,
        body: $scope.form.templates[field][id]._source.body
      };
    };

    /**
    * Removes selected script.
    *
    * @param {string} field - field name (input, condition, transform).
    */
    $scope.removeScript = function (field) {
      const id = $scope.watcher['$$' + field].id;
      Script.delete(id)
        .then((id) => {
          delete $scope.form.templates[field][id];
          $scope.watcher['$$' + field].id = undefined;
          $scope.watcher['$$' + field].title = undefined;
          notify.info(`Script ${id} deleted`);
        })
        .catch(notify.error);
    };

    /**
    * Initializes watcher field.
    *
    * @param {string} name - field name (input, condition, transform).
    */
    const initField = function (name) {
      $scope.watcher['$$' + name] = {
        id: undefined,
        title: undefined,
        body: angular.toJson($scope.watcher._source[name], 'pretty')
      };
    };

    /**
    * Saves watcher field.
    *
    * @param {string} name - field name (input, condition, transform).
    */
    const saveField = function (name) {
      if (name === 'condition') {
        if (_.has($scope.watcher._source[name], 'anomaly')) {
          const field = angular.fromJson($scope.watcher['$$' + name].body);
          delete field.anomaly;
          $scope.watcher._source[name] = field;
          return;
        }
      }
      $scope.watcher._source[name] = angular.fromJson($scope.watcher['$$' + name].body);
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
    const saveActions = function () {
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
      $scope.watcher.$$raw = angular.toJson($scope.watcher, 'pretty');
    };

    /**
    * Adds default templates to the editor form.
    *
    * @param {array} templates - list of templates
    */
    const initDefaultTemplates = function (templates) {
      _.forEach(templates, function (type, typeName) {
        _.forEach(type, function (template, templateName) {
          let id = Script.createId();
          $scope.form.templates[typeName][id] = {
            _id: id,
            _source: {
              title: templateName,
              description: typeName,
              body: angular.toJson(template, 'pretty')
            }
          };
        });
      });
    };

    /**
    * Saves Sentinl custom settings.
    */
    const saveSentinlCustomSettings = function () {
      const condition = angular.fromJson($scope.watcher.$$condition.body);
      if (_.has(condition, 'anomaly')) {
        $scope.watcher._source.sentinl = {
          condition
        };
      } else {
        delete $scope.watcher._source.sentinl;
      }
    };

    /**
    * Initilizes Sentinl custom settings.
    */
    const initSentinlCustomSettings = function () {
      if (_.has($scope.watcher._source, 'sentinl.condition.anomaly')) {
        $scope.watcher.$$condition.body = angular.toJson($scope.watcher._source.sentinl.condition, 'pretty');
      }
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
        _.forEach(_.keys($scope.form.fields), function (field) {
          initField(field);
        });
      } catch (e) {
        notify.error(`Fail to initialize fields: ${e}`);
      }

      try {
        initDefaultTemplates(defaultTemplates);
      } catch (e) {
        notify.error(`Fail to initialize default templates: ${e}`);
      }

      try {
        initSentinlCustomSettings();
      } catch (e) {
        notify.error(`Fail to initialize Sentinl custom settings: ${e}`);
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
          $scope.watcher = angular.fromJson($scope.watcher.$$raw);
        } catch (e) {
          notify.error(`Invalid Raw configuration: ${e}`);
          $scope.watcherForm.$valid = false;
          $scope.watcherForm.$invalid = true;
        }

        if ($scope.watcherForm.$valid) {
          Watcher.save($scope.watcher)
            .then((response) => {
              notify.info(`Watcher ${response} successfully saved!`);
              $scope.cancelEditor();
            })
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

        if (editorMode !== 'wizard') {
          try {
            saveActions();
          } catch (e) {
            notify.error(`Invalid action, Transform or Condition configuration: ${e}`);
            $scope.watcherForm.$valid = false;
            $scope.watcherForm.$invalid = true;
          }

          try {
            saveSentinlCustomSettings();
          } catch (e) {
            notify.error(`Fail to save Sentinl custom settings: ${e}`);
          }

          try {
            _.forEach(_.keys($scope.form.fields), function (field) {
              saveField(field);
            });
          } catch (e) {
            notify.error(`Fail to save field: ${e}`);
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
            notify.info(`Watcher ${id} successfully saved!`);
            $scope.cancelEditor();
          })
          .then(() => {
            $rootScope.$broadcast('editorCtrl-Watcher.save');
          })
          .catch(notify.error);
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
          ).then((response) => {
            notify.info(` User ${response} saved.`);
          })
          .catch(notify.error);
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
      notify.error('Fail to get watcher data!');
    } else {
      initEditor();  // start editing the watcher
    }
  }

});
