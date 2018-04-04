import template from './dd_watcher_agg_threshold.html';

class DdWatcherAggThreshold {
  constructor() {
    this.selected = 'above';
    this.options = ['above', 'below'];
    this.number = 5;
  }

  get title() {
    return this.selected.toUpperCase();
  }

  handleChange() {
    this.onSelect({direction: this.selected, number: this.number});
  }
}

function ddWatcherAggThreshold() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=watcher',
      onSelect: '&',
    },
    controller:  DdWatcherAggThreshold,
    controllerAs: 'ddWatcherAggThreshold',
    bindToController: true,
  };
}

export default ddWatcherAggThreshold;
