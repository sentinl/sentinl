import template from './dd_watcher_agg_over.html';

class DdWatcherAggOver {
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
      this.onSelect({over: this.selected});
    } else {
      this.top.enabled = true;
      this.onSelect({
        over: {
          num_of_values: this.top.num_of_values,
          field_name: this.top.field_name,
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
      watcher: '=watcher',
      onSelect: '&',
    },
    controller:  DdWatcherAggOver,
    controllerAs: 'ddWatcherAggOver',
    bindToController: true,
  };
}

export default ddWatcherAggOver;
