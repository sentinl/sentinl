class WatcherRawEdit {
  constructor($scope, $injector, navMenu, sentinlLog, createNotifier, confirmModal, kbnUrl, Watcher, User) {
    const $route = $injector.get('$route');
    this.$scope = $scope;
    this.confirmModal = confirmModal;
    this.kbnUrl = kbnUrl;
    this.watcherService = Watcher;
    this.userService = User;

    this.locationName = 'WatcherRawEdit';
    this.log = sentinlLog;
    this.log.initLocation(this.locationName);
    this.notify = createNotifier({
      location: this.locationName,
    });

    this.watcher = $route.current.locals.watcher;
    try {
      this.watcherSourceText = JSON.stringify(this.watcher._source, null, 2);
    } catch (err) {
      this.log.error(`Parse watcher doc: ${err.message}`);
    }

    this.topNavMenu = navMenu.getTopNav('editor');
    this.tabsMenu = navMenu.getTabs('editor', [{ name: `Advanced: ${this.watcher._id}`, url: '#/editor' }]);

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
        this.notify.error(`watcher syntax is invalid: ${err.message}`);
      }
    });
  }

  _cancelWatcherEditor() {
    this.kbnUrl.redirect('/');
  }

  async _saveWatcherSource() {
    try {
      this.watcher._source = JSON.parse(this.watcherSourceText);
      const id = await this.watcherService.save(this.watcher);
      if (this.watcher.username && this.watcher.password) {
        await this.userService.new(id, this.watcher.username, this.watcher.password);
      }
      this._cleanWatcher(this.watcher);
      this._cancelWatcherEditor();
    } catch (err) {
      this.notify.error(`fail to save watcher: ${err.message}`);
    }
  }

  _cleanWatcher(watcher) {
    delete watcher.password;
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

export default WatcherRawEdit;
