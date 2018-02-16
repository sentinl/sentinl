/* global angular */
import { uiModules } from 'ui/modules';
import 'angular-ui-bootstrap';
import Filters from './filters';
import Pages from './pages';
import Services from './services';
import Directives from './directives';
import ConfirmMessage from './confirm_message';

import common from './constants/common';

const app = uiModules.get('apps/sentinl', [
  'ui.bootstrap',
  Filters.name,
  Pages.name,
  Services.name,
  Directives.name,
  ConfirmMessage.name
])
  .constant('COMMON', common);

export { app };
