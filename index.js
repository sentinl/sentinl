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

import {existsSync, readFileSync, appendFileSync, chmodSync} from 'fs';
import urljoin from 'url-join';
import {join} from 'path';
import { forEach, difference } from 'lodash';
import {listAllFilesSync} from './server/lib/helpers';

export default function (kibana) {
  let requirements = ['kibana', 'elasticsearch'];

  // Siren: check if saved objects api exists.
  const savedObjectsAPI = `${kibana.rootDir}/src/siren_core_plugins/saved_objects_api`;
  if (existsSync(savedObjectsAPI)) {
    requirements.push('saved_objects_api');

    // Siren: import saved objects api related libs.
    let pathForLibs = `${kibana.rootDir}/siren_plugins/sentinl/public/app.js`;
    pathForLibs = existsSync(pathForLibs) ? pathForLibs : `${kibana.rootDir}/plugins/sentinl/public/app.js`;

    const libsToImport = [
      'import \'./services/siren/saved_watchers/index\';',
      'import \'./services/siren/saved_users/index\';',
      'import \'./services/siren/saved_scripts/index\';'
    ];

    const data = readFileSync(pathForLibs);
    const libs = data.toString().trim().split('\n');

    forEach(difference(libsToImport, libs), (lib) => {
      appendFileSync(pathForLibs, `${lib}\n`);
    });
  }

  const phantomjsDefaultPath = urljoin(__dirname, 'node_modules/phantomjs-prebuilt/bin/phantomjs');
  chmodSync(phantomjsDefaultPath, '755');

  let chromeDefaultPath = urljoin(__dirname, '/node_modules/puppeteer/.local-chromium');
  try {
    chromeDefaultPath = listAllFilesSync(chromeDefaultPath).filter((f) => f.split('/').pop() === 'chrome');
    if (chromeDefaultPath.length !== 1) {
      throw new Error('puppeter chrome was not found');
    }
    chromeDefaultPath = chromeDefaultPath[0];
    chmodSync(chromeDefaultPath, '755');
  } catch (err) {
    chromeDefaultPath = null;
    console.log(`[sentinl] fail to make report engine executable: ${err.message}!`);
  }

  return new kibana.Plugin({
    require: requirements,
    uiExports: {
      spyModes: ['plugins/sentinl/dashboard_spy_button/alarm_button'],
      mappings: require('./server/mappings/sentinl.json'),
      app: {
        title: 'Sentinl',
        description: 'Kibana Alert App for Elasticsearch',
        main: 'plugins/sentinl/app',
        icon: 'plugins/sentinl/style/sentinl.svg',
        injectVars: function (server, options) {
          var config = server.config();
          return {
            kbnIndex: config.get('kibana.index'),
            esShardTimeout: config.get('elasticsearch.shardTimeout'),
            esApiVersion: config.get('elasticsearch.apiVersion'),
            sentinlConfig: {
              appName: config.get('sentinl.app_name'),
              es: {
                watcher: {
                  schedule_timezone: config.get('sentinl.es.watcher.schedule_timezone')
                }
              }
            }
          };
        }
      },
    },
    config: function (Joi) {
      return Joi.object({
        app_name: Joi.string().default('Sentinl'),
        enabled: Joi.boolean().default(true),
        sentinl: Joi.any().forbidden().error(new Error(
          'Option "sentinl.sentinl.results" was deprecated. Use "sentinl.es.results" instead!'
        )),
        es: Joi.object({
          allow_no_indices: Joi.boolean().default(false),
          ignore_unavailable: Joi.boolean().default(false),
          default_index: Joi.string().default('.kibana'),
          default_type: Joi.string().default('doc'),
          results: Joi.number().default(50),
          host: Joi.string().default('localhost'),
          protocol: Joi.string().default('http'),
          port: Joi.number().default(9200),
          timefield: Joi.string().default('@timestamp'),
          timezone: Joi.string().default('Europe/Amsterdam'),
          type: Joi.any().forbidden().error(new Error(
            'Option "sentinl.es.type" was deprecated. Use "sentinl.es.default_type" instead!'
          )),
          alarm_index: Joi.string().default('watcher_alarms'),
          user_type: Joi.string().default('sentinl-user'),
          watcher_type: Joi.string().default('sentinl-watcher'),
          script_type: Joi.string().default('sentinl-script'),
          alarm_type: Joi.string().default('sentinl-alarm'),
          watcher: Joi.object({
            schedule_timezone: Joi.string().default('utc'), // local, utc
            trigger: Joi.number().default(3),
            throttle: Joi.number().default(1),
            recover: Joi.number().default(15000)
          }).default(),
        }).default(),
        settings: Joi.object({
          authentication: Joi.object({
            https: Joi.any().forbidden().error(new Error(
              'Option "sentinl.settings.authentication.https" was deprecated. Use "sentinl.es.protocol" instead!'
            )),
            verify_certificate: Joi.any().forbidden().error(new Error(
              'Option "sentinl.settings.authentication.verify_certificate" was deprecated.' +
              +'Use "sentinl.settings.authentication.cert.selfsigned" instead!'
            )),
            path_to_pem: Joi.any().forbidden().error(new Error(
              'Option "sentinl.settings.authentication.path_to_pem" was deprecated. Use "sentinl.settings.authentication.cert.pem" instead!'
            )),
            admin_username: Joi.any().forbidden().error(new Error(
              'Option "sentinl.settings.authentication.admin_username" was deprecated.' +
              +'Use "sentinl.settings.authentication.username" instead!'
            )),
            admin_sha: Joi.any().forbidden().error(new Error(
              'Option "sentinl.settings.authentication.admin_sha" was deprecated. Use "sentinl.settings.authentication.sha" instead!'
            )),
            mode: Joi.any().forbidden().error(new Error(
              'Option "sentinl.settings.authentication.mode" was deprecated. Use "sentinl.settings.authentication.enabled" instead!'
            )),
            user_index: Joi.any().forbidden().error(new Error(
              'Option "sentinl.settings.authentication.user_index" was deprecated. Users are saved in the default index!'
            )),
            user_type: Joi.any().forbidden().error(new Error(
              'Option "sentinl.settings.authentication.user_type" was deprecated. Use "sentinl.es.user_type" instead!'
            )),
            enabled: Joi.boolean().default(false),
            impersonate: Joi.boolean().default(false),
            username: Joi.string().default('elastic'),
            password: Joi.string().default('password'),
            sha: Joi.string(),
            cert: Joi.object({
              selfsigned: Joi.boolean().default(true),
              pem: Joi.string(),
            }).default(),
            encryption: Joi.object({
              algorithm: Joi.string().default('AES-256-CBC'),
              key: Joi.string().default('b9726b04608ac48ecb0b6918214ade54'),
              iv_length: Joi.number().default(16)
            }).default(),
          }).default(),
          cluster: Joi.object({
            enabled: Joi.boolean().default(false),
            debug: Joi.boolean().default(false),
            name: Joi.string().default('sentinl'),
            priority_for_master: Joi.number().default(0),
            loop_delay: Joi.number().default(5),
            absent_time: Joi.number().default(15),
            absent_time_for_delete: Joi.number().default(86400),
            cert: Joi.object({
              selfsigned: Joi.boolean().default(true),
              valid: Joi.number().default(10),
              key: Joi.string().default(undefined),
              cert: Joi.string().default(undefined),
            }).default(),
            gun: Joi.object({
              port: Joi.number().default(9000),
              host: Joi.string().default('localhost'),
              cache: Joi.string().default('data.json'),
              peers: Joi.array(),
            }).default(),
            host: Joi.object({
              id: Joi.string().default('123'),
              name: Joi.string().default('trex'),
              node: Joi.string().default('hosts'),
              priority: Joi.number().default(0),
            }).default(),
          }).default(),
          email: Joi.object({
            active: Joi.boolean().default(false),
            host: Joi.string().default('localhost'),
            user: Joi.string(),
            password: Joi.string(),
            port: Joi.number().default(25),
            domain: Joi.string(),
            ssl: Joi.boolean().default(false),
            tls: Joi.boolean().default(false),
            cert: Joi.object({
              key: Joi.string(), // full system path
              cert: Joi.string(), // full system path
              ca: Joi.string(), // full system path
            }),
            authentication: Joi.array().default(['PLAIN', 'LOGIN', 'CRAM-MD5', 'XOAUTH2']),
            timeout: Joi.number().default(5000),
          }).default(),
          slack: Joi.object({
            active: Joi.boolean().default(false),
            username: Joi.string(),
            hook: Joi.string(),
            channel: Joi.string(),
          }).default(),
          webhook: Joi.object({
            active: Joi.boolean().default(false),
            use_https: Joi.boolean().default(false),
            method: Joi.string().default('POST'),
            host: Joi.string(),
            port: Joi.number(),
            path: Joi.string().default(':/{{payload.watcher_id}'),
            body: Joi.string().default('{{payload.watcher_id}}{payload.hits.total}}')
          }).default(),
          report: Joi.object({
            active: Joi.boolean().default(true),
            engine: Joi.string().default('puppeter'), // options: puppeteer, horseman
            phantomjs_path: Joi.string().default(phantomjsDefaultPath),
            chrome_path: Joi.string().default(chromeDefaultPath),
            executable_path: Joi.any().forbidden().error(new Error(
              'Option "report.executable_path" was deprecated. Use "report.chrome_path" instead!'
            )),
            auth: Joi.object({
              css_selectors: Joi.object({
                searchguard: Joi.object({
                  username: Joi.string().default('form input[name="username"]'),
                  password: Joi.string().default('form input[name="password"]'),
                  login_btn: Joi.string().default('form button.btn.btn-login'),
                }).default(),
                xpack: Joi.object({
                  username: Joi.string().default('form input[data-test-subj="loginUsername"]'),
                  password: Joi.string().default('form input[data-test-subj="loginPassword"]'),
                  login_btn: Joi.string().default('form button[data-test-subj="loginSubmit"]'),
                }).default(),
              }).default(),
            }).default(),
            debug: Joi.object({
              headless: Joi.boolean().default(true),
              devtools: Joi.boolean().default(false),
            }).default(),
            search_guard: Joi.any().forbidden().error(new Error(
              'Option "report.search_guard" was deprecated. Use "report.authentication.mode.searchguard" instead!'
            )),
            simple_authentication: Joi.any().forbidden().error(new Error(
              'Option "report.simple_authentication" was deprecated. Use "report.authentication.mode.basic" instead!'
            )),
            tmp_path: Joi.any().forbidden().error(new Error(
              'Option "report.tmp_path" is not needed anymore. Just delete it from config!'
            )),
            authentication: Joi.object({
              enabled: Joi.any().forbidden().error(new Error(
                'Option "report.authentication.enabled" was deprecated. Enable per watcher instead: ' +
                'watcher._source.actions[name].report.auth.active=true'
              )),
              mode: Joi.object({
                searchguard: Joi.any().forbidden().error(new Error(
                  'Option "report.authentication.mode.searchguard" was deprecated. Enable mode per watcher instead: ' +
                  'watcher._source.actions[name].report.auth.mode="searchguard". Options: searchguard, xpack, basic, custom.'
                )),
                xpack: Joi.any().forbidden().error(new Error(
                  'Option "report.authentication.mode.xpack" was deprecated. Enable mode per watcher instead: ' +
                  'watcher._source.actions[name].report.auth.mode="xpack". Options: searchguard, xpack, basic, custom.'
                )),
                basic: Joi.any().forbidden().error(new Error(
                  'Option "report.authentication.mode.basic" was deprecated. Enable mode per watcher instead: ' +
                  'watcher._source.actions[name].report.auth.mode="basic". Options: searchguard, xpack, basic, custom.'
                )),
                custom: Joi.any().forbidden().error(new Error(
                  'Option "report.authentication.mode.custom" was deprecated. Enable mode per watcher instead: ' +
                  'watcher._source.actions[name].report.auth.mode="customselector". Options: searchguard, xpack, basic, custom.'
                )),
              }).default(),
              custom: Joi.object({
                username_input_selector: Joi.any().forbidden().error(new Error(
                  'Option "report.authentication.custom.username_input_selector" was deprecated. Put selector per watcher instead.' +
                  'For example, watcher._source.actions[name].report.auth.selector_username="#user".'
                )),
                password_input_selector: Joi.any().forbidden().error(new Error(
                  'Option "report.authentication.custom.password_input_selector" was deprecated. Put selector per watcher instead.' +
                  'For example, watcher._source.actions[name].report.auth.selector_password="#pass".'
                )),
                login_btn_selector: Joi.any().forbidden().error(new Error(
                  'Option "report.authentication.custom.login_btn_selector" was deprecated. Put selector per watcher instead.' +
                  'For example, watcher._source.actions[name].report.auth.selector_login_btn=".btn-lg".'
                )),
              }).default(),
            }).default(),
            file: Joi.object({
              pdf: Joi.object({
                format: Joi.any().forbidden().error(new Error(
                  'Option "report.file.pdf.format" was deprecated. Set delay per watcher instead: ' +
                  'watcher._source.actions[name].report.snapshot.pdf_format="A4"'
                )),
                landscape: Joi.any().forbidden().error(new Error(
                  'Option "report.file.pdf.landscape" was deprecated. Set format per watcher instead: ' +
                  'watcher._source.actions[name].report.snapshot.pdf_landscape=true'
                )),
              }).default(),
              screenshot: Joi.any().forbidden().error(new Error(
                'Option "report.file.screenshot" was deprecated. Set resolution per watcher,' +
                ' for example watcher._source.actions[name].report.snapshot.res="1920x1080"'
              )),
            }).default(),
            timeout: Joi.any().forbidden().error(new Error(
              'Option "report.timeout" was deprecated. Set timeout per watcher instead: ' +
              'watcher._source.actions[name].report.snapshot.params.delay=5000'
            )),
          }).default(),
          pushapps: Joi.object({
            active: Joi.boolean().default(false),
            api_key: Joi.string()
          }).default()
        }).default()
      }).default();
    },
    init: require('./init.js')
  });
};
