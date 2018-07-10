import template from './dd_watcher_agg_over.html';

class DdWatcherAggOver {
  constructor($scope) {
    this.$scope = $scope;
    this.aggOverOptions = this.aggOverOptions || this.$scope.aggOverOptions;
    this.aggFieldNames = this.aggFieldNames || this.$scope.aggFieldNames;
    this.aggOverOnSelect = this.aggOverOnSelect || this.$scope.aggOverOnSelect;
    this.textLimit = this.textLimit || this.$scope.textLimit;

    this.title = 'over';
    this.options = ['all docs', 'top'];
    const {type, n, field} = this.aggOverOptions;
    this.selected = type;
    this.top = {
      enabled: type === 'top',
      n: n || 3,
      selected: field,
    };
  }

  get topN() {
    return this.top.enabled ? this.top.n : '';
  }

  get topEnabled() {
    return this.top.enabled ? 'grouped over' : 'over';
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
      textLimit: '=',
      aggOverOptions: '=',
      aggFieldNames: '=',
      aggOverOnSelect: '&',
    },
    controller:  DdWatcherAggOver,
    controllerAs: 'ddWatcherAggOver',
    bindToController: {
      textLimit: '=',
      aggOverOptions: '=',
      aggFieldNames: '=',
      aggOverOnSelect: '&',
    },
  };
}

export default ddWatcherAggOver;
