import template from './watcher_edit_add_index.html';

class WatcherEditAddIndex {
  constructor($scope, watcherEditorEsService, createNotifier, sentinlLog) {
    this.$scope = $scope;
    this.watcher = this.watcher || this.$scope.watcher;
    this.onIndexChange = this.onIndexChange || this.$scope.onIndexChange;

    this.locationName = 'WatcherEditAddIndex';
    this.notify = createNotifier({
      location: this.locationName,
    });
    this.log = sentinlLog;
    this.log.initLocation(this.locationName);
    this.watcherEditorEsService = watcherEditorEsService;
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
      let indexes = await this.watcherEditorEsService.getAllIndexes();
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

function watcherEditAddIndex() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=',
      onIndexChange: '&',
    },
    controller:  WatcherEditAddIndex,
    controllerAs: 'watcherEditAddIndex',
    bindToController: {
      watcher: '=',
      onIndexChange: '&',
    },
  };
}

export default watcherEditAddIndex;
