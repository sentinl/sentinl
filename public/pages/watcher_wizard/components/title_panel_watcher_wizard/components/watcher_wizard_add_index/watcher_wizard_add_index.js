import template from './watcher_wizard_add_index.html';

class WatcherWizardAddIndex {
  constructor($scope, watcherWizardEsService, createNotifier, sentinlLog) {
    this.$scope = $scope;
    this.watcher = this.watcher || this.$scope.watcher;
    this.onIndexChange = this.onIndexChange || this.$scope.onIndexChange;

    this.locationName = 'WatcherWizardAddIndex';
    this.notify = createNotifier({
      location: this.locationName,
    });
    this.log = sentinlLog;
    this.log.initLocation(this.locationName);
    this.watcherWizardEsService = watcherWizardEsService;
    this.selected = this._getIndex();
  }

  _getIndex() {
    if (Array.isArray(this.watcher._source.input.search.request.index)) {
      return this.watcher._source.input.search.request.index.join(',');
    }
    return this.watcher._source.input.search.request.index;
  }

  async getIndexNames(name) {
    try {
      let indexes = await this.watcherWizardEsService.getAllIndexes();
      return this._filterIndexesByNamePrefix(indexes, this.selected);
    } catch (err) {
      this.notify(err.message);
      this.log.error(err.message);
    }
  }

  _filterIndexesByNamePrefix(indexes, namePrefix) {
    const re = new RegExp(namePrefix + '.*', 'gi');
    return indexes.filter((i) => i.index.match(re));
  }

  handleChange() {
    const index = !this.selected ? [] : this.selected.split(',');
    this.onIndexChange({index});
  }
}

function watcherWizardAddIndex() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=',
      onIndexChange: '&',
    },
    controller:  WatcherWizardAddIndex,
    controllerAs: 'watcherWizardAddIndex',
    bindToController: {
      watcher: '=',
      onIndexChange: '&',
    },
  };
}

export default watcherWizardAddIndex;
