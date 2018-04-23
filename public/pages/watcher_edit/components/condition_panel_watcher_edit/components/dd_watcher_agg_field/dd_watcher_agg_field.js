import template from './dd_watcher_agg_field.html';

class DdWatcherAggField {
  constructor() {
    this.title = 'FIELD';
    this.selected = 'select a field';
  }

  handleChange() {
    this.aggFieldOnSelect({field: this.selected});
  }

  $onInit() {
    this.options = this.aggFieldFields;
  }
}

function ddWatcherAggField() {
  return {
    template,
    restrict: 'E',
    scope: {
      aggFieldFields: '<',
      aggFieldOnSelect: '&',
    },
    controller:  DdWatcherAggField,
    controllerAs: 'ddWatcherAggField',
    bindToController: true,
  };
}

export default ddWatcherAggField;
