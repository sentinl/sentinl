import template from './watcher_edit_human_schedule.html';

class WatcherEditHumanSchedule {
  constructor(sentinlConfig) {
    this.config = sentinlConfig;
    this.enabled = true;
  }

  $onInit() {
    this.schedule = this.watcher._source.trigger.schedule.later;
  }

  handleChange() {
    this.onChange({ schedule: this.schedule });
  }
}

function watcherEditHumanSchedule() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=',
      onChange: '&',
      // isValidationMessageVisible: '&',
    },
    controller:  WatcherEditHumanSchedule,
    controllerAs: 'watcherEditHumanSchedule',
    bindToController: true,
  };
}

export default watcherEditHumanSchedule;
