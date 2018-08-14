import template from './watcher_wizard_human_schedule.html';
import { get } from 'lodash';

class WatcherWizardHumanSchedule {
  constructor($scope, sentinlConfig) {
    this.$scope = $scope;
    this.watcher = this.watcher || this.$scope.watcher;
    this.onSelect = this.onSelect || this.$scope.onSelect;

    this.schedule_timezone = get(sentinlConfig, 'es.watcher.schedule_timezone'); // local, utc
    this.schedule = get(this.watcher, 'trigger.schedule.later') || '';
  }

  handleChange() {
    this.onSelect({mode: 'human', text: this.schedule});
  }
}

function watcherWizardHumanSchedule() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=',
      onSelect: '&',
    },
    controller:  WatcherWizardHumanSchedule,
    controllerAs: 'watcherWizardHumanSchedule',
    bindToController: {
      watcher: '=',
      onSelect: '&',
    },
  };
}

export default watcherWizardHumanSchedule;
