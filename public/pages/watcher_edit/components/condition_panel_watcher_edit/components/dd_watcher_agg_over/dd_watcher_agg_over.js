import template from './dd_watcher_agg_over.html';

class DdWatcherAggOver {
  constructor() {
    this.title = 'OVER';
    this.options = ['all docs', 'top'];
    this.top = {
      enabled: false,
      num_of_values: 3,
      selected: '',
      options: [],
    };
  }

  $onInit() {
    this.selected = this.aggOverOptions.type || 'all docs';
    if (this.aggOverOptions === 'top') {
      this.top.enabled = true;
      this.top.num_of_values = this.aggOverOptions.n;
      this.top.selected = this.aggOverOptions.field;
    }
    this.top.options = this.aggOverFields;
  }

  handleChange() {
    if (this.selected !== 'top') {
      this.top.enabled = false;
      this.aggOverOnSelect({
        over: {
          type: this.selected,
        }
      });
    } else {
      this.top.enabled = true;
      this.aggOverOnSelect({
        over: {
          type: 'top',
          n: this.top.num_of_values,
          field: this.top.selected,
        }
      });
    }
  }
}

function ddWatcherAggOver() {
  return {
    template,
    restrict: 'E',
    scope: {
      aggOverOptions: '<',
      aggOverFields: '<',
      aggOverOnSelect: '&',
    },
    controller:  DdWatcherAggOver,
    controllerAs: 'ddWatcherAggOver',
    bindToController: true,
  };
}

export default ddWatcherAggOver;
