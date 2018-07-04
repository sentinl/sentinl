import template from './dd_watcher_agg_threshold.html';

class DdWatcherAggThreshold {
  constructor($scope) {
    this.$scope = $scope;
    this.aggThresholdOptions = this.aggThresholdOptions || this.$scope.aggThresholdOptions;
    this.aggThresholdOnSelect = this.aggThresholdOnSelect || this.$scope.aggThresholdOnSelect;
    this.textLimit = this.textLimit || this.$scope.textLimit;

    this.options = ['above', 'below', 'above eq', 'below eq'];
    this.number = this.aggThresholdOptions.n || 5;
    this.selected = this.aggThresholdOptions.direction || 'above';
  }

  handleChange() {
    this.aggThresholdOnSelect({direction: this.selected, n: this.number});
  }
}

function ddWatcherAggThreshold() {
  return {
    template,
    restrict: 'E',
    scope: {
      aggThresholdOptions: '=',
      aggThresholdOnSelect: '&',
      textLimit: '=',
    },
    controller:  DdWatcherAggThreshold,
    controllerAs: 'ddWatcherAggThreshold',
    bindToController: {
      aggThresholdOptions: '=',
      aggThresholdOnSelect: '&',
      textLimit: '=',
    },
  };
}

export default ddWatcherAggThreshold;
