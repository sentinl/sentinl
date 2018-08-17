import template from './dd_watcher_agg_field.html';

class DdWatcherAggField {
  constructor($scope) {
    this.$scope = $scope;
    this.aggEnabled = this.aggEnabled || this.$scope.aggEnabled;
    this.activeField = this.activeField || this.$scope.activeField;
    this.timeField = this.timeField || this.$scope.timeField;
    this.fieldNames = this.fieldNames || this.$scope.fieldNames;
    this.onSelectField = this.onSelectField || this.$scope.onSelectField;
    this.onSelectTimeField = this.onSelectTimeField || this.$scope.onSelectTimeField;
    this.textLimit = this.textLimit || this.$scope.textLimit;

    this.title = 'field';
  }

  handleFieldChange() {
    this.onSelectField({
      field: this.activeField,
    });
  }

  handleTimeFieldChange() {
    this.onSelectTimeField({
      timeField: this.timeField,
    });
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
      onSelectTimeField: '&',
      textLimit: '=',
    },
    controller:  DdWatcherAggField,
    controllerAs: 'ddWatcherAggField',
    bindToController: {
      aggEnabled: '=',
      activeField: '@',
      timeField: '@',
      fieldNames: '=',
      onSelectField: '&',
      onSelectTimeField: '&',
      textLimit: '=',
    },
  };
}

export default ddWatcherAggField;
