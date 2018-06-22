import template from './watcher_edit_every_schedule.html';

class WatcherEditEverySchedule {
  constructor($scope) {
    this.$scope = $scope;
    this.watcher = this.watcher || this.$scope.watcher;

    this.enabled = true;
    this.selected = 'minutes';
    this.options = ['seconds', 'minutes', 'hours', 'days', 'months', 'years'];
    this.number = this._getNumber();
  }

  _getNumber() {
    const number = /every\s(\d+)\s\w+/.exec(this.watcher._source.trigger.schedule.later);
    if (!number) return 1;
    return +number[1];
  }

  handleChange() {
    this.watcher._source.trigger.schedule.later = `every ${this.number} ${this.selected}`;
  }
}

function watcherEditEverySchedule() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=',
    },
    controller:  WatcherEditEverySchedule,
    controllerAs: 'watcherEditEverySchedule',
    bindToController: {
      watcher: '=',
    },
  };
}

export default watcherEditEverySchedule;
