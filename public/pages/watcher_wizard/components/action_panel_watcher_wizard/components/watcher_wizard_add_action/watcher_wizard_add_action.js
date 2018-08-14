import template from './watcher_wizard_add_action.html';
import {cloneDeep} from 'lodash';
import uuid from 'uuid/v4';

class WatcherWizardAddAction {
  constructor($scope, sentinlHelper) {
    this.$scope = $scope;
    this.sentinlHelper = sentinlHelper;
    this.onAdd = this.onAdd || this.$scope.onAdd;

    this.status = {
      isOpen: false,
    };
    this.actions = {
      Email: {
        name: 'Email alarm',
        throttle_period: '15m',
        email: {
          priority: 'low',
          stateless: false,
        },
      },
      'HTML email': {
        name: 'HTML email alarm',
        throttle_period: '1m',
        email_html: {
          html: '',
          priority: 'low',
          stateless: false
        }
      },
      Report: {
        name: 'Report screenshot',
        throttle_period: '15m',
        report: {
          auth: {
            mode: 'basic',
            active: false,
          },
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
        }
      },
      Console: {
        name: 'Console alarm',
        throttle_period: '1s',
        console: {
          priority: 'low',
          stateless: false,
        },
      },

    };
    this.actionTypes = Object.keys(this.actions);
  }

  _getActionId(name) {
    return name.split(' ').join('_') + '_' + uuid();
  }

  addAction(actionType) {
    this.onAdd({
      actionId: this._getActionId(this.actions[actionType].name),
      actionSettings: cloneDeep(this.actions[actionType]),
    });
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
