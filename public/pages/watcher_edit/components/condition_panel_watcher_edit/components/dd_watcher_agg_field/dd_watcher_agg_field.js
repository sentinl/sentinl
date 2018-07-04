import template from './dd_watcher_agg_field.html';

class DdWatcherAggField {
  constructor($scope) {
    this.$scope = $scope;
    this.aggEnabled = this.aggEnabled || this.$scope.aggEnabled;
    this.activeField = this.activeField || this.$scope.activeField;
    this.timeField = this.timeField || this.$scope.timeField;
    this.fieldNames = this.fieldNames || this.$scope.fieldNames;
    this.onSelectField = this.onSelectField || this.$scope.onSelectField;
    this.textLimit = this.textLimit || this.$scope.textLimit;

    this.title = 'FIELD';
  }

  shortText(text, limit) {
    if (text && text.length > limit) {
      return text.substring(0, limit - 1) + '...';
    }
    return text || '';
  }

  handleChange() {
    this.onSelectField({
      field: this.activeField,
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
      textLimit: '=',
    },
  };
}

export default ddWatcherAggField;
