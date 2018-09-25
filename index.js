/*
 * Copyright 2016, Lorenzo Mangani (lorenzo.mangani@gmail.com)
 * Copyright 2015, Rao Chenlin (rao.chenlin@gmail.com)
 *
 * This file is part of Sentinl (http://github.com/sirensolutions/sentinl)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fs from 'fs';
import path from 'path';
import { forEach, difference } from 'lodash';
import appConfig from './app_config';

function getListOfModulesToImport(folders = [], foldersToOmit = []) {
  return folders
    .map(folder => fs.readdirSync(folder)
      .filter(folder => !foldersToOmit.includes(folder))
      .map(module => {
        const fullPath = path.join(folder, module).split('/');
        return `import './${path.join(...fullPath.slice(fullPath.length - 2, fullPath.length))}';`;
      }))
    .reduce((a, b) => [...a, ...b], []);
}

function getImportedLibs(appFile) {
  return fs.readFileSync(appFile).toString().trim().split('\n');
}

function appendLibs(appFile, libsToImport) {
  forEach(difference(libsToImport, getImportedLibs(appFile)), (lib) => {
    fs.appendFileSync(appFile, `${lib}\n`);
  });
}

export default function (kibana) {
  const requirements = ['kibana', 'elasticsearch'];
  const appFile = path.join(__dirname, 'public/app.js');

  const publicFolders = [
    './public/pages',
    './public/filters',
    './public/services',
    './public/constants',
    './public/directives',
  ].map(f => path.join(__dirname, f));

  const foldersToOmit = [
    '__tests__',
    'sentinl_api'
  ];

  const libsToImport = [
    'import \'ui/kbn_top_nav\';',
    'import \'ui/listen\';',
    'import \'ui/courier\';',
    'import \'ui/modals\';',
    'import \'ui/react_components\';', // confirmModal needs this
    'import \'angular-touch\';',
    'import \'angular-ui-bootstrap\';',
    'import \'ui/timepicker\';',
    'import \'ui/timefilter\';',
    'import \'chart.js\';',
    'import \'angular-chart.js\';',
    'import \'./style/main.less\';',
    'import \'ui/autoload/styles\';',
    'import \'font-awesome/css/font-awesome.css\';',
    'import \'bootstrap/dist/js/bootstrap\';',
    'import \'bootstrap/dist/css/bootstrap.css\';',
    'import \'./app.module\';',
    'import \'./app.routes\';',
    ...getListOfModulesToImport(publicFolders, foldersToOmit)
  ];

  appendLibs(appFile, libsToImport);

  return new kibana.Plugin({
    require: requirements,
    config: function (Joi) {
      return appConfig(Joi);
    },
    uiExports: {
      mappings: require('./server/mappings/sentinl.json'),
      navbarExtensions: [],
      uiSettingDefaults: {
        'sentinl:experimental': {
          value: false,
          description: 'Enable Experimental features in SENTINL'
        },
      },
      app: {
        title: 'Sentinl',
        description: 'Kibana Alert App for Elasticsearch',
        main: 'plugins/sentinl/app',
        icon: 'plugins/sentinl/style/sentinl.svg',
      },
    },
    init: require('./init.js')
  });
};
