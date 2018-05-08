import template from './threshold_watcher_edit.html';
import { has } from 'lodash';

class ThresholdWatcherEdit {
  constructor($scope, $log, kbnUrl, sentinlLog) {
    this.$scope = $scope;
    this.kbnUrl = kbnUrl;
    this.sentinlLog = sentinlLog;
    this.sentinlLog.initLocation('ThresholdWatcherEdit');

    this.condition = {
      show: false,
      updateStatus: (isSuccess) => {
        this.action.show = isSuccess && this.condition.show ? true : false;
      },
    };
    this.action = {
      show: this.condition.show,
    };
  }

  $onInit() {
    this.$scope.$watch('thresholdWatcherEdit.watcher._source', () => {
      this.condition.show = this._showCondition(this.watcher);
      this.action.show = this.condition.show;
    }, true);

    this.$scope.$on('navMenu:cancelEditor', () => {
      this._cancelWatcherEditor();
    });
    this.$scope.$on('navMenu:saveEditor', () => {
      this._saveWatcherEditor();
    });
  }

  _cancelWatcherEditor() {
    this.kbnUrl.redirect('/');
  };

  _saveWatcherEditor() {
    this.kbnUrl.redirect('/');
  };

  _showCondition(watcher) {
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
