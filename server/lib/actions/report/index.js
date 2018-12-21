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
    filePath = await puppeteerReport({ action, filePath, browserPath, server });

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
