import template from './watcher_edit_add_action.html';

class Actions {
  static types = ['email'];
  static email() {
    const settings = {
      name: 'An action',
      throttle_period: '1s',
      email: {
        priority: 'low',
      },
    };
    return {name: settings.name, settings};
  }
}

class WatcherEditAddAction {
  constructor($scope) {
    this.$scope = $scope;
    this.onAdd = this.onAdd || this.$scope.onAdd;

    this.status = {
      isOpen: false,
    };
    this.actions = Actions.types;
  }

  addAction(actionType) {
    const {name, settings} = Actions.email();
    this.onAdd({actionName: name, actionSettings: settings});
  }
}

function watcherEditAddAction() {
  return {
    template,
    restrict: 'E',
    scope: {
      onAdd: '&',
    },
    controller:  WatcherEditAddAction,
    controllerAs: 'watcherEditAddAction',
    bindToController: {
      onAdd: '&',
    },
  };
}

export default watcherEditAddAction;
