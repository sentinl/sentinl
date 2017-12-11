/* global angular */

import Alarm from './alarm';
import Report from './report';
import Script from './script';
import User from './user';
import Watcher from './watcher';
import dataTransfer from './data_transfer';
import navMenu from './nav_menu';

export default angular.module('apps/sentinl.services', [
  Alarm.name,
  Report.name,
  Script.name,
  User.name,
  Watcher.name,
  navMenu.name,
  dataTransfer.name
]);
