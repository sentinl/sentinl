import template from './watcher_wizard_every_schedule.html';
import { get } from 'lodash';

class WatcherWizardEverySchedule {
  constructor($scope, sentinlConfig) {
    this.$scope = $scope;
    this.watcher = this.watcher || this.$scope.watcher;
    this.onSelect = this.onSelect || this.$scope.onSelect;

    this.schedule_timezone = get(sentinlConfig, 'es.watcher.schedule_timezone'); // local, utc
    this.selected = this._getInterval();
    this.options = ['seconds', 'minutes', 'hours', 'days', 'months', 'years'];
    this.number = this._getNumber();
  }

  _getNumber() {
    const number = /every\s(\d+)\s\w+/.exec(this.watcher.trigger.schedule.later);
    if (!number) return 1;
    return +number[1];
  }

  _getInterval() {
    const interval = /every\s\d+\s(\w+)/.exec(this.watcher.trigger.schedule.later);
    if (!interval) return 'minutes';
    return interval[1];
  }

  handleChange() {
    this.onSelect({mode: 'every', text: this.schedule});
  }

  get schedule() {
    return `every ${this.number} ${this.selected}`;
  }
}

function watcherWizardEverySchedule() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=',
      onSelect: '&',
    },
    controller:  WatcherWizardEverySchedule,
    controllerAs: 'watcherWizardEverySchedule',
    bindToController: {
      watcher: '=',
      onSelect: '&',
    },
  };
}

export default watcherWizardEverySchedule;
