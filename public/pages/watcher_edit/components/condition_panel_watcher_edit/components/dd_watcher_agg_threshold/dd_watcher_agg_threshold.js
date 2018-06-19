import template from './dd_watcher_agg_threshold.html';

class DdWatcherAggThreshold {
  constructor() {
    this.options = ['above', 'below', 'above eq', 'below eq'];
  }

  $onInit() {
    this.number = this.aggThresholdOptions.n || 5;
    this.selected = this.aggThresholdOptions.direction || 'above';
  }

  get title() {
    return this.selected.toUpperCase();
  }

  handleChange() {
    this.aggThresholdOnSelect({direction: this.selected, n: this.number});
  }
}

function ddWatcherAggThreshold() {
  return {
    template,
    restrict: 'E',
    scope: {
      aggThresholdOptions: '<',
      aggThresholdOnSelect: '&',
    },
    controller:  DdWatcherAggThreshold,
    controllerAs: 'ddWatcherAggThreshold',
    bindToController: true,
  };
}

export default ddWatcherAggThreshold;
