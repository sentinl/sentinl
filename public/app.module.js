/* global angular */
import { uiModules } from 'ui/modules';
import 'angular-ui-bootstrap';
import Filters from './filters';
import Controllers from './controllers';

const app = uiModules.get('apps/sentinl', [
  'ui.bootstrap',
  Filters.name,
  Controllers.name
]);

export { app };
