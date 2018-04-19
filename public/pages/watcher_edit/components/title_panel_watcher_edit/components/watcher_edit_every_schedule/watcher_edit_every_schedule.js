import template from './watcher_edit_every_schedule.html';

class WatcherEditEverySchedule {
  constructor() {
    this.enabled = true;
    this.selected = 'minutes';
    this.number = 1;
    this.options = ['seconds', 'minutes', 'hours', 'days', 'months', 'years'];
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
    bindToController: true,
  };
}

export default watcherEditEverySchedule;
