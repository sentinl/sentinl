/* global angular */

import Alarm from './alarm/index';
import Report from './report/index';
import Script from './script/index';
import User from './user/index';
import Watcher from './watcher/index';
import DataTransfer from './data_transfer/index';
import NavMenu from './nav_menu/index';
import ServerConfig from './server_config/index';
import SentinlHelper from './sentinl_helper/index';

export default angular.module('apps/sentinl.services', [
  Alarm.name,
  Report.name,
  Script.name,
  User.name,
  Watcher.name,
  NavMenu.name,
  DataTransfer.name,
  ServerConfig.name,
  SentinlHelper.name,
]);
