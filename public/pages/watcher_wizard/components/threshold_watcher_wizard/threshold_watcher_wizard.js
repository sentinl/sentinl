import './threshold_watcher_wizard.less';
import template from './threshold_watcher_wizard.html';
import { get, has, forEach, keys, isObject, isEmpty, includes, union } from 'lodash';

class ThresholdWatcherWizard {
  constructor($scope, $window, kbnUrl, sentinlLog, confirmModal, createNotifier,
    Watcher, User, wizardHelper, watcherWizardEsService, sentinlConfig, sentinlHelper) {
    this.$scope = $scope;
    this.watcher = this.watcher || this.$scope.watcher;

    this.$window = $window;
    this.kbnUrl = kbnUrl;
    this.confirmModal = confirmModal;
    this.watcherService = Watcher;
    this.userService = User;
    this.wizardHelper = wizardHelper;
    this.watcherWizardEsService = watcherWizardEsService;
    this.sentinlConfig = sentinlConfig;
    this.sentinlHelper = sentinlHelper;

    this.locationName = 'ThresholdWatcherWizard';

    this.log = sentinlLog;
    this.log.initLocation(this.locationName);
    this.notify = createNotifier({
      location: this.locationName,
    });

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
      this.errorMessage(`get index "${this.watcher.input.search.request.index}" field names: ${err.toString()}`);
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
        this.errorMessage(`get index "${index}" field names: ${err.toString()}`);
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

      const id = await this.watcherService.save(this.watcher);
      this.notify.info('watcher saved: ' + id);

      if (this.watcher.username && this.watcher.password) {
        await this.userService.new(id, this.watcher.username, this.watcher.password);
      }

      if (clean) {
        this._cleanWatcher(this.watcher);
      }
      this._cancelWatcherWizard();
    } catch (err) {
      this.errorMessage(err);
    }
  }

  _cleanWatcher(watcher) {
    delete watcher.password;
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
      this.notify.error(`check title panel ${err}`);
    }
  }

  _warning(msg) {
    this.log.warn(msg);
    this.notify.warning(msg);
  }

  _error(err) {
    this.log.error(err);
    this.notify.error(err);
  }

  errorMessage(err) {
    err = err || 'unknown error, bad implementation';
    err = this.sentinlHelper.apiErrMsg(err);
    if (err.match(/(parsing_exception)|(illegal_argument_exception)|(index_not_found_exception)/)) {
      this._warning(err);
    } else {
      this._error(err);
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
