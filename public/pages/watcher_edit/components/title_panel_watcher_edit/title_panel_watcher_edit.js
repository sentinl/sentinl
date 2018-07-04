import { has, size, cloneDeep, get } from 'lodash';
import template from './title_panel_watcher_edit.html';

class TitlePanelWatcherEdit {
  constructor($scope, sentinlLog) {
    this.$scope = $scope;
    this.watcher = this.watcher || this.$scope.watcher;
    this.onScheduleChange = this.onScheduleChange || this.$scope.onScheduleChange;

    this.log = sentinlLog;
    this.log.initLocation('TitlePanelWatcheredit');

    this.schedule = {
      selected: get(this.watcher, '_source.wizard.chart_query_params.scheduleType') || 'every',
      options: ['every', 'human'],
      handleChange: (mode, text) => {
        // this.watcher._source.wizard.chart_query_params.scheduleType = this.schedule.selected;
        // this.watcher._source.trigger.schedule.later = text;
        this.onScheduleChange({mode, text});
      },
    };
  }

  handleModeChange() {
    if (this.schedule.selected === 'every') {
      this.schedule.handleChange('every', 'every 1 minutes');
    } else {
      this.schedule.handleChange('human', 'at 15:35');
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

function titlePanelWatcherEdit() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=',
      onScheduleChange: '&',
    },
    controller:  TitlePanelWatcherEdit,
    controllerAs: 'titlePanelWatcherEdit',
    bindToController: {
      watcher: '=',
      onScheduleChange: '&',
    },
  };
}

export default titlePanelWatcherEdit;
