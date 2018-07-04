import './threshold_watcher_edit.less';
import template from './threshold_watcher_edit.html';
import { has, forEach } from 'lodash';

class ThresholdWatcherEdit {
  constructor($scope, $log, kbnUrl, sentinlLog, confirmModal, createNotifier, Watcher) {
    this.$scope = $scope;
    this.watcher = this.watcher || this.$scope.watcher;

    this.kbnUrl = kbnUrl;
    this.sentinlLog = sentinlLog;
    this.confirmModal = confirmModal;
    this.watcherService = Watcher;

    this.locationName = 'ThresholdWatcherEdit';

    this.sentinlLog.initLocation(this.locationName);
    this.notify = createNotifier({
      location: this.locationName,
    });

    this.condition = {
      show: false,
      updateStatus: (isSuccess) => {
        this.actions.show = isSuccess && this.condition.show ? true : false;
      },
    };

    this.actions = {
      show: this.condition.show,
    };

    this.$scope.$watch('thresholdWatcherEdit.watcher._source', () => {
      this.condition.show = this._isTitlePanelValid(this.watcher);
      this.actions.show = this.condition.show;
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
    return this.condition.show && this.actions.show;
  }

  _cancelWatcherEditor() {
    this.kbnUrl.redirect('/');
  };

  async _saveWatcherEditor() {
    try {
      this.watcher._source.actions = this._renameActionsIfNeeded(this.watcher._source.actions);
      const resp = await this.watcherService.save(this.watcher);
      this._cancelWatcherEditor();
    } catch (err) {
      this.notify.error(err.message);
    }
  };

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
    return watcher._source && !!watcher._source.trigger.schedule.later.length;
  }

  _isIndex(watcher) {
    return watcher._source && Array.isArray(watcher._source.input.search.request.index) &&
    !!watcher._source.input.search.request.index.length;
  }

  _isTitle(watcher) {
    return watcher._source && !!watcher._source.title.length;
  }

  _isTitlePanelValid(watcher) {
    try {
      return this._isSchedule(watcher) && this._isIndex(watcher) && this._isTitle(watcher);
    } catch (err) {
      this.notify.error(`fail to check if title panel is valid: ${err.message}`);
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
