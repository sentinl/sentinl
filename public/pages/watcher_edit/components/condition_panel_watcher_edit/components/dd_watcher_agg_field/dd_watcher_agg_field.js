import template from './dd_watcher_agg_field.html';

class DdWatcherAggField {
  constructor() {
    this.title = 'FIELD';
    this.selected = 'select a field';
    this.options = ['random'];
  }

  handleChange() {
    this.onSelect({field: this.selected});
  }
}

function ddWatcherAggField() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=watcher',
      onSelect: '&',
    },
    controller:  DdWatcherAggField,
    controllerAs: 'ddWatcherAggField',
    bindToController: true,
  };
}

export default ddWatcherAggField;
