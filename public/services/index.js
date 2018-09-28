/* global angular */

import DataTransfer from './data_transfer/index';
import NavMenu from './nav_menu/index';
import SentinlLog from './sentinl_log/index';
import SentinlHelper from './sentinl_helper/index';
import WatcherFactory from './watcher_factory/index';
import UserFactory from './user_factory/index';
import AlarmFactory from './alarm_factory/index';
import ReportFactory from './report_factory/index';

export default angular.module('apps/sentinl.services', [
  NavMenu.name,
  DataTransfer.name,
  SentinlLog.name,
  SentinlHelper.name,
  WatcherFactory.name,
  UserFactory.name,
  AlarmFactory.name,
  ReportFactory.name,
]);

