/* global angular */

import DataTransfer from './data_transfer/index';
import NavMenu from './nav_menu/index';
import SentinlLog from './sentinl_log/index';
import SentinlHelper from './sentinl_helper/index';
import WatcherService from './watcher_service';
import UserService from './user_service';
import AlarmService from './alarm_service';
import ReportService from './report_service';

const AngularServices = angular.module('apps/sentinl.services', [
  NavMenu.name,
  DataTransfer.name,
  SentinlLog.name,
  SentinlHelper.name,
  WatcherService.name,
  UserService.name,
  AlarmService.name,
  ReportService.name,
]);

export { AngularServices };
export { default as SentinlError } from './sentinl_error.js';
