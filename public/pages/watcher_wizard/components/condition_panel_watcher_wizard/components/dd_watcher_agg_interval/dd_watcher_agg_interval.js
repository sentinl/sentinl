import template from './dd_watcher_agg_interval.html';

class DdWatcherAggInterval {
  constructor($scope) {
    this.$scope = $scope;
    this.aggIntervalOptions = this.aggIntervalOptions || this.$scope.aggIntervalOptions;
    this.aggIntervalOnSelect = this.aggIntervalOnSelect || this.$scope.aggIntervalOnSelect;
    this.textLimit = this.textLimit || this.$scope.textLimit;

    this.title = 'INTERVAL';
    this.options = ['seconds', 'minutes', 'hours', 'days', 'months', 'years'];
    this.selected = this.aggIntervalOptions.unit || 'minutes';
    this.number = this.aggIntervalOptions.n || 15;
  }

  handleChange() {
    this.aggIntervalOnSelect({unit: this.selected, n: this.number});
  }
}

function ddWatcherAggInterval() {
  return {
    template,
    restrict: 'E',
    scope: {
      aggIntervalOptions: '=',
      aggIntervalOnSelect: '&',
      textLimit: '=',
    },
    controller:  DdWatcherAggInterval,
    controllerAs: 'ddWatcherAggInterval',
    bindToController: {
      aggIntervalOptions: '=',
      aggIntervalOnSelect: '&',
      textLimit: '=',
    },
  };
}

export default ddWatcherAggInterval;
