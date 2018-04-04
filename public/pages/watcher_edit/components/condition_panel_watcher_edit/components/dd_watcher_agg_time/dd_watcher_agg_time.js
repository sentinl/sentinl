import template from './dd_watcher_agg_time.html';

class DdWatcherAggTime {
  constructor() {
    this.title = 'LAST';
    this.selected = 'minutes';
    this.options = ['seconds', 'minutes', 'hours', 'months', 'years'];
    this.number = 5;
  }

  handleChange() {
    this.onSelect({units: this.selected, number: this.number});
  }
}

function ddWatcherAggTime() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=watcher',
      onSelect: '&',
    },
    controller:  DdWatcherAggTime,
    controllerAs: 'ddWatcherAggTime',
    bindToController: true,
  };
}

export default ddWatcherAggTime;
