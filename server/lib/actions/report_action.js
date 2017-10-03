import mustache from 'mustache';
import moment from 'moment';
import url from 'url';
import fs from 'fs';
import { resolve, promisify } from 'bluebird';
import { isKibi } from '../helpers';
import getConfiguration from '../get_configuration';
import getElasticsearchClient from '../get_elasticsearch_client';
import {
  horsemanFactory,
  horsemanSimpleAuth,
  horsemanNoAuth,
  horsemanSearchGuardKibana,
  horsemanSearchGuardKibi
} from './helpers/horseman_factory';

const readFile = promisify(fs.readFile);
const deleteFile = promisify(fs.unlink);
const existFile = promisify(fs.access);

const getScreenshot = function (file, stateless = false, save = true) {
  if (!stateless) {
    if (save) {
      //return readFile(file);
      return readFile(file)
      .then(function (data) {
        return new Buffer(data).toString('base64');
      });
    }
    resolve(null);
  }
  return existFile(file, fs.constants.X_OK)
  .then(deleteFile(file))
  .then(null);
};

export default function report(server, email, task, action, actionName, payload) {

  const config = getConfiguration(server);
  const client = getElasticsearchClient(server, config);

  if (!config.settings.report.active || (config.settings.report.active && !config.settings.email.active)) {
    Promise.reject('Reports Disabled: Action requires Email Settings!');
  }

  if (!action.report.snapshot.url.length) {
    Promise.reject('Report Disabled: No URL Settings!');
  }

  let domain = null;
  try {
    const parts = url.parse(action.report.snapshot.url);
    domain = parts.hostname;
  } catch (error) {
    Promise.reject('Fail to parse url.');
  }

  const formatterS = action.report.subject ? action.report.subject : `SENTINL: ${actionName}`;
  const formatterB = action.report.body ? action.report.body : 'Series Report {{payload._id}}: {{payload.hits.total}}';
  const subject = mustache.render(formatterS, { payload });
  const text = mustache.render(formatterB, { payload });
  server.log(['status', 'debug', 'Sentinl', 'report'], `Subject: ${subject}, Body: ${text}`);

  const priority = action.report.priority ? action.report.priority : 'INFO';
  const nowTime = moment().format('DD-MM-YYYY-h-m-s');
  const filename = `report-${Math.random().toString(36).substr(2, 9)}-${nowTime}.png`;
  const file = action.report.snapshot.path + filename;
  const attachment = [
    {
      data: '<html><img src=\'cid:my-report\' width=\'100%\'></html>'
    },
    {
      path: file,
      type: 'image/png',
      name: filename,
      headers: {
        'Content-ID': '<my-report>'
      }
    }
  ];

  return horsemanFactory(server, domain)
  .then(function (horseman) {
    if (config.settings.report.simple_authentication) {
      return horsemanSimpleAuth(
        horseman,
        action.report.snapshot.params.username,
        action.report.snapshot.params.password,
        action.report.snapshot.url,
        action.report.snapshot.params.delay,
        action.report.snapshot.res,
        file
      )
      .close();
    } else if (isKibi(server) && config.settings.report.search_guard) {
      return horsemanSearchGuardKibi(
        horseman,
        action.report.snapshot.params.username,
        action.report.snapshot.params.password,
        action.report.snapshot.url,
        action.report.snapshot.params.delay,
        action.report.snapshot.res,
        file
      )
      .close();
    } else if (config.settings.report.search_guard) {
      return horsemanSearchGuardKibana(
        horseman,
        action.report.snapshot.params.username,
        action.report.snapshot.params.password,
        action.report.snapshot.url,
        action.report.snapshot.params.delay,
        action.report.snapshot.res,
        file
      )
      .close();
    } else {
      return horsemanNoAuth(
        horseman,
        action.report.snapshot.url,
        action.report.snapshot.params.delay,
        action.report.snapshot.res,
        file
      )
      .close();
    }
  })
  .then(function () {
    return email.send({
      text,
      from: action.report.from,
      to: action.report.to,
      subject,
      attachment
    })
    .then(function (message) {
      server.log(['status', 'debug', 'Sentinl', 'email'], `Email sent. Watcher ${task._id}: ${message}`);
    });
  })
  .then(function () {
    return getScreenshot(file, action.report.stateless, action.report.save);
  });
}
