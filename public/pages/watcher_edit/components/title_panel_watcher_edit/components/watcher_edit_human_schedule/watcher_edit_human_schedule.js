import template from './watcher_edit_human_schedule.html';

class WatcherEditHumanSchedule {
  constructor($scope, sentinlConfig) {
    this.$scope = $scope;
    this.watcher = this.watcher || this.$scope.watcher;
    this.onChange = this.onChange || this.$scope.onChange;

    this.config = sentinlConfig;
    this.enabled = true;
    this.schedule = 'This feature is under construction. Comming soon ...';
  }

  handleChange() {
  }
}

function watcherEditHumanSchedule() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=',
      onChange: '&',
    },
    controller:  WatcherEditHumanSchedule,
    controllerAs: 'watcherEditHumanSchedule',
    bindToController: {
      watcher: '=',
      onChange: '&',
    },
  };
}

export default watcherEditHumanSchedule;
