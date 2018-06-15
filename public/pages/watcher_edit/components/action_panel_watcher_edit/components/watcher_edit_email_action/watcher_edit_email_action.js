import template from './watcher_edit_email_action.html';

import {cloneDeep} from 'lodash';

class WatcherEditEmailAction {
  constructor($scope) {
    this.$scope = $scope;
    this.type = 'email';
    this.status = {
      isOpen: false,
    };
  }

  aceOptions(mode, lines = 10) {
    return {
      mode: mode,
      useWrapMode : true,
      showGutter: true,
      rendererOptions: {
        maxLines: lines,
        minLines: 5
      },
      editorOptions: {
        autoScrollEditorIntoView: false
      },
    };
  };

  $onInit() {
    this.actionSettings.name = this.actionName;
    this.priority = {
      selected: this.actionSettings.email.priority,
      options: ['low', 'medium', 'high'],
      handleChange: () => {
        this.actionSettings.email.priority = this.priority.selected;
      },
    };
  }

  deleteAction() {
    this.actionDelete({origActionName: this.actionName});
  }
}

function watcherEditEmailAction() {
  return {
    template,
    restrict: 'E',
    scope: {
      actionName: '@',
      actionSettings: '<',
      actionDelete: '&',
      onTrigger: '=',
    },
    controller:  WatcherEditEmailAction,
    controllerAs: 'watcherEditEmailAction',
    bindToController: true,
  };
}

export default watcherEditEmailAction;
