import { uiModules } from 'ui/modules';
import common from './common';
import emailWatcher from './email_watcher';
import reportWatcher from './report_watcher';
import watcherScript from './watcher_script';

const module = uiModules.get('apps/sentinl', []);
module
  .constant('COMMON', common)
  .constant('EMAILWATCHER', emailWatcher)
  .constant('REPORTWATCHER', reportWatcher)
  .constant('WATCHERSCRIPT', watcherScript);
