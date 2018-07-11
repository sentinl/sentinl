import template from './watcher_edit_human_schedule.html';
import { get } from 'lodash';

class WatcherEditHumanSchedule {
  constructor($scope, sentinlConfig) {
    this.$scope = $scope;
    this.watcher = this.watcher || this.$scope.watcher;
    this.onSelect = this.onSelect || this.$scope.onSelect;

    this.schedule_timezone = get(sentinlConfig, 'es.watcher.schedule_timezone'); // local, utc
    this.schedule = get(this.watcher, '_source.trigger.schedule.later') || '';
  }

  handleChange() {
    this.onSelect({mode: 'human', text: this.schedule});
  }
}

function watcherEditHumanSchedule() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=',
      onSelect: '&',
    },
    controller:  WatcherEditHumanSchedule,
    controllerAs: 'watcherEditHumanSchedule',
    bindToController: {
      watcher: '=',
      onSelect: '&',
    },
  };
}

export default watcherEditHumanSchedule;
