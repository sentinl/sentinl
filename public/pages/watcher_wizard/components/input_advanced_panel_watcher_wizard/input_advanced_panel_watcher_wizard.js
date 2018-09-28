/* global angular */

import template from './input_advanced_panel_watcher_wizard.html';

class InputAdvancedPanelWatcherWizard {
  constructor($scope, sentinlLog, sentinlHelper) {
    this.$scope = $scope;
    this.watcher = this.watcher || this.$scope.watcher;
    this.sentinlHelper = sentinlHelper;
    this.onInputAdvChange = this.onInputAdvChange || this.$scope.onInputAdvChange;
    this.aceOptions = this.aceOptions || this.$scope.aceOptions;

    this.log = sentinlLog;
    this.log.initLocation('InputAdvancedPanelWatcherWizard');

    this.init = {
      watcherSource: this.sentinlHelper.pickWatcherSource(this.watcher)
    };

    this.raw = {
      input: angular.toJson(this.init.watcherSource.input, true),
      condition: angular.toJson(this.init.watcherSource.condition, true),
    };
  }

  handleChange(key) {
    try {
      this.onInputAdvChange({ [key]: JSON.parse(this.raw[key]) });
    } catch (err) {
      this.log.debug(`editing "${key}" JSON in ace editor: ` + err.toString());
    }
  }
}

function inputAdvancedPanelWatcherWizard() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=',
      aceOptions: '&',
      onInputAdvChange: '&',
    },
    controller:  InputAdvancedPanelWatcherWizard,
    controllerAs: 'inputAdvancedPanelWatcherWizard',
    bindToController: {
      watcher: '=',
      aceOptions: '&',
      onInputAdvChange: '&',
    },
  };
}

export default inputAdvancedPanelWatcherWizard;
