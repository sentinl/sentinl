import template from './dd_watcher_agg_time.html';

class DdWatcherAggTime {
  constructor($scope) {
    this.$scope = $scope;
    this.aggTimeOptions = this.aggTimeOptions || this.$scope.aggTimeOptions;
    this.aggTimeOnSelect = this.aggTimeOnSelect || this.$scope.aggTimeOnSelect;
    this.textLimit = this.textLimit || this.$scope.textLimit;

    this.title = 'last';
    this.options = ['seconds', 'minutes', 'hours', 'days', 'months', 'years'];
    this.selected = this.aggTimeOptions.unit || 'minutes';
    this.number = this.aggTimeOptions.n || 15;
  }

  handleChange() {
    this.aggTimeOnSelect({unit: this.selected, n: this.number});
  }
}

function ddWatcherAggTime() {
  return {
    template,
    restrict: 'E',
    scope: {
      aggTimeOptions: '=',
      aggTimeOnSelect: '&',
      textLimit: '=',
    },
    controller:  DdWatcherAggTime,
    controllerAs: 'ddWatcherAggTime',
    bindToController: {
      aggTimeOptions: '=',
      aggTimeOnSelect: '&',
      textLimit: '=',
    },
  };
}

export default ddWatcherAggTime;
