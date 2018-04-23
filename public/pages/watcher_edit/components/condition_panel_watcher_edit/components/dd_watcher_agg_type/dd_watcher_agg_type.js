import template from './dd_watcher_agg_type.html';

class DdWatcherAggType {
  constructor() {
    this.title = 'WHEN';
    this.options = ['count', 'average', 'sum', 'min', 'max'];
  }

  $onInit() {
    this.selected = this.aggTypeSelected || 'count';
  }

  handleChange() {
    this.aggTypeOnSelect({type: this.selected});
  }
}

function ddWatcherAggType() {
  return {
    template,
    restrict: 'E',
    scope: {
      aggTypeSelected: '=',
      aggTypeOnSelect: '&',
    },
    controller:  DdWatcherAggType,
    controllerAs: 'ddWatcherAggType',
    bindToController: true,
  };
}

export default ddWatcherAggType;
