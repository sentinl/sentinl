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

import path from 'path';
import appConfig from './app_config';

export default function (kibana) {
  const kibanaPackage = path.resolve('package.json');
  let requirements = ['kibana', 'elasticsearch'];

  const appSettings = {
    require: requirements,
    uiExports: {
      mappings: require('./server/mappings/sentinl.json'),
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
    config: function (Joi) {
      return appConfig(Joi);
    },
    init: require('./init.js')
  };

  if (parseFloat(kibanaPackage.version) <= 6.2) {
    appSettings.uiExports.spyModes = ['plugins/sentinl/spy_modes/dashboard_spy_button/alarm_button'];
  }

  return new kibana.Plugin(appSettings);
};
