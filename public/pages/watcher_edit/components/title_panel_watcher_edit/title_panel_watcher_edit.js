import {has, size} from 'lodash';
import template from './title_panel_watcher_edit.html';

class TitlePanelWatcherEdit {
  constructor(sentinlConfig) {
    this.config = sentinlConfig;
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

  get schedule() {
    return this.watcher._source.trigger.schedule.later;
  }

  set schedule(interval) {
    this.watcher._source.trigger.schedule.later = interval;
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
