import moment from 'moment';
import chrome from 'ui/chrome';
import uiModules from 'ui/modules';
import uiRoutes from 'ui/routes';

// import 'ui/autoload/styles';
import './less/main.less';
import template from './templates/index.html';

var impactLogo = require('plugins/kaae/kaae.svg');

chrome
  .setBrand({
    'logo': 'url(' + impactLogo + ') left no-repeat',
    'smallLogo': 'url(' + impactLogo + ') left no-repeat',
    'title': 'Kaae'
  })
  .setNavBackground('#222222')
  .setTabs([]);

uiRoutes.enable();
uiRoutes
.when('/', {
  template,
  resolve: {
    currentTime($http) {
      return $http.get('../api/kaae/example').then(function (resp) {
        return resp.data.time;
      });
    },
    currentItems($http) {
      return $http.get('../api/kaae/getitems').then(function (resp) {
        return resp.data.items;
      });
    }
  }
})

uiModules
.get('api/kaae', [])
.controller('kaaeHelloWorld', function ($scope, $route, $interval) {
  $scope.title = 'Kaae';
  $scope.description = 'Kibana Alert App for Elasticsearch';

  $scope.items = $route.current.locals.currentItems;

  var currentTime = moment($route.current.locals.currentTime);
  $scope.currentTime = currentTime.format('HH:mm:ss');
  var unsubscribe = $interval(function () {
    $scope.currentTime = currentTime.add(1, 'second').format('HH:mm:ss');
  }, 1000);
  $scope.$watch('$destroy', unsubscribe);

  $scope.items = [];
  $scope.iackd = [];

});
