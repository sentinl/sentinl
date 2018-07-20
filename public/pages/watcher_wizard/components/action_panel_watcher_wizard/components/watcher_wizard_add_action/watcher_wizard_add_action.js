import template from './watcher_wizard_add_action.html';

class Actions {
  static types = ['email', 'report'];
  static email() {
    return {
      name: 'An email action',
      throttle_period: '15m',
      email: {
        priority: 'low',
        stateless: false,
      },
    };
  }
  static report() {
    return {
      name: 'A report',
      throttle_period: '15m',
      report: {
        priority: 'low',
        stateless: false,
        body: 'You can find the screenshot in the attachment.',
        save: true,
        snapshot: {
          res: '1920x1080',
          url: 'http://httpbin.org/basic-auth/user/passwd',
          params: {
            delay: 5000,
            crop: 'false'
          },
          type: 'png'
        }
      },
    };
  }
}

class WatcherWizardAddAction {
  constructor($scope) {
    this.$scope = $scope;
    this.onAdd = this.onAdd || this.$scope.onAdd;

    this.status = {
      isOpen: false,
    };
    this.actionTypes = Actions.types;
  }

  addAction(actionType) {
    let settings;
    if (actionType === 'report') {
      settings = Actions.report();
    } else {
      settings = Actions.email();
    }
    this.onAdd({actionName: settings.name, actionSettings: settings});
  }
}

function watcherWizardAddAction() {
  return {
    template,
    restrict: 'E',
    scope: {
      onAdd: '&',
    },
    controller:  WatcherWizardAddAction,
    controllerAs: 'watcherWizardAddAction',
    bindToController: {
      onAdd: '&',
    },
  };
}

export default watcherWizardAddAction;
