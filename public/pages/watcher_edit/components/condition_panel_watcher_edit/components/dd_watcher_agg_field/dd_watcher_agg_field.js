import template from './dd_watcher_agg_field.html';
// import {uniq} from 'lodash';

class DdWatcherAggField {
  constructor() {
    this.title = 'FIELD';
  }

  handleChange() {
    this.onSelectField({
      field: this.activeField,
      timeField: this.timeField,
    });
  }

  $onInit() {}

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

  // get deduplicatedFieldNames() {
  //   if (this.fieldNames) {
  //     return uniq(this.fieldNames);
  //   }
  //   return [];
  // }
}

function ddWatcherAggField() {
  return {
    template,
    restrict: 'E',
    scope: {
      aggEnabled: '=',
      activeField: '@',
      timeField: '@',
      fieldNames: '<',
      onSelectField: '&',
    },
    controller:  DdWatcherAggField,
    controllerAs: 'ddWatcherAggField',
    bindToController: true,
  };
}

export default ddWatcherAggField;
