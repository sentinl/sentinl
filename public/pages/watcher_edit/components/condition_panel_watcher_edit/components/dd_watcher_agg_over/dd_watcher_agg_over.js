import template from './dd_watcher_agg_over.html';

class DdWatcherAggOver {
  constructor($scope) {
    this.$scope = $scope;
    this.aggOverOptions = this.aggOverOptions || this.$scope.aggOverOptions;
    this.aggFieldNames = this.aggFieldNames || this.$scope.aggFieldNames;
    this.aggOverOnSelect = this.aggOverOnSelect || this.$scope.aggOverOnSelect;

    this.title = 'OVER';
    this.options = ['all docs', 'top'];
    const {type, n, field} = this.aggOverOptions;
    this.selected = type;
    this.top = {
      enabled: type === 'top',
      n,
      selected: field,
    };
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
          n: this.top.n,
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
      aggOverOptions: '=',
      aggFieldNames: '=',
      aggOverOnSelect: '&',
    },
    controller:  DdWatcherAggOver,
    controllerAs: 'ddWatcherAggOver',
    bindToController: {
      aggOverOptions: '=',
      aggFieldNames: '=',
      aggOverOnSelect: '&',
    },
  };
}

export default ddWatcherAggOver;
