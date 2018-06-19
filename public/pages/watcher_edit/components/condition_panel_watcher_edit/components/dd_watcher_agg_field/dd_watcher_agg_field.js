import template from './dd_watcher_agg_field.html';

class DdWatcherAggField {
  constructor() {
    this.title = 'FIELD';
  }

  handleChange() {
    this.aggFieldOnSelect({field: this.selected});
  }

  $onInit() {
    // this.options = this.aggFieldNames;
    this.selected = this.aggActiveFieldName;
  }
}

function ddWatcherAggField() {
  return {
    template,
    restrict: 'E',
    scope: {
      aggActiveFieldName: '@',
      aggFieldNames: '<',
      aggFieldOnSelect: '&',
    },
    controller:  DdWatcherAggField,
    controllerAs: 'ddWatcherAggField',
    bindToController: true,
  };
}

export default ddWatcherAggField;
