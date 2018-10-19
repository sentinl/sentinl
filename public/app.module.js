/* global angular */
import { uiModules } from 'ui/modules';
import 'bootstrap/dist/js/bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import '@elastic/eui/dist/eui_theme_light.css';
import 'angular-touch';
import 'angular-ui-bootstrap';
import 'chart.js';
import 'angular-chart.js';
import Filters from './filters';
import Pages from './pages';
import Services from './services';
import Directives from './directives';
import Components from './components';

import './constants';
import './components/ui_code_editor';

const app = uiModules.get('apps/sentinl', [
  'ui.bootstrap',
  'chart.js',
  Filters.name,
  Pages.name,
  Services.name,
  Directives.name,
  Components.name,
]);

app.config(function (ChartJsProvider) {
  'ngInject';
  // Configure all charts
  ChartJsProvider.setOptions({
    chartColors: ['#0074D9', '#FF4136'],
    responsive: true,
  });
});

export { app };
