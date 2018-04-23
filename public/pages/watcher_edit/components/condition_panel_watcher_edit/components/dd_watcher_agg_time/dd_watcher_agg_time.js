import template from './dd_watcher_agg_time.html';

class DdWatcherAggTime {
  constructor() {
    this.title = 'LAST';
    this.selected = 'minutes';
    this.options = ['seconds', 'minutes', 'hours', 'days', 'months', 'years'];
    this.number = 15;
  }

  handleChange() {
    this.onSelect({unit: this.selected, n: this.number});
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
