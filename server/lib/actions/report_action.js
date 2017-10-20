import mustache from 'mustache';
import moment from 'moment';
import url from 'url';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { resolve, promisify, reject } from 'bluebird';
import { isKibi } from '../helpers';
import getConfiguration from '../get_configuration';
import getElasticsearchClient from '../get_elasticsearch_client';
import { horsemanFactory, horsemanReport } from './helpers/horseman_factory';
import uuid from 'uuid/v4';

const readFile = promisify(fs.readFile);
const deleteFile = promisify(fs.unlink);
const existFile = promisify(fs.access);

/**
* Get screenshot file or delete file
*
* @param {string} file - full path to screenshot file
* @param {boolean} save - save fale into ES
* @return {string} file - stringified buffer
* @return null
*/
const getFile = function (file, save = true) {
  if (save) {
    return readFile(file)
    .then(function (data) {
      return new Buffer(data).toString('base64');
    });
  }

  return existFile(file, fs.constants.X_OK)
  .then(deleteFile(file))
  .then(null);
};

/**
* Execute report action
*
* @param {object} server - Kibana hapi server
* @param {object} email - instance of emailjs server
* @param {object} task - watcher properties
* @param {object} action - current watcher action
* @param {string} actionName - name of the action
* @param {object} payload - ES response
*/
export default function report(server, email, task, action, actionName, payload) {

  const config = getConfiguration(server);
  const client = getElasticsearchClient(server, config);

  if (!config.settings.report.active || (config.settings.report.active && !config.settings.email.active)) {
    reject('Reports Disabled: Action requires Email Settings!');
  }

  if (!action.report.snapshot.url.length) {
    reject('Report Disabled: No URL Settings!');
  }

  let domain = null;
  try {
    const parts = url.parse(action.report.snapshot.url);
    domain = parts.hostname;
  } catch (error) {
    reject('Fail to parse url.');
  }

  let formatterSubject = action.report.subject;
  if (!formatterSubject || !formatterSubject.length) {
    formatterSubject = `SENTINL: ${actionName}`;
  }

  let formatterText = action.report.body;
  if (!formatterText || !formatterText.length) {
    formatterText = 'Series Report {{payload._id}}: {{payload.hits.total}}';
  }

  let priority = action.report.priority;
  if (!priority || !priority.length) {
    priority = 'INFO';
  }

  const subject = mustache.render(formatterSubject, { payload });
  const text = mustache.render(formatterText, { payload });
  server.log(['status', 'debug', 'Sentinl', 'report'], `Subject: ${subject}, Body: ${text}`);

  // Set report file name
  let file = action.report.snapshot.path;
  let filename = path.parse(file).name;
  if (path.parse(file).ext !== '.png' && path.parse(file).ext !== '.pdf') {
    if (!file.length) {
      file = os.tmpdir();
    }
    filename = `report-${uuid()}-${moment().format('DD-MM-YYYY-h-m-s')}`;
    if (action.report.snapshot.type === 'pdf') {
      filename += '.pdf';
    } else {
      filename += '.png';
    }
    file = path.join(file, filename);
  }

  // Do report
  return horsemanFactory(server, domain)
  .then(function (horseman) {
    if (config.settings.report.simple_authentication) {
      return horsemanReport(horseman, action, file, 'simple').close();
    } else if (isKibi(server) && config.settings.report.search_guard) {
      return horsemanReport(horseman, action, file, 'search_guard_kibi').close();
    } else if (config.settings.report.search_guard) {
      return horsemanReport(horseman, action, file, 'search_guard_kibana').close();
    }
    return horsemanReport(horseman, action, file).close();
  })
  .then(function () {
    // Send email
    if (!action.report.stateless) {
      let type = 'image/png';
      let data = '<html><img src=\'cid:my-report\' width=\'100%\'></html>';
      if (action.report.snapshot.type === 'pdf') {
        type = 'application/pdf';
        data = '<html><p>Find PDF report in the attachment.</p></html>';
      }

      const attachment = [
        {
          data,
          alternative: true
        },
        {
          path: file,
          type,
          name: filename,
          headers: {
            'Content-ID': '<my-report>',
            'Content-Type': `${type}; name="${filename}"`,
            'content-disposition': 'attachment; filename=cid:my-report'
          }
        }
      ];

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
    } else {
      return null;
    }
  })
  .then(function () {
    return getFile(file, action.report.save);
  });
}
