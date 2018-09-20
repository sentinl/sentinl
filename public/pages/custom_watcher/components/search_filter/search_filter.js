import template from './search_filter.html';
import './search_filter.less';

class SearchFilter {
  constructor($scope) {
    this.$scope = $scope;
    this.queryString = this.queryString || this.$scope.queryString;
    this.filters = this.filters || this.$scope.filters;
  }
}

function searchFilter() {
  return {
    template,
    restrict: 'E',
    scope: {
      queryString: '@',
      filters: '=',
    },
    controller:  SearchFilter,
    controllerAs: 'searchFilter',
    bindToController: {
      queryString: '@',
      filters: '=',
    },
  };
}

export default searchFilter;
