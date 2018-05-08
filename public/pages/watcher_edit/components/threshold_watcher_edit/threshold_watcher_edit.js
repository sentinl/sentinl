import template from './threshold_watcher_edit.html';
import { has } from 'lodash';

class ThresholdWatcherEdit {
  constructor($scope, $log, sentinlLog) {
    this.$scope = $scope;
    this.sentinlLog = sentinlLog;
    this.sentinlLog.initLocation('ThresholdWatcherEdit');

    this.condition = {
      show: false,
      updateStatus: (isSuccess) => {
        this.action.show = isSuccess;
      },
    };
    this.action = {
      show: false,
    };
  }

  $onInit() {
    this.$scope.$watch('thresholdWatcherEdit.watcher._source', () => {
      this.condition.show = this._showTitlePanel(this.watcher);
    }, true);
  }

  _showTitlePanel(watcher) {
    try {
      if (watcher._source.title && !!watcher._source.title.length) {
        if (has(watcher._source, 'trigger.schedule.later') && !!watcher._source.trigger.schedule.later.length) {
          if (has(watcher._source, 'input.search.request.index') && Array.isArray(watcher._source.input.search.request.index) &&
            !!watcher._source.input.search.request.index.length) {
            return true;
          }
        }
      }
    } catch (err) {
      this.sentinlLog.error(['ThresholdWatcherEdit'], `fail to check if title panel valid: ${err.message}`);
      return false;
    }
    return false;
  }
}

function thresholdWatcherEdit() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=watcher',
    },
    controller: ThresholdWatcherEdit,
    controllerAs: 'thresholdWatcherEdit',
    bindToController: true,
  };
}

export default thresholdWatcherEdit;
