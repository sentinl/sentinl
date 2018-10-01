import moment from 'moment';

function AboutController($scope, $route, $interval, navMenu,
  globalNavState, COMMON, sentinlConfig) {
  'ngInject';

  $scope.app = {
    name: sentinlConfig.appName,
    logo: sentinlConfig.appName.toLowerCase() === 'sentinl' ? 'sentinl-logo-about' : 'siren-logo-about',
  };

  $scope.title = COMMON.about.title;
  $scope.description = COMMON.description;

  $scope.topNavMenu = navMenu.getTopNav('about');
  $scope.tabsMenu = navMenu.getTabs('about');

  if (!$scope.notified) {
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
