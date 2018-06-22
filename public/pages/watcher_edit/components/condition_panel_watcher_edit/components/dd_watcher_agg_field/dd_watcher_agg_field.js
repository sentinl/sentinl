import template from './dd_watcher_agg_field.html';

class DdWatcherAggField {
  constructor($scope) {
    this.$scope = $scope;
    this.aggEnabled = this.aggEnabled || this.$scope.aggEnabled;
    this.activeField = this.activeField || this.$scope.activeField;
    this.timeField = this.timeField || this.$scope.timeField;
    this.fieldNames = this.fieldNames || this.$scope.fieldNames;
    this.onSelectField = this.onSelectField || this.$scope.onSelectField;

    this.title = 'FIELD';
  }

  handleChange() {
    this.onSelectField({
      field: this.activeField,
      timeField: this.timeField,
    });
  }

  _shortTitle(fieldName) {
    if (fieldName && fieldName.length > 7) {
      return fieldName.substring(0, 6) + '...';
    }
    return fieldName || '';
  }

  get activeFieldTitle() {
    return this._shortTitle(this.activeField);
  }

  get timeFieldTitle() {
    return this._shortTitle(this.timeField);
  }
}

function ddWatcherAggField() {
  return {
    template,
    restrict: 'E',
    scope: {
      aggEnabled: '=',
      activeField: '@',
      timeField: '@',
      fieldNames: '=',
      onSelectField: '&',
    },
    controller:  DdWatcherAggField,
    controllerAs: 'ddWatcherAggField',
    bindToController: {
      aggEnabled: '=',
      activeField: '@',
      timeField: '@',
      fieldNames: '=',
      onSelectField: '&',
    },
  };
}

export default ddWatcherAggField;
