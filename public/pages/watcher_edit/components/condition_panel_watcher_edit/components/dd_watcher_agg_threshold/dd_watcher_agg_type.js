import template from './dd_watcher_agg_type.html';

class DdWatcherAggType {
  constructor() {
    this.title = 'When';
    this.selected = 'count';
    this.options = ['count', 'average', 'min', 'max'];
  }

  handleChange() {
    this.onSelect({type: this.selected});
  }
}

function ddWatcherAggType() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=watcher',
      onSelect: '&',
    },
    controller:  DdWatcherAggType,
    controllerAs: 'ddWatcherAggType',
    bindToController: true,
  };
}

export default ddWatcherAggType;
