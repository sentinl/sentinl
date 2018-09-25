import { existsSync, readFileSync, appendFileSync } from 'fs';
import { forEach, difference } from 'lodash';
import path from 'path';
import uiExports from './app_ui_exports';
import appConfig from './app_config';

function loadLibs(requirements) {
  requirements.push('saved_objects_api');

  const appFile = path.join(__dirname, '../public/app.js');
  const data = readFileSync(appFile);
  const libs = data.toString().trim().split('\n');

  const libsToImport = [
    `import './pages/custom_watcher';`;
  ];

  forEach(difference(libsToImport, libs), (lib) => {
    appendFileSync(appFile, `${lib}\n`);
  });

  return requirements;
}

export default function registerSirenApp(kibana, requirements) {
  uiExports.navbarExtensions = ['plugins/sentinl/dashboard_button/dashboard_button'];
  uiExports.spyModes = ['plugins/sentinl/dashboard_spy_button/alarm_button'];

  try {
    requirements = loadLibs(requirements);
  } catch (err) {
    err.message += ': put libs into app.js';
    throw err;
  }

  return new kibana.Plugin({
    requirements,
    uiExports,
    config: function (Joi) {
      return appConfig(Joi);
    },
    init: require('../init.js')
  });
}
