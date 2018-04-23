import template from './dd_watcher_agg_time.html';

class DdWatcherAggTime {
  constructor() {
    this.title = 'LAST';
    this.options = ['seconds', 'minutes', 'hours', 'days', 'months', 'years'];
  }

  $onInit() {
    this.selected = this.aggTimeOptions.unit || 'minutes';
    this.number = this.aggTimeOptions.n || 15;
  }

  handleChange() {
    this.aggTimeOnSelect({unit: this.selected, n: this.number});
  }
}

function ddWatcherAggTime() {
  return {
    template,
    restrict: 'E',
    scope: {
      aggTimeOptions: '<',
      aggTimeOnSelect: '&',
    },
    controller:  DdWatcherAggTime,
    controllerAs: 'ddWatcherAggTime',
    bindToController: true,
  };
}

export default ddWatcherAggTime;
