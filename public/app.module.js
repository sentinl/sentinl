/* global angular */
import { uiModules } from 'ui/modules';

(function getSentinlModuleNames(orig) {
  angular.sentinlModuleNames = [];
  angular.module = function () {
    if (arguments.length > 1 && arguments[0].includes('apps/sentinl.')) {
      angular.sentinlModuleNames.push(arguments[0]);
    }
    return orig.apply(null, arguments);
  };
}(angular.module));

// Read for details: http://taoofcode.net/studying-the-angular-injector-loading-modules/
function registerModule(moduleName, providers, $injector) {
  const module = angular.module(moduleName);

  // Execute this fn for every module required
  if (module.requires) {
    module.requires.forEach(function (module) {
      registerModule(module);
    });
  }

  // Register all module services by their respective providers
  module._invokeQueue.forEach(function (invokeArgs) {
    const provider = providers[invokeArgs[0]];
    provider[invokeArgs[1]].apply(provider, invokeArgs[2]);
  });

  module._configBlocks.forEach(function (fn) {
    $injector.invoke(fn);
  });

  module._runBlocks.forEach(function (fn) {
    $injector.invoke(fn);
  });
}

const app = uiModules.get('apps/sentinl', [
  'ui.bootstrap',
  'chart.js',
]);

app.config(function (ChartJsProvider, $injector, $controllerProvider, $compileProvider, $filterProvider, $provide) {
  'ngInject';

  const providers = {
    $compileProvider,
    $controllerProvider,
    $filterProvider,
    $provide
  };

  try {
    angular.sentinlModuleNames.forEach(function (moduleName) {
      registerModule(moduleName, providers, $injector);
    });
  } catch (err) {
    err.message += ': dynamically register Sentinl modules';
    throw err;
  }

  // Configure all charts
  ChartJsProvider.setOptions({
    chartColors: ['#0074D9', '#FF4136'],
    responsive: true,
  });
});
