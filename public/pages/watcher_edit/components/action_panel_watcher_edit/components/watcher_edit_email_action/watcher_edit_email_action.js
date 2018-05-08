import template from './watcher_edit_email_action.html';

import {cloneDeep} from 'lodash';

class WatcherEditEmailAction {
  constructor($scope) {
    this.$scope = $scope;
    this.type = 'email';
    this.status = {
      isOpen: false,
    };
    this.priority = {
      selected: 'low',
      options: ['low', 'medium', 'high'],
      handleChange: () => {
        this.settings.email.priority = this.priority.selected;
      },
    };
    this.$scope.$watch('watcherEditEmailAction.status.isOpen', () => {
      if (!this.status.isOpen) {
        this.emailActionPersist({origActionName: this.emailActionName, newActionName: this.name, actionSettings: this.settings});
      }
    });
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
    this.name = this.emailActionName;
    this.settings = cloneDeep(this.emailActionSettings);
  }

  deleteAction() {
    this.emailActionDelete({origActionName: this.emailActionName});
  }
}

function watcherEditEmailAction() {
  return {
    template,
    restrict: 'E',
    scope: {
      emailActionName: '@',
      emailActionSettings: '<',
      emailActionPersist: '&',
      emailActionDelete: '&',
    },
    controller:  WatcherEditEmailAction,
    controllerAs: 'watcherEditEmailAction',
    bindToController: true,
  };
}

export default watcherEditEmailAction;
