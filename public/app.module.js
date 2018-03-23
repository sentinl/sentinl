/* global angular */
import { uiModules } from 'ui/modules';
import 'angular-ui-bootstrap';
import Filters from './filters';
import Pages from './pages';
import Services from './services';
import Directives from './directives';

import './constants';

const app = uiModules.get('apps/sentinl', [
  'ui.bootstrap',
  Filters.name,
  Pages.name,
  Services.name,
  Directives.name,
]);

export { app };
