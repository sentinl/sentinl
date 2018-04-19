/* global angular */
import { uiModules } from 'ui/modules';
import 'bootstrap/dist/js/bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'angular-animate';
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

  // // Configure all line charts
  // ChartJsProvider.setOptions('line', {
  //   showLines: false
  // });
});

export { app };
