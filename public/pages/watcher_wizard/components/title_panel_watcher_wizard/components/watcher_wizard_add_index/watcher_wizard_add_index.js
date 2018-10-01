import SentinlError from '../../../../../../lib/sentinl_error';
import template from './watcher_wizard_add_index.html';

class WatcherWizardAddIndex {
  constructor($scope, watcherWizardEsService, getNotifier, sentinlLog) {
    this.$scope = $scope;
    this.watcher = this.watcher || this.$scope.watcher;
    this.onIndexChange = this.onIndexChange || this.$scope.onIndexChange;

    this.locationName = 'WatcherWizardAddIndex';
    this.notify = getNotifier.create({
      location: this.locationName,
    });
    this.log = sentinlLog;
    this.log.initLocation(this.locationName);
    this.watcherWizardEsService = watcherWizardEsService;
    this.selected = this._getIndex();
  }

  _getIndex() {
    if (Array.isArray(this.watcher.input.search.request.index)) {
      return this.watcher.input.search.request.index.join(',');
    }
    return this.watcher.input.search.request.index;
  }

  async getIndexNames(name) {
    try {
      let indexes = await this.watcherWizardEsService.getAllIndexes();
      return this._filterIndexesByNamePrefix(indexes, this.selected);
    } catch (err) {
      err = new SentinlError('Get index names', err);
      this.notify(err);
      this.log.error(err);
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
