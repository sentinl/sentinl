import template from './threshold_watcher_edit.html';
import { has } from 'lodash';

class ThresholdWatcherEdit {
  constructor($scope, $log, kbnUrl, sentinlLog, confirmModal, createNotifier, Watcher) {
    this.$scope = $scope;
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
      trigger: {
        scheduleChange: () => {},
        indexChange: () => {},
      },
    };

    this.actions = {
      show: this.condition.show,
      trigger: {
        save: () => {},
      },
    };
  }

  $onInit() {
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

  indexChange(index) {
    this.watcher._source.input.search.request.index = index;
    this.condition.trigger.indexChange(index);
  }

  titleChange(title) {
    this.watcher._source.title = title;
  }

  scheduleChange(schedule) {
    this.watcher._source.trigger.schedule.later = schedule;
    this.condition.trigger.scheduleChange(schedule);
  }

  conditionChange(inputQuery, condition) {
    // debugger;
  }

  actionChange(actions) {
    this.watcher._source.actions = actions;
  }

  _isWatcherValid() {
    return this.condition.show && this.actions.show;
  }

  _cancelWatcherEditor() {
    this.kbnUrl.redirect('/');
  };

  async _saveWatcherEditor() {
    try {
      this.actions.trigger.save();
      await this.watcherService.save(this.watcher);
      this._cancelWatcherEditor();
    } catch (err) {
      this.notify.error(`fail to save watcher: ${err.message}`);
    }
  };

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
    bindToController: true,
  };
}

export default thresholdWatcherEdit;
