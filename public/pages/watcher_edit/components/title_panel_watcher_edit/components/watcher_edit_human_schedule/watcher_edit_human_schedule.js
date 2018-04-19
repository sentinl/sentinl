import template from './watcher_edit_human_schedule.html';

class WatcherEditHumanSchedule {
  constructor(sentinlConfig) {
    this.config = sentinlConfig;
    this.enabled = true;
  }

  get schedule() {
    return this.watcher._source.trigger.schedule.later;
  }

  /*
  * @param {string} interval of time in human language
  */
  set schedule(interval) {
    this.watcher._source.trigger.schedule.later = interval;
  }
}

function watcherEditHumanSchedule() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=',
      // isValidationMessageVisible: '&',
    },
    controller:  WatcherEditHumanSchedule,
    controllerAs: 'watcherEditHumanSchedule',
    bindToController: true,
  };
}

export default watcherEditHumanSchedule;
