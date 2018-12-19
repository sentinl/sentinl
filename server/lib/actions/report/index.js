import uuid from 'uuid/v4';
import os from 'os';
import path from 'path';
import moment from 'moment';
import { readFileSync } from 'fs';
import getConfiguration from '../../get_configuration';
import { defaultsDeep, get } from 'lodash';
import { renderMustacheEmailSubjectAndText } from '../helpers';
import apiClient from '../../api_client';
import puppeteerReport from './puppeteer';
import { ActionError } from '../../errors';
import Log from '../../log';

export default async function reportAction({
  server,
  action,
  watcherTitle,
  esPayload,
  actionName,
  emailClient,
}) {
  function createReportFileName(filename, type = 'png') {
    if (!filename) {
      return `report-${uuid()}-${moment().format('DD-MM-YYYY-h-m-s')}.${type}`;
    }
    return filename + '.' + type;
  };

  function base64String(path) {
    return new Buffer(readFileSync(path)).toString('base64');
  }

  try {
    const config = getConfiguration(server);
    const log = new Log(config.app_name, server, 'report');
    const client = apiClient(server, 'elasticsearchAPI');

    action.report = defaultsDeep(action.report, config.settings.report.action);

    const browserPath = server.plugins.sentinl.chrome_path;
    const { subject, text } = renderMustacheEmailSubjectAndText(actionName, action.report.subject, action.report.body, esPayload);

    let authSelectorUsername = action.report.auth.selector_username || config.settings.report.auth.username;
    let authSelectorPassword = action.report.auth.selector_password || config.settings.report.auth.username;
    let authSelectorLoginBtn = action.report.auth.selector_login_btn;
    const collapseNavbarSelector = get(action.report, 'selectors.collapse_navbar_selector') ||
      config.settings.report.css_selectors.collapse_navbar_selector;

    if (action.report.auth.active) {
      if (!config.settings.report.auth.modes.includes(action.report.auth.mode)) {
        throw new Error('wrong auth mode, available modes: ' + config.settings.report.auth.modes.toString());
      }

      if (action.report.auth.mode === 'xpack') {
        authSelectorUsername = authSelectorUsername || config.settings.report.auth.css_selectors.xpack.username;
        authSelectorPassword = authSelectorPassword || config.settings.report.auth.css_selectors.xpack.password;
        authSelectorLoginBtn = authSelectorLoginBtn || config.settings.report.auth.css_selectors.xpack.login_btn;
      }

      if (action.report.auth.mode === 'searchguard') {
        authSelectorUsername = authSelectorUsername || config.settings.report.auth.css_selectors.searchguard.username;
        authSelectorPassword = authSelectorPassword || config.settings.report.auth.css_selectors.searchguard.password;
        authSelectorLoginBtn = authSelectorLoginBtn || config.settings.report.auth.css_selectors.searchguard.login_btn;
      }
    }

    log.info(`${watcherTitle}, executing report by "${config.settings.report.engine}"`);
    log.info(`${watcherTitle}, browser: "${browserPath}"`);

    if (!action.report.snapshot.url.length) {
      throw new Error('Report disabled: no url settings!');
    }

    if (config.settings.report.engine !== 'puppeteer') {
      throw new Error(`wrong report engine "${config.settings.report.engine}", engines available: puppeteer`);
    }

    const fileName = createReportFileName(action.report.snapshot.name, action.report.snapshot.type);
    let filePath = path.join(os.tmpdir(), fileName);

    filePath = await puppeteerReport({
      filePath,
      reportUrl: action.report.snapshot.url,
      fileType: action.report.snapshot.type,
      fileUrl: action.report.snapshot.url,
      timeout: action.report.snapshot.params.delay,
      pdfFormat: action.report.snapshot.pdf_format,
      pdfLandscape: action.report.snapshot.pdf_landscape,
      viewPortWidth: action.report.snapshot.res.split('x')[0],
      viewPortHeight: action.report.snapshot.res.split('x')[1],
      authMode: action.report.auth.mode,
      authActive: action.report.auth.active,
      authUsername: action.report.auth.username,
      authPassword: action.report.auth.password,
      authSelectorUsername,
      authSelectorPassword,
      authSelectorLoginBtn,
      ignoreHTTPSErrors: config.settings.report.ignore_https_errors,
      chromeHeadless: config.settings.report.puppeteer.chrome_headless,
      chromeDevtools: config.settings.report.puppeteer.chrome_devtools,
      chromeArgs: config.settings.report.puppeteer.chrome_args,
      collapseNavbarSelector,
      browserPath,
    });

    log.info(`${watcherTitle}, '${config.settings.report.engine}' report results: '${filePath}'`);

    try {
      if (!action.report.stateless) {
        client.logAlarm({
          actionName,
          watcherTitle,
          level: action.report.priority,
          message: text,
          isReport: true,
          attachment: [
            {
              data: text,
              alternative: true
            },
            {
              data: base64String(filePath),
              type: action.report.snapshot.type === 'png' ? 'image/png' : 'application/pdf',
              name: fileName,
              encoded: true,
            }
          ],
        });
      }

      await emailClient.send({
        text,
        subject,
        from: action.report.from,
        to: action.report.to,
        attachment: [
          {
            data: text,
            alternative: true
          },
          {
            data: text,
            path: filePath,
            type: action.report.snapshot.type === 'png' ? 'image/png' : 'application/pdf',
            name: fileName,
            encoded: true,
          }
        ],
      });
    } catch (err) {
      err = new ActionError('index report and send email', err);
      log.error([watcherTitle, err.message, err.stack].join(': '));
      client.logAlarm({
        actionName,
        watcherTitle,
        level: 'high',
        message: err.toString(),
        isReport: true,
        isError: true,
      });
    }
  } catch (err) {
    throw new ActionError('execute', err);
  }
};
