import uuid from 'uuid/v4';
import os from 'os';
import path from 'path';
import moment from 'moment';
import { readFileSync } from 'fs';
import Log from '../../log';
import getConfiguration from '../../get_configuration';
import horsemanReport from './horseman';
import puppeteerReport from './puppeteer';
import ActionError from '../../errors/action_error';

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

export default async function reportFactory({
  reportUrl,
  engineName,
  fileName,
  fileType,
  nodePath,
  viewPortWidth,
  viewPortHeight,
  delay,
  pdfLandscape,
  pdfFormat,
  browserPath,
  actionName,
  actionLevel,
  esPayload,
  watcherTitle,
  server,
  isStateless,
  emailSubject,
  emailText,
  emailFrom,
  emailTo,
  emailClient,
  authMode,
  authActive,
  authUsername,
  authPassword,
  authSelectorUsername,
  authSelectorPassword,
  authSelectorLoginBtn,
  ignoreHTTPSErrors,
  phantomBluebirdDebug,
  chromeHeadless,
  chromeDevtools,
  chromeArgs,
  collapseNavbarSelector,
  investigateAccessControl,
}) {
  try {
    const config = getConfiguration(server);
    const log = new Log(config.app_name, server, 'report');

    log.info(`${watcherTitle}, executing report by "${engineName}"`);
    log.info(`${watcherTitle}, browser: "${browserPath}"`);

    if (!reportUrl.length) {
      throw new Error('Report disabled: no url settings!');
    }

    if (!['horseman', 'puppeteer'].includes(engineName)) {
      throw new Error(`wrong report engine "${engineName}", engines available: horseman, puppeteer`);
    }

    fileName = createReportFileName(fileName, fileType);
    let filePath = path.join(os.tmpdir(), fileName);

    const options = {
      filePath,
      fileType,
      reportUrl,
      delay,
      pdfFormat,
      pdfLandscape,
      viewPortWidth,
      viewPortHeight,
      authMode,
      authActive,
      authUsername,
      authPassword,
      authSelectorUsername,
      authSelectorPassword,
      authSelectorLoginBtn,
      ignoreHTTPSErrors,
      collapseNavbarSelector,
      investigateAccessControl,
      browserPath
    };

    if (engineName === 'puppeteer') {
      options.chromeHeadless = chromeHeadless;
      options.chromeDevtools = chromeDevtools;
      options.chromeArgs = chromeArgs;
    } else {
      options.phantomBluebirdDebug = phantomBluebirdDebug;
    }

    if (engineName === 'horseman') {
      filePath = await horsemanReport(options);
    } else {
      filePath = await puppeteerReport(options);
    }

    log.info(`${watcherTitle}, '${engineName}' report results: '${filePath}'`);
    return createReportAttachment(fileName, filePath, fileType);
  } catch (err) {
    throw new ActionError(`run '${engineName}' report`, err);
  }
};
