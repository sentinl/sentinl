import moment from 'moment';

function AboutController($scope, $route, $interval, timefilter, createNotifier, navMenu, globalNavState) {
  'ngInject';

  $scope.title = 'Sentinl: About';
  $scope.description = 'Kibi/Kibana Report App for Elasticsearch';
  timefilter.enabled = false;

  const notify = createNotifier({
    location: 'Sentinl About'
  });

  $scope.topNavMenu = navMenu.getTopNav('about');
  $scope.tabsMenu = navMenu.getTabs('about');
  navMenu.setKbnLogo(globalNavState.isOpen());
  $scope.$on('globalNavState:change', () => navMenu.setKbnLogo(globalNavState.isOpen()));

  if (!$scope.notified) {
    notify.warning('SENTINL is a work in progress! Use at your own risk!');
    $scope.notified = true;
  }

  var currentTime = moment($route.current.locals.currentTime);
  $scope.currentTime = currentTime.format('HH:mm:ss');
  var utcTime = moment.utc($route.current.locals.currentTime);
  $scope.utcTime = utcTime.format('HH:mm:ss');
  var unsubscribe = $interval(function () {
    $scope.currentTime = currentTime.add(1, 'second').format('HH:mm:ss');
    $scope.utcTime = utcTime.add(1, 'second').format('HH:mm:ss');
  }, 1000);
  $scope.$watch('$destroy', unsubscribe);
};

export default AboutController;
