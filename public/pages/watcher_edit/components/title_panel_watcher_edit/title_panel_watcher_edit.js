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
        handleChange: (schedule) => {
          this.onScheduleChange({schedule});
        },
      },
      human: {
        enabled: false,
        handleChange: (schedule) => {
          this.onScheduleChange({schedule});
        },
      },
    };
  }

  $onInit() {
    this._watcher = cloneDeep(this.watcher);
  }

  get title() {
    return this._watcher._source.title;
  }

  set title(title) {
    this._watcher._source.title = title;
    this.onTitleChange({ title });
  }

  setIndex(index) {
    index = !index ? [] : index.split(',');
    this._watcher._source.input.search.request.index = index;
    this.onIndexChange({ index });
  }

  get index() {
    if (Array.isArray(this._watcher._source.input.search.request.index)) {
      return this._watcher._source.input.search.request.index.join(',');
    }
    return this._watcher._source.input.search.request.index;
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
      watcher: '<',
      onScheduleChange: '&',
      onIndexChange: '&',
      onTitleChange: '&',
    },
    controller:  TitlePanelWatcherEdit,
    controllerAs: 'titlePanelWatcherEdit',
    bindToController: true,
  };
}

export default titlePanelWatcherEdit;
