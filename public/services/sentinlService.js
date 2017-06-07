/* global angular */
import _ from 'lodash';
import { app } from '../app.module';

const Promise = require('bluebird');

app.service('sentinlService', ['$http', function ($http) {

  // update timepicker filter
  this.updateFilter = function (timeInterval) {
    return Promise.resolve($http.get('../api/sentinl/set/interval/' + angular.toJson(timeInterval).replace(/\//g, '%2F')));
  };

  this.listAlarms = function () {
    return Promise.resolve($http.get('../api/sentinl/list/alarms'));
  };

  this.listReports = function () {
    return Promise.resolve($http.get('../api/sentinl/list/reports'));
  };

}]);
