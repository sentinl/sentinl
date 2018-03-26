class WatcherEdit {
  constructor($scope, $injector, navMenu) {
    const $route = $injector.get('$route');
    this.watcher = $route.current.locals.watcher;
    this.$scope = $scope;
    this.topNavMenu = navMenu.getTopNav('editor');
    this.tabsMenu = navMenu.getTabs('editor', [{ name: 'Edit', url: '#/editor' }]);
  }
}

export default WatcherEdit;
