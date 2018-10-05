import template from './dd_watcher_agg_field.html';

class DdWatcherAggField {
  constructor($scope) {
    this.$scope = $scope;
    this.aggEnabled = this.aggEnabled || this.$scope.aggEnabled;
    this.indexDateFields = this.indexDateFields || this.$scope.indexDateFields;
    this.indexNumericFields = this.indexNumericFields || this.$scope.indexNumericFields;
    this.selectedNumericField = this.selectedNumericField || this.$scope.selectedNumericField;
    this.selectedDateField = this.selectedDateField || this.$scope.selectedDateField;
    this.onSelectField = this.onSelectField || this.$scope.onSelectField;
    this.onSelectTimeField = this.onSelectTimeField || this.$scope.onSelectTimeField;
    this.textLimit = this.textLimit || this.$scope.textLimit;

    this.title = 'field';

    this.$scope.$watch('ddWatcherAggField.indexDateFields', () => {
      if (this.indexDateFields.length && !this.selectedDateField) {
        this.selectedDateField = this.indexDateFields[0];
        this.handleTimeFieldChange();
      }
    });

    this.$scope.$watchGroup([
      'ddWatcherAggField.fieldNames.indexNumericFields',
      'ddWatcherAggField.aggEnabled'
    ], () => {
      if (this.indexNumericFields.length && !this.selectedNumericField && this.aggEnabled) {
        this.selectedNumericField = this.indexNumericFields[0];
        this.handleFieldChange();
      }
    });
  }

  handleFieldChange() {
    this.onSelectField({
      field: this.selectedNumericField,
    });
  }

  handleTimeFieldChange() {
    this.onSelectTimeField({
      timeField: this.selectedDateField,
    });
  }
}

function ddWatcherAggField() {
  return {
    template,
    restrict: 'E',
    scope: {
      aggEnabled: '=',
      indexDateFields: '=',
      indexNumericFields: '=',
      selectedNumericField: '@',
      selectedDateField: '@',
      onSelectField: '&',
      onSelectTimeField: '&',
      textLimit: '=',
    },
    controller:  DdWatcherAggField,
    controllerAs: 'ddWatcherAggField',
    bindToController: {
      aggEnabled: '=',
      indexDateFields: '=',
      indexNumericFields: '=',
      selectedNumericField: '@',
      selectedDateField: '@',
      onSelectField: '&',
      onSelectTimeField: '&',
      textLimit: '=',
    },
  };
}

export default ddWatcherAggField;
