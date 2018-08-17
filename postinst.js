/*
 * Copyright 2018, Andrew Gallagher (andrewg@andrewg.com)
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

'use strict';

var fs = require('fs');
var path = require('path');
const helpers = require('./server/lib/helpers');

function makeExecutableIfNecessary(filename) {
  try {
    fs.accessSync(filename, fs.constants.X_OK);
  } catch (err) {
    fs.chmodSync(filename, '755');
  }
}

let phantomjsDefaultPath = path.join(__dirname, 'node_modules/phantomjs-prebuilt/bin/phantomjs');
try {
  makeExecutableIfNecessary(phantomjsDefaultPath);
} catch (err) {
  phantomjsDefaultPath = null;
  console.log(`[sentinl] fail to make phantomjs executable: ${err.message}!`);
}

let chromeDefaultPath = path.join(__dirname, '/node_modules/puppeteer/.local-chromium');
try {
  chromeDefaultPath = helpers.listAllFilesSync(chromeDefaultPath).filter((f) => f.split('/').pop() === 'chrome');
  if (chromeDefaultPath.length !== 1) {
    throw new Error('puppeter chrome was not found');
  }
  chromeDefaultPath = chromeDefaultPath[0];
  makeExecutableIfNecessary(chromeDefaultPath);
} catch (err) {
  chromeDefaultPath = null;
  console.log(`[sentinl] fail to make report engine executable: ${err.message}!`);
}
