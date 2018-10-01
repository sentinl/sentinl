import './threshold_watcher_wizard.less';
import template from './threshold_watcher_wizard.html';
import { isError, get, has, forEach, keys, isObject, isEmpty, includes, union } from 'lodash';
import SentinlError from '../../../../lib/sentinl_error';

class ThresholdWatcherWizard {
  constructor($scope, $window, kbnUrl, sentinlLog, confirmModal,
    wizardHelper, watcherWizardEsService, sentinlConfig, sentinlHelper,
    watcherService, userService, getToastNotifications, getNotifier) {
    this.$scope = $scope;
    this.watcher = this.watcher || this.$scope.watcher;

    this.$window = $window;
    this.kbnUrl = kbnUrl;
    this.confirmModal = confirmModal;
    this.wizardHelper = wizardHelper;
    this.watcherWizardEsService = watcherWizardEsService;
    this.sentinlConfig = sentinlConfig;
    this.sentinlHelper = sentinlHelper;

    this.watcherService = watcherService;
    this.userService = userService;

    this.location = 'ThresholdWatcherWizard';
    this.log = sentinlLog;
    this.log.initLocation(this.location);
    this.notify = getNotifier.create({ location });
    this.toastNotifications = getToastNotifications;

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

    if (!get(this.watcher, 'wizard.chart_query_params') && !this.isSpyWatcher) {
      this.watcher.wizard = {
        chart_query_params: {
          timezoneName: get(this.sentinlConfig, 'es.timezone'), // Europe/Amsterdam
          timeField: get(this.sentinlConfig, 'es.timefield'),
          queryType: get(this.sentinlConfig, 'wizard.condition.query_type'),
          scheduleType: get(this.sentinlConfig, 'wizard.condition.schedule_type'),
          over: get(this.sentinlConfig, 'wizard.condition.over'),
          last: get(this.sentinlConfig, 'wizard.condition.last'),
          interval: get(this.sentinlConfig, 'wizard.condition.interval'),
          threshold: this._getThreshold(this.watcher.condition.script.script),
        }
      };
    }

    this._init();
  }

  async _init() {
    this.indexesData = {
      fieldNames: [],
    };

    try {
      const mappings = await this.watcherWizardEsService.getMapping(this.watcher.input.search.request.index);
      this.indexesData.fieldNames = this._getIndexFieldNames(mappings).sort();
    } catch (err) {
      this.errorMessage(new SentinlError(`Get index "${this.watcher.input.search.request.index}" field names`, err));
    }
  }

  _getIndexFieldNames(mappings, result = []) {
    if (!isObject(mappings) || isEmpty(mappings)) {
      return result;
    }

    forEach(mappings, (mapping, key) => {
      if (mapping.properties) {
        result = union(result, keys(mapping.properties));
      }
      if (mapping.fields) {
        forEach(mapping.fields, (mFieldMapping, mFieldName) => {
          if (!includes(result, key + '.' + mFieldName)) {
            result.push(key + '.' + mFieldName);
          }
        });
      }
      if (isObject(mapping)) {
        result = this._getIndexFieldNames(mapping, result);
      }
    });
    return result;
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

  async indexChange({index}) {
    this.watcher.input.search.request.index = index;
    if (!this.isSpyWatcher) {
      this.watcher.wizard.chart_query_params.index = index;
      try {
        const mappings = await this.watcherWizardEsService.getMapping(index);
        this.indexesData.fieldNames = this._getIndexFieldNames(mappings).sort();
      } catch (err) {
        this.errorMessage(new SentinlError(`Get index "${index}" field names`, err));
      }
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
    try {
      if (convertToAdvanced) {
        delete this.watcher.wizard.chart_query_params;
      }

      const password = this.watcher.password;
      delete this.watcher.password;

      const id = await this.watcherService.save(this.watcher);
      this.toastNotifications.addSuccess(`Watcher saved: '${id}'`);

      if (this.watcher.username && password) {
        await this.userService.new(id, this.watcher.username, password);
      }

      this._cancelWatcherWizard();
    } catch (err) {
      this.errorMessage(new SentinlError('Save wizard', err));
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
      this.errorMessage(new SentinlError('Check title panel', err));
    }
  }

  _throwWarning(msg) {
    this.log.warn(msg);
    this.toastNotifications.addWarning(msg);
  }

  _throwError(err) {
    this.log.error(err);
    this.notify.error(err);
  }

  errorMessage(err) {
    if (!isError(err)) {
      return;
    }

    if (err.message.match(/(parsing_exception)|(illegal_argument_exception)|(index_not_found_exception)/)) {
      this._throwWarning(err.message);
    } else {
      this._throwError(err);
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
