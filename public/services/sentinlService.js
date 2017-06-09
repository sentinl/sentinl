/* global angular */
import _ from 'lodash';
import { app } from '../app.module';

app.service('sentinlService', ['$http', function ($http) {

  // update timepicker filter
  this.updateFilter = function (timeInterval) {
    return $http.get('../api/sentinl/set/interval/' + angular.toJson(timeInterval).replace(/\//g, '%2F'));
  };

  this.listAlarms = function () {
    return $http.get('../api/sentinl/list/alarms');
  };

  this.listReports = function () {
    return $http.get('../api/sentinl/list/reports');
  };

  this.deleteAlarm = function (index, type, id) {
    return $http.delete(`../api/sentinl/alarm/${index}/${type}/${id}`);
  };

}]);
