/* global angular */
import { assign, get, every, forEach } from 'lodash';
import 'ui/directives/siren_script_transcluder';
import './custom_watcher.less';

class CustomWatcher {
  constructor($scope, $route, $templateCache, navMenu, sentinlLog, createNotifier, confirmModal,
              kbnUrl, watcherService, userService, sentinlConfig, sentinlHelper, watcherWizardEsService) {
    this.$scope = $scope;
    this.watcherTemplate = $route.current.locals.watcherTemplate;
    $templateCache.put(this.watcherTemplate.id, this.watcherTemplate.template);
    this.watcher = $route.current.locals.watcher;
    this.watcher.custom.type = this.watcherTemplate.title;
    this.watcher.custom.params = this.watcher.custom.params || this.watcherTemplate.params;
    this.watcher.condition = {
      script: {
        script: `(${this.watcherTemplate.condition.toString()})()`
      }
    };

    watcherWizardEsService.getMapping([this.watcher.input.search.request.index])
      .then(response => Object.values(Object.values(response)[0].mappings)[0].properties)
      .then(mappings => this.flattenMapping(mappings))
      .then(mappings => this.data = {
        fields: Object.keys(mappings).sort(),
        geoFields: Object.entries(mappings).filter(([field, type]) => type === 'geo_point').map(([field, _]) => field)
      });

    this.topNavMenu = navMenu.getTopNav('editor');
    this.tabsMenu = navMenu.getTabs('editor');
    this.confirmModal = confirmModal;
    this.kbnUrl = kbnUrl;
    this.sentinlHelper = sentinlHelper;

    this.log = sentinlLog;
    this.log.initLocation('Custom watcher');
    this.notify = createNotifier({ location: 'Custom watcher' });
    this.eventListeners = [];

    this.eventListeners.push(this.$scope.$on('navMenu:cancelEditor', () => {
      const confirmModalOptions = {
        onCancel: () => true,
        onConfirm: () => this._redirect(),
        confirmButtonText: 'Yes',
      };
      this.confirmModal('Stop configuring this watcher?', confirmModalOptions);
    }));

    this.eventListeners.push(this.$scope.$on('navMenu:saveEditor', this.saveWatcher.bind(this)));
    $scope.$on('$destroy', () => this.eventListeners.forEach(cleanup => cleanup()));
  }

  flattenMapping(mapping, parent = '') {
    const flattenedMapping = {};

    forEach(mapping, (mapping, key) => {
      key = parent ? `${parent}.${key}` : key;
      flattenedMapping[key] = mapping.type || 'object';

      if (mapping.properties || mapping.fields) {
        assign(flattenedMapping, this.flattenMapping(mapping.properties || mapping.fields, key));
      }
    });

    return flattenedMapping;
  }

  _redirect() {
    this.kbnUrl.redirect('/');
  }

  saveWatcher() {
    try {
      if (this.areParamsFilledIn()) {
        const confirmModalOptions = {
          onCancel: () => true,
          onConfirm: () => this._saveWatcherSource(),
          confirmButtonText: 'Yes',
        };
        this.confirmModal('Save this watcher?', confirmModalOptions);
      } else {
        const confirmModalOptions = {
          onConfirm: () => true,
          onCancel: () => this._cancelWatcherWizard(),
          confirmButtonText: 'Continue configuring',
        };
        this.confirmModal('Not all parameters are filled in', confirmModalOptions);
      }
    } catch (err) {
      this.errorMessage(`Watcher syntax is invalid: ${err.toString()}`);
    }
  }

  areParamsFilledIn() {
    return every(this.watcher.custom.params, Boolean);
  }


  async _saveWatcherSource() {
    try {
      const id = await this.watcherService.save(this.watcher);
      if (id) {
        this.notify.info('Watcher saved: ' + id);

        if (this.watcher.username && this.watcher.password) {
          await this.userService.new(id, this.watcher.username, this.watcher.password);
        }

        delete this.watcher.password;
        this._redirect();
      }
    } catch (err) {
      this.errorMessage(err);
    }
  }

  actionAdd({ actionId, actionSettings }) {
    this.watcher.actions[actionId] = actionSettings;
  }

  actionDelete({ actionId }) {
    delete this.watcher.actions[actionId];
  }

  aceOptions({ mode = 'behaviour', maxLines = 10, minLines = 5 } = {}) {
    return {
      mode: mode,
      useWrapMode: true,
      showGutter: true,
      rendererOptions: {
        maxLines: maxLines,
        minLines: minLines,
      },
      editorOptions: {
        autoScrollWizardIntoView: false
      },
    };
  }

  scheduleChange(text) {
    this.watcher.trigger.schedule.later = text;
  }

  getQueryString() {
    return get(this.watcher, 'input.search.request.queries[0].query_string.query', '');
  }

  errorMessage(err) {
    this.log.error(err);
    this.notify.error(err);
  }
}

export default CustomWatcher;
