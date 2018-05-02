/* global angular */
import { get, keys, trim, has, includes, forEach, isObject, isEmpty } from 'lodash';
import later from 'later';
import uuid from 'uuid/v4';

import WatcherHelper from './classes/WatcherHelper';

import anomalyTemplate from './templates/anomaly';
import rangeTemplate from './templates/range';

import help from '../../messages/help.json';

// EDITOR CONTROLLER
function EditorController(sentinlConfig, $rootScope, $scope, $route, $interval,
  $timeout, timefilter, Private, createNotifier, $window, $uibModal, Promise,
  $log, navMenu, globalNavState, $routeParams, dataTransfer, $location, Watcher, Script, User, ServerConfig, COMMON, confirmModal) {
  'ngInject';

  $scope.title = COMMON.editor.title;
  $scope.description = COMMON.description;
  $scope.sentinlConfig = sentinlConfig;

  let editorMode = $location.$$path.slice(1); // modes: editor, wizard
  if (includes(editorMode, '/')) editorMode = editorMode.split('/')[0];
  const tabName = editorMode.slice(0, 1).toUpperCase() + editorMode.slice(1);

  $scope.topNavMenu = navMenu.getTopNav(editorMode);
  $scope.tabsMenu = navMenu.getTabs(editorMode, [{ name: tabName, url: `#/${editorMode}` }]);

  const notify = createNotifier({
    location: COMMON.editor.title,
  });

  $scope.help = {
    schedule: help.schedule
  };

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
    };

    if (!$scope.form.templates) {
      $scope.form.templates = {};
    }

    // set default templates
    const defaultTemplates = {
      condition: {
        anomaly: anomalyTemplate,
        range: rangeTemplate
      }
    };

    // get authentication config info
    ServerConfig.get()
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
      return has(action, type);
    };

    /**
    * Checks if there is any action.
    *
    * @param {object} actions - all actions.
    */
    $scope.actionsExist = function (actions) {
      return keys(actions).length;
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
        //onLoad: function ($$editor) {
        //  $$editor.$blockScrolling = Infinity;
        //}
      };
    };

    /**
    * Initilizes action titles.
    */
    const initActionTitles = function () {
      forEach($scope.watcher._source.actions, (settings, name) => { settings.$$title = name; });
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

      forEach($scope.watcher._source.actions, (action) => {
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
    * Saves all throttle periods to the relative actions.
    */
    const saveThrottle = function () {
      forEach($scope.watcher._source.actions, (action) => {
        if (action.$$throttle) {
          forEach(action.$$throttle, (value, key) => {
            if (!value) action.$$throttle[key] = 0;
          });
          action.throttle_period = `${action.$$throttle.hours}h${action.$$throttle.mins}m${action.$$throttle.secs}s`;
          delete action.$$throttle;
        }
      });
    };

    $scope.isEmpty = function (obj) {
      return isEmpty(obj);
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
          _id: uuid(),
          _source: {
            description: field,
            title: $scope.watcher['$$' + field].title,
            body: $scope.watcher['$$' + field].body
          }
        };

        Script.new(template)
          .then(function (id) {
            template._id = id;
            $scope.form.templates[field][id] = template;
            $scope.watcher['$$' + field].id = id;
            notify.info(`Saved template "${template._source.title}"`);
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
        .then(function (id) {
          notify.info(`Deleted ${id}`);
          delete $scope.form.templates[field][id];
          $scope.watcher['$$' + field].id = undefined;
          $scope.watcher['$$' + field].title = undefined;
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
      const key = '$$' + `${name}.body`;
      const body = get($scope.watcher, key);
      if (get($scope.watcher, key) && body.length) {
        $scope.watcher._source[name] = angular.fromJson(body);
      } else {
        $scope.watcher._source[name] = angular.fromJson('{}');
      }
    };

    /**
    * Remove watcher action
    *
    * @param {string} name of action
    */
    const removeAction = function (name) {
      function doRemoveAction() {
        delete $scope.watcher._source.actions[name];
        if ($scope.watcher._source.report && !wHelper.numOfActionTypes($scope.watcher, 'report')) {
          delete $scope.watcher._source.report;
        }
      }

      const confirmModalOptions = {
        onConfirm: doRemoveAction,
        confirmButtonText: 'Delete action',
      };

      confirmModal(`Are you sure you want to delete the action ${name}?`, confirmModalOptions);
    };

    /**
    * Renames actions.
    *
    * @param {object} actions - all actions.
    */
    const renameActions = function (actions) {
      const newActions = {};
      forEach(actions, (settings, name) => {
        newActions[settings.$$title] = settings;
        delete newActions[settings.$$title].$$title;
      });
      return newActions;
    };

    /**
    * Saves all available ace editors text as watcher properties.
    */
    const saveActions = function () {
      forEach($scope.watcher._source.actions, (settings, name) => {
        forEach($scope.form.actions.types, (type) => {
          if (has(settings, type)) {
            delete settings[type].$$edit;
          }

          if (type === 'webhook' && has(settings, type)) {
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
      forEach($scope.watcher._source.actions, (settings, name) => {
        forEach($scope.form.actions.types, (type) => {
          if (settings[type]) actionTypes[type] = true;
        });
      });
    };

    /**
    * Initilizes raw property for the Raw tab.
    */
    const initRaw = function () {
      $scope.watcher.$$raw = angular.toJson($scope.watcher._source, 'pretty');
    };

    /**
    * Adds default templates to the editor form.
    *
    * @param {array} templates - list of templates
    */
    const initDefaultTemplates = function (templates) {
      forEach(templates, function (type, typeName) {
        if (!$scope.form.templates[typeName]) {
          $scope.form.templates[typeName] = {};
        }
        forEach(type, function (template, templateName) {
          let id = uuid();

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
    * Initializes all watcher values.
    */
    const init = function ({
      tabs = true,
      fields = true,
      templates = true,
      raw = true,
      actions = true,
      throttle = true
    } = {}) {

      if (editorMode !== 'wizard' && tabs) {
        try {
          initTabs();
        } catch (e) {
          notify.error(`Fail to initialize editor tabs: ${e}`);
        }
      }

      if (fields) {
        try {
          forEach(keys($scope.form.fields), function (field) {
            initField(field);
          });
        } catch (e) {
          notify.error(`Fail to initialize fields: ${e}`);
        }
      }

      if (templates) {
        try {
          initDefaultTemplates(defaultTemplates);
        } catch (e) {
          notify.error(`Fail to initialize default templates: ${e}`);
        }
      }

      if (raw) {
        try {
          initRaw();
        } catch (e) {
          notify.error(`Fail to initialize raw settings: ${e}`);
        }
      }

      if (actions) {
        try {
          initActionTitles();
        } catch (e) {
          notify.error(`Fail to initialize actions: ${e}`);
        }
      }

      if (throttle) {
        try {
          initThrottlePeriods();
        } catch (e) {
          notify.error(`Fail to initialize throttle periods: ${e}`);
        }
      }
    };

    /**
    * Saves authentication pair (username/password) for watcher authentication.
    */
    const saveUser = function (auth) {
      if (auth) {
        return User.new(
          $scope.watcher.id,
          $scope.watcher.$$authentication.username,
          $scope.watcher.$$authentication.password
        ).then(function (user) {
          notify.info(`Saved user "${user}"`);
        });
      }
      return Promise.resolve();
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

      if ($scope.form.rawEnabled) { // Raw
        try {
          // All settings will have been overwritten if enable is checked and the watcher is saved.
          $scope.watcher._source = angular.fromJson($scope.watcher.$$raw);
        } catch (e) {
          notify.error(`Invalid Raw configuration: ${e}`);
          init(); // init form again
          return;
        }

        if ($scope.watcherForm.$valid) {
          Watcher.save($scope.watcher)
            .then(function (id) {
              const title = $scope.watcher.title ? $scope.watcher.title : get($scope.watcher, '_source.title');
              notify.info(`Saved watcher "${title}"`);
              $scope.cancelEditor();
            })
            .catch(notify.error);
        }

        return;
      }

      if ($scope.watcherForm.$valid) {
        try {
          saveThrottle();
        } catch (e) {
          notify.error('Invalid throttle configuration.');
          $scope.watcherForm.$valid = false;
          $scope.watcherForm.$invalid = true;
          init(); // init form again
          return;
        }

        if (editorMode !== 'wizard') {
          try {
            saveActions();
          } catch (e) {
            notify.error(`Invalid action, Transform or Condition configuration: ${e}`);
            init(); // init form again
            return;
          }

          try {
            forEach(keys($scope.form.fields), function (field) {
              saveField(field);
            });
          } catch (e) {
            notify.error(`Fail to save field: ${e}`);
            init({
              fields: false
            });
            return;
          }
        }

        try {
          $scope.watcher._source.actions = renameActions($scope.watcher._source.actions);
        } catch (e) {
          notify.error(`Fail to rename action: ${e}`);
          init(); // init form again
          return;
        }

      }

      if ($scope.watcherForm.$valid) {
        saveUser($scope.watcher.$$authentication.impersonate).then(function () {
          if (later.parse.text($scope.watcher._source.trigger.schedule.later).error > -1) {
            notify.error('Schedule is invalid.');
            $log.error('schedule is invalid:', $scope.watcher._source.trigger.schedule.later);
            init({
              fields: false
            });
            return;
          }

          return Watcher.save($scope.watcher).then(function (id) {
            const title = $scope.watcher.title ? $scope.watcher.title : get($scope.watcher, '_source.title');
            notify.info(`Saved watcher "${title}"`);
            $scope.cancelEditor();
          }).then(function () {
            $rootScope.$broadcast('editorCtrl-Watcher.save');
          });
        }).catch(notify.error);
      }
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

    $scope.$on('action:removeAction', (event, action) => removeAction(action.name));
    $scope.$on('navMenu:cancelEditor', () => $scope.cancelEditor());
    $scope.$on('navMenu:saveEditor', () => {
      $scope.saveEditor();
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
    if (!isObject($scope.watcher) || isEmpty($scope.watcher)) {
      notify.error('Fail to get watcher data!');
    } else {
      initEditor();  // start editing the watcher
    }
  }
};

export default EditorController;
