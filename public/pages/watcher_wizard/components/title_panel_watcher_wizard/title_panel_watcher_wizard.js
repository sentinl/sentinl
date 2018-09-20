import { has, size, cloneDeep, get } from 'lodash';
import template from './title_panel_watcher_wizard.html';

class TitlePanelWatcherWizard {
  constructor($scope, sentinlLog) {
    this.$scope = $scope;
    this.titleText = this.titleText || this.$scope.titleText || 'Watcher';
    this._indexInputDisabled = (this.indexInputDisabled || this.$scope.indexInputDisabled) !== undefined;
    this.watcher = this.watcher || this.$scope.watcher;
    this.onScheduleChange = this.onScheduleChange || this.$scope.onScheduleChange;
    this.onIndexChange = this.onIndexChange || this.$scope.onIndexChange;

    this.log = sentinlLog;
    this.log.initLocation('TitlePanelWatcherWizard');

    this.schedule = {
      selected: get(this.watcher, 'wizard.chart_query_params.scheduleType') || 'every',
      options: ['every', 'text'],
      handleChange: (mode, text) => {
        this.onScheduleChange({mode, text});
      },
    };
  }

  handleModeChange() {
    if (this.schedule.selected === 'every') {
      this.schedule.handleChange('every', 'every 1 minutes');
    } else {
      this.schedule.handleChange('text', 'at 15:35');
    }
  }

  showScheduleMode(mode) {
    return this.schedule.selected === mode;
  }

  isValidationMessageVisible(fieldName, errorType, showIfOtherErrors = true) {
    if (!this.form[fieldName]) {
      return false;
    }

    let showMessage = (this.form[fieldName].$touched || this.form[fieldName].$dirty) && this.form[fieldName].$error[errorType];
    if (showMessage && !showIfOtherErrors && size(this.form[fieldName].$error) > 1) {
      showMessage = false;
    }
    return showMessage;
  }
}

function titlePanelWatcherWizard() {
  return {
    template,
    restrict: 'E',
    scope: {
      titleText: '@',
      indexInputDisabled: '@',
      watcher: '=',
      onScheduleChange: '&',
      onIndexChange: '&',
    },
    controller:  TitlePanelWatcherWizard,
    controllerAs: 'titlePanelWatcherWizard',
    bindToController: {
      titleText: '@',
      indexInputDisabled: '@',
      watcher: '=',
      onScheduleChange: '&',
      onIndexChange: '&',
    },
  };
}

export default titlePanelWatcherWizard;
