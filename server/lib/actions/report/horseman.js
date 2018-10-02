// USEFUL FOR DEBUGGING - do not remove
// process.env.DEBUG = 'horseman';
// const debug = require('debug')('horsemanFactory');

import url from 'url';
import Promise from 'bluebird';
import ActionError from '../../errors/action_error';

function horsemanFactory({domain, investigateAccessControl, ignoreSSLErrors, bluebirdDebug, phantomPath}) {
  if (!!investigateAccessControl) {
    return investigateAccessControl.getSentinlHorseman(domain);
  } else {
    const Horseman = require('node-horseman');
    return Promise.resolve(new Horseman({
      ignoreSSLErrors,
      bluebirdDebug,
      phantomPath,
    }));
  }
}

export default async function horsemanReport({
  browserPath,
  filePath,
  fileType,
  reportUrl,
  delay,
  viewPortWidth,
  viewPortHeight,
  pdfFormat,
  pdfLandscape,
  authMode,
  authActive,
  authUsername,
  authPassword,
  authSelectorUsername,
  authSelectorPassword,
  authSelectorLoginBtn,
  ignoreHTTPSErrors = true,
  phantomBluebirdDebug = true,
  investigateAccessControl,
  collapseNavbarSelector,
}) {
  let horseman;

  try {
    try {
      delay = +delay;
      viewPortWidth = +viewPortWidth;
      viewPortHeight = +viewPortHeight;
      authActive = String(authActive) === 'true';
      ignoreHTTPSErrors = String(ignoreHTTPSErrors) === 'true';
      phantomBluebirdDebug = String(phantomBluebirdDebug) === 'true';
    } catch (err) {
      throw new ActionError('sanitize args', err);
    }

    const parsedUrl = url.parse(reportUrl);

    horseman = await horsemanFactory({
      domain: parsedUrl.hostname,
      investigateAccessControl,
      ignoreSSLErrors: ignoreHTTPSErrors,
      bluebirdDebug: phantomBluebirdDebug,
      phantomPath: browserPath,
    });

    await horseman.viewport(viewPortWidth, viewPortHeight);

    if (!investigateAccessControl && authActive && authMode === 'basic') { // for test: http://httpbin.org/basic-auth/user/passwd (username: user, password: passwd)
      await horseman.authentication(authUsername, authPassword);
    }

    await horseman.open(reportUrl).wait(delay);

    if (!investigateAccessControl && authActive && authMode !== 'basic') { // for test: http://testing-ground.scraping.pro/login (username: admin, password: 12345)
      try {
        await horseman
          .waitForSelector(authSelectorUsername, { timeout: delay })
          .type(authSelectorUsername, authUsername)
          .waitForSelector(authSelectorPassword, { timeout: delay })
          .type(authSelectorPassword, authPassword)
          .waitForSelector(authSelectorLoginBtn, { timeout: delay })
          .click(authSelectorLoginBtn)
          .wait(delay);
      } catch (err) {
        throw new ActionError('login form', err);
      }
    }

    if (!!collapseNavbarSelector) {
      try {
        await horseman.waitForSelector(collapseNavbarSelector, { timeout: delay })
          .click(collapseNavbarSelector)
          .wait(delay / 2);
      } catch (err) {
        throw new ActionError('collapse navbar', err);
      }
    }

    if (fileType === 'pdf') {
      await horseman.pdf(filePath, {
        format: pdfFormat,
        orientation: pdfLandscape ? 'landscape' : 'portrait',
      });
    } else {
      await horseman.screenshot(filePath);
    }

    await horseman.close();
    return filePath;
  } catch (err) {
    if (horseman) {
      await horseman.close();
    }
    err = err.toString();
    if (err.includes('Phantom immediately exited with: 126')) {
      throw new ActionError('cannot execute phantom binary, incorrect format', err);
    } else if (err.includes('Phantom immediately exited with: 127')) {
      throw new ActionError('you need to install libs for Reporting to work: fontconfig and freetype', err);
    } else if (err.includes('extract phantom ports')) {
      throw new ActionError('you need to install netstat', err);
    } else if (err.includes('timeout during .waitFor()')) {
      throw new ActionError('invalid CSS selector', err);
    } else {
      throw new ActionError('horseman work', err);
    }
  }
}
