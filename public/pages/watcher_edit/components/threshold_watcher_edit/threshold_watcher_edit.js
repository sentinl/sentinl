import './threshold_watcher_edit.less';
import template from './threshold_watcher_edit.html';
import { get, has, forEach, union, isObject } from 'lodash';

class ThresholdWatcherEdit {
  constructor($scope, $log, $window, kbnUrl, sentinlLog, confirmModal, createNotifier,
    Watcher, wizardHelper, watcherEditorEsService, sentinlConfig) {
    this.$scope = $scope;
    this.watcher = this.watcher || this.$scope.watcher;

    this.$window = $window;
    this.kbnUrl = kbnUrl;
    this.confirmModal = confirmModal;
    this.watcherService = Watcher;
    this.wizardHelper = wizardHelper;
    this.watcherEditorEsService = watcherEditorEsService;
    this.sentinlConfig = sentinlConfig;

    this.locationName = 'ThresholdWatcherEdit';

    this.log = sentinlLog;
    this.log.initLocation(this.locationName);
    this.notify = createNotifier({
      location: this.locationName,
    });

    this.condition = {
      show: false,
      updateStatus: (isSuccess) => {
        this.actions.show = isSuccess && this.condition.show;
      },
    };

    this.actions = {
      show: this.wizardHelper.isSpyWatcher(this.watcher) || this.condition.show,
    };

    this.$scope.$watch('thresholdWatcherEdit.watcher._source', () => {
      if (this.wizardHelper.isSpyWatcher(this.watcher)) {
        this.actions.show = this._isTitlePanelValid(this.watcher);
      } else {
        this.condition.show = this._isTitlePanelValid(this.watcher);
        this.actions.show = this.condition.show;
      }
    }, true);

    this.$scope.$on('navMenu:cancelEditor', () => {
      const confirmModalOptions = {
        onCancel: () => true,
        onConfirm: () => this._cancelWatcherEditor(),
        confirmButtonText: 'Yes',
      };
      this.confirmModal('Stop configuring this watcher?', confirmModalOptions);
    });

    this.$scope.$on('navMenu:saveEditor', () => {
      if (this._isWatcherValid()) {
        const confirmModalOptions = {
          onCancel: () => true,
          onConfirm: () => this._saveWatcherEditor(),
          confirmButtonText: 'Yes',
        };
        this.confirmModal('Save this watcher?', confirmModalOptions);
      } else {
        const confirmModalOptions = {
          onConfirm: () => true,
          onCancel: () => this._cancelWatcherEditor(),
          confirmButtonText: 'Continue configuring',
        };
        this.confirmModal('Watcher is not valid', confirmModalOptions);
      }
    });

    if (!get(this.watcher, '_source.wizard.chart_query_params') && !this.wizardHelper.isSpyWatcher(this.watcher)) {
      this.watcher._source.wizard = {
        chart_query_params: {
          timezoneName: get(this.sentinlConfig, 'es.timezone'), // Europe/Amsterdam
          timeField: get(this.sentinlConfig, 'es.timefield'),
          queryType: get(this.sentinlConfig, 'wizard.condition.query_type'),
          scheduleType: get(this.sentinlConfig, 'wizard.condition.schedule_type'),
          over: get(this.sentinlConfig, 'wizard.condition.over'),
          last: get(this.sentinlConfig, 'wizard.condition.last'),
          interval: get(this.sentinlConfig, 'wizard.condition.interval'),
          threshold: this._getThreshold(this.watcher._source.condition.script.script),
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
      this.indexesData.fieldNames = await this.getIndexFieldNames(this.watcher._source.input.search.request.index);
    } catch (err) {
      this.errorMessage(`get index "${this.watcher._source.input.search.request.index}" field names: ${err.message}`);
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
    delete this.watcher._source.wizard.chart_query_params;
    const confirmModalOptions = {
      onCancel: () => true,
      onConfirm: () => this._saveWatcherEditor(),
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
        autoScrollEditorIntoView: false
      },
    };
  }

  async indexChange(params) {
    this.watcher._source.input.search.request.index = params.index;
    this.actions.show = this._isTitlePanelValid(this.watcher);
    if (!this.wizardHelper.isSpyWatcher(this.watcher)) {
      this.watcher._source.wizard.chart_query_params.index = params.index;
      try {
        this.indexesData.fieldNames = await this.getIndexFieldNames(params.index);
      } catch (err) {
        this.errorMessage(`get index "${params.index}" field names: ${err.message}`);
      }
    }
  }

  scheduleChange(mode, text) {
    this.watcher._source.wizard.chart_query_params.scheduleType = mode;
    this.watcher._source.trigger.schedule.later = text;
  }

  conditionChange(condition) {
    this.watcher._source.condition.script.script = condition;
  }

  queryChange(body) {
    this.watcher._source.input.search.request.body = body;
  }

  actionAdd(params) {
    this.watcher._source.actions[params.actionName] = params.actionSettings;
  }

  actionDelete(params) {
    delete this.watcher._source.actions[params.actionName];
  }

  _isWatcherValid() {
    return this.wizardHelper.isSpyWatcher(this.watcher) ? this.actions.show : this.condition.show && this.actions.show;
  }

  _cancelWatcherEditor() {
    if (this.wizardHelper.isSpyWatcher(this.watcher)) {
      this.$window.location.href = this.$window.location.href.split('#')[0];
    } else {
      this.kbnUrl.redirect('/');
    }
  }

  async _saveWatcherEditor() {
    try {
      this.watcher._source.actions = this._renameActionsIfNeeded(this.watcher._source.actions);
      const resp = await this.watcherService.save(this.watcher);
      this._cancelWatcherEditor();
    } catch (err) {
      this.notify.error(err.message);
    }
  }

  _renameActionsIfNeeded(actions) {
    const result = {};
    forEach(actions, function (action) {
      action.name = action.name.replace(/ /g, '_');
      result[action.name] = action;
      delete result[action.name].name;
    });
    return result;
  }

  _isSchedule(watcher) {
    const sched = get(watcher, '_source.trigger.schedule.later');
    return sched && !!sched.length;
  }

  _isIndex(watcher) {
    const index = get(watcher, '_source.input.search.request.index');
    return index && Array.isArray(index) && !!index.length;
  }

  _isTitle(watcher) {
    const title = get(watcher, '_source.title');
    return title && !!title.length;
  }

  _isTitlePanelValid(watcher) {
    try {
      return this._isSchedule(watcher) && this._isIndex(watcher) && this._isTitle(watcher);
    } catch (err) {
      this.notify.error(`check title panel ${err}`);
    }
  }

  async getIndexFieldNames(index) {
    let fieldNames = [];
    function getFieldNames(mapping) {
      for (let i in mapping) {
        if (typeof mapping[i] === 'object' && mapping[i] !== null) {
          if (mapping[i].properties) {
            fieldNames = union(fieldNames, Object.keys(mapping[i].properties));
          }
          getFieldNames(mapping[i]);
        }
      }
    }

    try {
      const mapping = await this.watcherEditorEsService.getMapping(index);
      getFieldNames(mapping);
      return fieldNames;
    } catch (err) {
      throw new Error(err.message);
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
    err = err.message || (isObject(err) ? JSON.stringify(err) : err);
    if (err.match(/(illegal_argument_exception)|(index_not_found_exception)/)) {
      this._warning(err);
    } else {
      this._error(err);
    }
  }

}

function thresholdWatcherEdit() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=',
    },
    controller: ThresholdWatcherEdit,
    controllerAs: 'thresholdWatcherEdit',
    bindToController: {
      watcher: '=',
    },
  };
}

export default thresholdWatcherEdit;
