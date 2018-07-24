import uuid from 'uuid/v4';
import url from 'url';
import os from 'os';
import {readFileSync} from 'fs';
import moment from 'moment';
import mustache from 'mustache';
import urljoin from 'url-join';
import {isObject, includes, get} from 'lodash';
import getConfiguration from '../../get_configuration';
import logHistory from '../../log_history';
import Log from '../../log';
import SuccessAndLog from '../../messages/success_and_log';
import horsemanReport from './horseman';
import puppeteerReport from './puppeteer';

function createReportFileName(filename, type = 'png') {
  if (!filename) {
    return `report-${uuid()}-${moment().format('DD-MM-YYYY-h-m-s')}.${type}`;
  }
  return filename + '.' + type;
};

function base64String(path) {
  return new Buffer(readFileSync(path)).toString('base64');
}

function createReportAttachment(fileName, filePath, fileType = 'png') {
  fileType = `image/${fileType}`;
  let data = '<html><img src=\'cid:my-report\' width=\'100%\'></html>';
  if (fileType === 'pdf') {
    fileType = 'application/pdf';
    data = '<html><p>Find PDF report in the attachment.</p></html>';
  }

  return [
    {
      data,
      alternative: true
    },
    {
      data: base64String(filePath),
      type: fileType,
      name: fileName,
      encoded: true,
      headers: {
        'Content-ID': '<my-report>',
      }
    }
  ];
};

function mustacheEmailSubjectAndText(actionName, subject, body, payload) {
  subject = !subject || !subject.length ? `SENTINL: ${actionName}` : subject;
  body = !body || !body.length ? 'Series Report {{payload._id}}: {{payload.hits.total}}' : body;
  return {
    subject: mustache.render(subject, {payload}),
    text: mustache.render(body, {payload}),
  };
}

export default async function doReport(server, email, task, action, actionName, payload) {
  try {
    let config = getConfiguration(server);
    const log = new Log(config.app_name, server, 'report');
    config = config.settings.report;

    if (!config.active) {
      throw new Error('Reports Disabled: Action requires Email Settings!');
    }

    if (!action.snapshot.url.length) {
      log.info('Report Disabled: No URL Settings!');
    }

    const {subject, text} = mustacheEmailSubjectAndText(actionName, action.subject, action.body, payload);
    log.debug(`report email subject: ${subject}, body: ${text}`);
    const reportFileName = createReportFileName(action.snapshot.name, action.snapshot.type);
    const reportFilePath = urljoin(os.tmpdir(), reportFileName);

    const options = {
      log,
      server,
      reportFilePath,
      reportUrl: action.snapshot.url,
      reportRes: action.snapshot.res,
      reportType: action.snapshot.type,
      reportDelay: action.snapshot.params.delay,
      pdfLandscape: action.snapshot.pdf_landscape || true,
      pdfFormat: action.snapshot.pdf_format || 'A4',
    };

    if (action.auth && action.auth.active) {
      /* Test auth
       *
       * basic (username: user, password: passwd): http://httpbin.org/basic-auth/user/passwd
       * custom selector (username: admin, password: 12345): http://testing-ground.scraping.pro/login
       */
      log.debug(`authentication enabled, mode: ${action.auth.mode}`);
      if (!includes(['basic', 'xpack', 'searchguard', 'customselector'], action.auth.mode)) {
        throw new Error(`unsupported authentication mode: ${action.auth.mode}` +
          'Available modes: searchguard, xpack, basic, customselector');
      }
      options.authMode = get(action, 'auth.mode');
      options.authActive = get(action, 'auth.active');
      options.authUsername = get(action, 'auth.username');
      options.authPassword = get(action, 'auth.password');
      options.selectorUsername = get(action, 'auth.selector_username') || get(config, `auth.css_selectors.${action.auth.mode}.username`);
      options.selectorPassword = get(action, 'auth.selector_password') || get(config, `auth.css_selectors.${action.auth.mode}.password`);
      options.selectorLoginBtn = get(action, 'auth.selector_login_btn') || get(config, `auth.css_selectors.${action.auth.mode}.login_btn`);

      log.debug(`login page form CSS selectors: "${options.selectorUsername}",` +
        `"${options.selectorPassword}", "${options.selectorLoginBtn}"`);
    } else {
      log.debug('authentication disabled');
    }

    let file;
    if (config.engine === 'horseman') {
      options.phantomPath = config.phantomjs_path;
      await horsemanReport(options);
    } else { // puppeteer
      options.chromePath = config.chrome_path;
      options.chromeDevtools = config.debug.devtools;
      await puppeteerReport(options);
    }

    log.debug(`generated report file: ${reportFilePath}`);
    const attachment = createReportAttachment(reportFileName, reportFilePath, action.snapshot.type);
    try {
      log.debug(`sending email, watcher ${task._id}, text ${text}`);
      await email.send({
        text,
        from: action.from,
        to: action.to,
        subject,
        attachment,
      });
    } catch (err) {
      log.error(`fail to send report email: ${err.message}`);
    }

    if (!action.stateless) {
      try {
        return await logHistory({
          server,
          watcherTitle: task._source.title,
          actionName,
          level: action.priority || 'INFO',
          payload: {},
          report: true,
          message: text,
          object: attachment,
        });
      } catch (err) {
        if (!action.stateless) {
          return await logHistory({
            server,
            watcherTitle: task._source.title,
            actionName,
            message: isObject(err) ? JSON.stringify(err) : err,
          });
        }

        throw new Error(`fail to save report in Elasticsearch: ${err.message}`);
      }
    }

    return new SuccessAndLog(log, 'stateless report does not save data to Elasticsearch');
  } catch (err) {
    throw new Error(`execute report: ${err.message}`);
  }
}
