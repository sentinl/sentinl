/* global angular */
import { assign } from 'lodash';

class WatcherAdvanced {
  constructor($scope, $injector, navMenu, sentinlLog, createNotifier, confirmModal, kbnUrl,
    sentinlHelper, sentinlConfig, watcherService, userService) {
    const $route = $injector.get('$route');
    this.$scope = $scope;
    this.confirmModal = confirmModal;
    this.kbnUrl = kbnUrl;
    this.sentinlHelper = sentinlHelper;

    this.watcherService = watcherService;
    this.userService = userService;

    this.locationName = 'WatcherAdvanced';
    this.log = sentinlLog;
    this.log.initLocation(this.locationName);
    this.notify = createNotifier({
      location: this.locationName,
    });

    this.watcher = $route.current.locals.watcher;
    this.init = {
      watcherSource: this.sentinlHelper.pickWatcherSource(this.watcher)
    };

    try {
      this.watcherSourceText = angular.toJson(this.init.watcherSource, true);
    } catch (err) {
      this.log.error(`Parse watcher doc: ${err.toString()}`);
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
        this.errorMessage(`watcher syntax is invalid: ${err.toString()}`);
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
        this.notify.info('watcher saved: ' + id);

        if (this.watcher.username && password) {
          await this.userService.new(id, this.watcher.username, password);
        }

        this._cancelWatcherEditor();
      }
    } catch (err) {
      this.errorMessage(err);
    }
  }

  errorMessage(err) {
    this.log.error(err);
    //this.notify.error(err); // Deprecated in Kibana 6.4
  }

  aceConfig(mode = 'json', maxLines = 50, minLines = 30) {
    return {
      mode,
      useWrapMode: true,
      showGutter: true,
      rendererOptions: {
        maxLines,
        minLines,
      },
      editorOptions: {
        autoScrollEditorIntoView: false,
      },
    };
  }
}

export default WatcherAdvanced;
