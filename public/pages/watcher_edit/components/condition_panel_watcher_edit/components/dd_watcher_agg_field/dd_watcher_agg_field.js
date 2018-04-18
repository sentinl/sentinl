import template from './dd_watcher_agg_field.html';

class DdWatcherAggField {
  constructor() {
    this.title = 'OVER';
    this.selected = 'all docs';
    this.options = ['all docs', 'top'];
    this.top = {
      enabled: false,
      num_of_values: 5,
      field_name: '@timestamp',
    };
  }

  handleChange() {
    if (this.selected !== 'top') {
      this.top.enabled = false;
      this.onSelect({field: this.selected});
    } else {
      this.top.enabled = true;
      this.onSelect({
        field: {
          num_of_values: this.top.num_of_values,
          field_name: this.top.field_name,
        }
      });
    }
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
