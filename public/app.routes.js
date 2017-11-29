import uiRoutes from 'ui/routes';

import watchers from './templates/watchers.html';
import editor from './templates/editor.html';
import wizard from './templates/wizard.html';
import about from './templates/about.html';
import alarms from './templates/alarms.html';
import reports from './templates/reports.html';

uiRoutes.enable();

uiRoutes
.when('/?', {
  template: watchers,
  controller: 'WatchersController',
  resolve: {
    currentTime($http) {
      return $http.get('../api/sentinl/time').then((resp) => resp.data.time);
    }
  }
});

uiRoutes
.when('/editor/:watcherId?', {
  template: editor,
  controller: 'EditorController',
  resolve: {
    currentTime: function ($http) {
      return $http.get('../api/sentinl/time').then((resp) => resp.data.time);
    }
  }
});

uiRoutes
.when('/wizard/:watcherId?', {
  template: wizard,
  controller: 'EditorController',
  resolve: {
    currentTime: function ($http) {
      return $http.get('../api/sentinl/time').then((resp) => resp.data.time);
    }
  }
});

uiRoutes
.when('/alarms', {
  template: alarms,
  controller: 'AlarmsController',
  resolve: {
    currentTime: function ($http) {
      return $http.get('../api/sentinl/time').then((resp) => resp.data.time);
    }
  }
});

uiRoutes
.when('/reports', {
  template: reports,
  controller: 'ReportsController',
  resolve: {
    currentTime: function ($http) {
      return $http.get('../api/sentinl/time').then((resp) => resp.data.time);
    }
  }
});

uiRoutes
.when('/about', {
  template: about,
  controller: 'AboutController',
  resolve: {
    currentTime: function ($http) {
      return $http.get('../api/sentinl/time').then((resp) => resp.data.time);
    }
  }
});
