import template from './dd_watcher_agg_over.html';

class DdWatcherAggOver {
  constructor($scope) {
    this.$scope = $scope;
    this.aggOverOptions = this.aggOverOptions || this.$scope.aggOverOptions;
    this.indexTextFields = this.indexTextFields || this.$scope.indexTextFields;
    this.aggOverOnSelect = this.aggOverOnSelect || this.$scope.aggOverOnSelect;
    this.textLimit = this.textLimit || this.$scope.textLimit;

    this.title = 'over';
    this.options = ['all docs', 'top'];
    const { type, n, field } = this.aggOverOptions;
    this.selectedType = type;
    this.top = {
      enabled: type === 'top',
      n: n || 3,
      field,
    };

    this.$scope.$watch('ddWatcherAggField.indexTextFields', () => {
      if (this.indexTextFields.length && !this.top.field) {
        this.top.field = this.indexTextFields[0];
        this.handleChange();
      }
    });
  }

  get overHow() {
    return this.top.enabled ? 'grouped over' : 'over';
  }

  handleChange() {
    if (this.selectedType !== 'top') {
      this.top.enabled = false;
      this.aggOverOnSelect({
        over: {
          type: this.selectedType,
        }
      });
    } else {
      this.top.enabled = true;
      this.top.field = this.top.field || (!!this.indexTextFields.length ? this.indexTextFields[0] : null);
      this.aggOverOnSelect({
        over: {
          type: 'top',
          n: this.top.n,
          field: this.top.field,
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
      indexTextFields: '=',
      aggOverOnSelect: '&',
    },
    controller:  DdWatcherAggOver,
    controllerAs: 'ddWatcherAggOver',
    bindToController: {
      textLimit: '=',
      aggOverOptions: '=',
      indexTextFields: '=',
      aggOverOnSelect: '&',
    },
  };
}

export default ddWatcherAggOver;
