/* global angular */
import { uiModules } from 'ui/modules';
import 'bootstrap/dist/js/bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'angular-animate';
import 'angular-touch';
import 'angular-ui-bootstrap';
import Filters from './filters';
import Pages from './pages';
import Services from './services';
import Directives from './directives';
import Components from './components';

import './constants';

const app = uiModules.get('apps/sentinl', [
  'ui.bootstrap',
  Filters.name,
  Pages.name,
  Services.name,
  Directives.name,
  Components.name,
]);

export { app };
