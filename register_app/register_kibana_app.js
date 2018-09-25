import appConfig from './app_config';

export default function registerKibanaApp(kibana, requirements) {
  return new kibana.Plugin({
    require: requirements,
    config: function (Joi) {
      return appConfig(Joi);
    },
    uiExports: require('./app_ui_exports'),
    init: require('../init.js')
  });
}
