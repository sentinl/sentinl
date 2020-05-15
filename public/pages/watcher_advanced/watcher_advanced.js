/* global angular */
import { assign } from 'lodash';
import { SentinlError } from '../../services';
import { toastNotificationsFactory } from '../../factories';

const toastNotifications = toastNotificationsFactory();

class WatcherAdvanced {
  constructor($scope, $injector, navMenu, sentinlLog, confirmModal, kbnUrl,
    sentinlHelper, sentinlConfig, watcherService, userService) {
    const $route = $injector.get('$route');
    this.$scope = $scope;
    this.confirmModal = confirmModal;
    this.kbnUrl = kbnUrl;
    this.sentinlHelper = sentinlHelper;

    this.watcherService = watcherService;
    this.userService = userService;

    this.log = sentinlLog;
    this.log.initLocation('Advanced watcher');

    this.watcher = $route.current.locals.watcher;
    this.init = {
      watcherSource: this.sentinlHelper.pickWatcherSource(this.watcher)
    };

    try {
      this.watcherSourceText = angular.toJson(this.init.watcherSource, true);
    } catch (err) {
      this.errorMessage('parse watcher doc', err);
    }

    this.topNavMenu = navMenu.getTopNav('editor');
    this.tabsMenu = navMenu.getTabs('editor', [{ name: `Advanced: ${this.watcher.id || 'new watcher'}`, url: '#/editor' }]);

    this.$scope.$on('navMenu:cancelEditor', () => {
      const confirmModalOptions = {
        onCancel: () => true,
        onConfirm: () => this._cancelWatcherEditor(),
        confirmButtonText: 'Yes',
      };
      this.confirmModal('Stop configuring this watcher?', confirmModalOptions);
    });

    this.$scope.$on('navMenu:saveEditor', () => {
      try {
        JSON.parse(this.watcherSourceText);
        const confirmModalOptions = {
          onCancel: () => true,
          onConfirm: () => this._saveWatcherSource(),
          confirmButtonText: 'Yes',
        };
        this.confirmModal('Save this watcher?', confirmModalOptions);
      } catch (err) {
        this.errorMessage('watcher syntax is invalid', err);
      }
    });
  }

  _cancelWatcherEditor() {
    this.kbnUrl.redirect('/');
  }

  async _saveWatcherSource() {
    try {
      assign(this.watcher, angular.fromJson(this.watcherSourceText));
      const password = this.watcher.password;
      delete this.watcher.password;

      const id = await this.watcherService.save(this.watcher);
      if (id) {
        toastNotifications.addSuccess('watcher saved: ' + id);

        if (this.watcher.username && password) {
          await this.userService.new(id, this.watcher.username, password);
        }

        this._cancelWatcherEditor();
      }
    } catch (err) {
      this.errorMessage('save watcher', err);
    }
  }

  errorMessage(message, err) {
    err = new SentinlError(message, err);
    this.log.error(err);
    toastNotifications.addDanger(err);  }

  updateWatcherDoc({ value }) {
    this.watcherSourceText = value;
  }
}

export default WatcherAdvanced;
