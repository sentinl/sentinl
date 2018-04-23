import {has, size} from 'lodash';
import template from './title_panel_watcher_edit.html';

class TitlePanelWatcherEdit {
  constructor($log) {
    this.$log = $log;

    this.schedule = {
      every: {
        enabled: true,
      },
      human: {
        enabled: false,
      },
      selected: 'every',
      options: ['every', 'human'],
      handleChange: () => {
        this.$log.debug('schedule type changed:', this.schedule.selected);
        if (this.schedule.selected === 'every') {
          this.schedule.every.enabled = true;
          this.schedule.human.enabled = false;
        } else {
          this.schedule.every.enabled = false;
          this.schedule.human.enabled = true;
        }
      },
    };
  }

  get title() {
    return this.watcher._source.title;
  }

  set title(title) {
    this.watcher._source.title = title;
  }

  get index() {
    if (has(this.watcher._source, 'input.search.request.index')) {
      if (Array.isArray(this.watcher._source.input.search.request.index)) {
        return this.watcher._source.input.search.request.index.join(',');
      }
      return this.watcher._source.input.search.request.index;
    }
  }

  set index(indices) {
    if (!indices) {
      this.watcher._source.input.search.request.index = [];
    } else {
      this.watcher._source.input.search.request.index = indices.split(',');
    }
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
      watcher: '=watcher',
    },
    controller:  TitlePanelWatcherEdit,
    controllerAs: 'titlePanelWatcherEdit',
    bindToController: true,
  };
}

export default titlePanelWatcherEdit;
