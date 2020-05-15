import './threshold_watcher_wizard.less';
import template from './threshold_watcher_wizard.html';
import { cloneDeep, defaultsDeep, get, has, forEach, keys, isObject, isEmpty, includes, union } from 'lodash';
import { toastNotificationsFactory } from '../../../../factories';

const toastNotifications = toastNotificationsFactory();

class ThresholdWatcherWizard {
  constructor($scope, $window, kbnUrl, sentinlLog, confirmModal,
    wizardHelper, watcherWizardEsService, sentinlConfig, sentinlHelper,
    watcherService, userService) {
    this.$scope = $scope;
    this.watcher = this.watcher || this.$scope.watcher;

    this.$window = $window;
    this.kbnUrl = kbnUrl;
    this.confirmModal = confirmModal;
    this.wizardHelper = wizardHelper;
    this.watcherWizardEsService = watcherWizardEsService;
    this.sentinlConfig = cloneDeep(sentinlConfig);
    this.sentinlHelper = sentinlHelper;

    this.watcherService = watcherService;
    this.userService = userService;

    this.log = sentinlLog;
    this.log.initLocation('Wizard watcher');

    this.isSpyWatcher = !!this.watcher.spy;

    this.$scope.$on('navMenu:cancelEditor', () => {
      const confirmModalOptions = {
        onCancel: () => true,
        onConfirm: () => this._cancelWatcherWizard(),
        confirmButtonText: 'Yes',
      };
      this.confirmModal('Stop configuring this watcher?', confirmModalOptions);
    });

    this.$scope.$on('navMenu:saveEditor', () => {
      if (this.isTitlePanelValid()) {
        const confirmModalOptions = {
          onCancel: () => true,
          onConfirm: () => this._saveWatcherWizard(),
          confirmButtonText: 'Yes',
        };
        this.confirmModal('Save this watcher?', confirmModalOptions);
      } else {
        const confirmModalOptions = {
          onConfirm: () => true,
          onCancel: () => this._cancelWatcherWizard(),
          confirmButtonText: 'Continue configuring',
        };
        this.confirmModal('Watcher is not valid', confirmModalOptions);
      }
    });

    if (!this.isSpyWatcher) {
      defaultsDeep(this.watcher, {
        wizard: {
          chart_query_params: {
            ...this.sentinlConfig.wizard.condition,
            timezoneName: this.sentinlConfig.es.timezone,
            threshold: this._getThreshold(this.watcher.condition.script.script)
          }
        }
      });
    }

    if (!isEmpty(this.watcher.input.search.request.index)) {
      this._getIndexFields(this.watcher.input.search.request.index);
    }
  }

  _getThreshold(conditionScript) {
    const condition = /(>=|<=|<|>)\s?(\d+)/.exec(conditionScript);
    if (condition[1] === '<') {
      return {n: +condition[2], direction: 'below'};
    }
    if (condition[1] === '>') {
      return {n: +condition[2], direction: 'above'};
    }
    if (condition[1] === '<=') {
      return {n: +condition[2], direction: 'below eq'};
    }
    if (condition[1] === '>=') {
      return {n: +condition[2], direction: 'above eq'};
    }
  }

  turnIntoAdvanced() {
    const confirmModalOptions = {
      onCancel: () => true,
      onConfirm: () => this._saveWatcherWizard({convertToAdvanced: true}),
      confirmButtonText: 'Yes',
    };
    this.confirmModal('Are you sure you want to turn this watcher into advanced watcher?' +
      ' Attention! It is one-way operation, you can\'t revert it.', confirmModalOptions);
  }

  aceOptions({mode = 'behaviour', maxLines = 10, minLines = 5} = {}) {
    return {
      mode: mode,
      useWrapMode : true,
      showGutter: true,
      rendererOptions: {
        maxLines: maxLines,
        minLines: minLines,
      },
      editorOptions: {
        autoScrollWizardIntoView: false
      },
    };
  }

  async indexChange({ index }) {
    if (!this.isSpyWatcher) {
      this._getIndexFields(index);
    }
    this.watcher.input.search.request.index = index;
  }

  async _getIndexFields(index) {
    this.indexesData = {
      fieldNames: {
        date: [],
        text: [],
        numeric: []
      },
    };

    try {
      const mappings = await this.watcherWizardEsService.getMapping(index);
      this.indexesData.fieldNames = this.sentinlHelper.getFieldsFromMappings(mappings);
    } catch (err) {
      this.errorMessage(`get index '${index}' field names`, err);
    }
  }

  inputAdvChange({input, condition}) {
    if (input) {
      this.watcher.input = input;
    }

    if (condition) {
      this.watcher.condition = condition;
    }
  }

  scheduleChange(mode, text) {
    this.watcher.wizard.chart_query_params.scheduleType = mode;
    this.watcher.trigger.schedule.later = text;
  }

  conditionChange(condition) {
    this.watcher.condition.script.script = condition;
  }

  queryChange(body) {
    this.watcher.input.search.request.body = body;
  }

  actionAdd({actionId, actionSettings}) {
    this.watcher.actions[actionId] = actionSettings;
  }

  actionDelete({actionId}) {
    delete this.watcher.actions[actionId];
  }

  _cancelWatcherWizard() {
    if (this.isSpyWatcher) {
      this.$window.location.href = this.$window.location.href.split('#')[0];
    } else {
      this.kbnUrl.redirect('/');
    }
  }

  async _saveWatcherWizard({convertToAdvanced = false, clean = true} = {}) {
    const watcher = cloneDeep(this.watcher);

    if (convertToAdvanced) {
      delete watcher.wizard;
    }

    const password = watcher.password;
    delete watcher.password;

    try {
      const id = await this.watcherService.save(watcher);
      if (id) {
        toastNotifications.addSuccess('watcher saved: ' + id);

        if (watcher.username && password) {
          await this.userService.new(id, watcher.username, password);
        }
        this._cancelWatcherWizard();
      }
    } catch (err) {
      this.errorMessage('save watcher', err);
    }
  }

  _isSchedule(watcher) {
    const sched = get(watcher, 'trigger.schedule.later');
    return sched && !!sched.length;
  }

  _isIndex(watcher) {
    const index = get(watcher, 'input.search.request.index');
    return index && Array.isArray(index) && !!index.length;
  }

  _isTitle(watcher) {
    const title = get(watcher, 'title');
    return title && !!title.length;
  }

  isTitlePanelValid() {
    try {
      return this._isSchedule(this.watcher) && this._isIndex(this.watcher) && this._isTitle(this.watcher);
    } catch (err) {
      toastNotifications.addDanger(`check title panel ${err.toString()}`);
    }
  }

  errorMessage(message, err) {
    if (err.message.match(/index_not_found_exception/gi)) {
      return;
    } else if (err.message.match(/(parsing_exception)|(illegal_argument_exception)/)) {
      this.log.warn(err.message);
      toastNotifications.addWarning(err.message);
    } else {
      this.log.error(err);
      toastNotifications.addDanger(err);
    }
  }
}

function thresholdWatcherWizard() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=',
    },
    controller: ThresholdWatcherWizard,
    controllerAs: 'thresholdWatcherWizard',
    bindToController: {
      watcher: '=',
    },
  };
}

export default thresholdWatcherWizard;
