import template from './dd_watcher_agg_type.html';

class DdWatcherAggType {
  constructor($scope) {
    this.$scope = $scope;
    this.aggTypeSelected = this.aggTypeSelected || this.$scope.aggTypeSelected;
    this.aggTypeOnSelect = this.aggTypeOnSelect || this.$scope.aggTypeOnSelect;

    this.title = 'WHEN';
    this.options = ['count', 'average', 'sum', 'min', 'max'];
    this.selected = this.aggTypeSelected || 'count';
  }

  handleChange() {
    this.aggTypeOnSelect({type: this.selected});
  }
}

function ddWatcherAggType() {
  return {
    template,
    restrict: 'E',
    scope: {
      aggTypeSelected: '=',
      aggTypeOnSelect: '&',
    },
    controller:  DdWatcherAggType,
    controllerAs: 'ddWatcherAggType',
    bindToController: {
      aggTypeSelected: '=',
      aggTypeOnSelect: '&',
    },
  };
}

export default ddWatcherAggType;
