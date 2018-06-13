import { has, size, cloneDeep } from 'lodash';
import template from './title_panel_watcher_edit.html';

class TitlePanelWatcherEdit {
  constructor($scope, sentinlLog) {
    const locationName = 'TitlePanelWatcheredit';

    this.$scope = $scope;
    this.log = sentinlLog;
    this.log.initLocation(locationName);

    this.schedule = {
      selected: 'every',
      options: ['every', 'human'],
      switchMode: () => {
        this.log.debug('schedule mode changed:', this.schedule.selected);
        if (this.schedule.selected === 'every') {
          this.schedule.every.enabled = true;
          this.schedule.human.enabled = false;
        } else {
          this.schedule.every.enabled = false;
          this.schedule.human.enabled = true;
        }
      },
      every: {
        enabled: true,
      },
      human: {
        enabled: false,
      },
    };
  }

  $onInit() {}

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
      watcher: '<',
    },
    controller:  TitlePanelWatcherEdit,
    controllerAs: 'titlePanelWatcherEdit',
    bindToController: true,
  };
}

export default titlePanelWatcherEdit;
