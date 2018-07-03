process.env.DEBUG = 'horseman';
const debug = require('debug')('horsemanFactory');

import url from 'url';
import os from 'os';
import SuccessAndLog from '../../messages/success_and_log';

/**
 * Return a Promise resolved with a Horseman instance.
 *
 * @param {string} domain - An optional authentication domain.
 * @return {object} Horseman.
 */
const horsemanFactory = async function ({
  domain,
  kibiAccessControl,
  phantomPath
}) {
  try {
    if (kibiAccessControl) {
      return await kibiAccessControl.getSentinlHorseman(domain);
    } else {
      const Horseman = require('node-horseman');
      return new Horseman({
        ignoreSSLErrors: true,
        bluebirdDebug: true,
        phantomPath,
      });
    }
  } catch (err) {
    throw new Error(`horsemanFactory: ${err.message}`);
  }
};

const customSelectorAuth = async function ({horseman, selectorUsername, authUsername, selectorPassword, authPassword, selectorLoginBtn}) {
  try {
    await horseman.type(selectorUsername, authUsername);
  } catch (err) {
    throw new Error(`type in username input with CSS selector "${selectorPassword}"`);
  }
  try {
    await horseman.type(selectorPassword, authPassword);
  } catch (err) {
    throw new Error(`type in password input with CSS selector "${selectorPassword}"`);
  }
  try {
    await horseman.click(selectorLoginBtn);
  } catch (err) {
    throw new Error(`click login btn with CSS selector "${selectorLoginBtn}"`);
  }
  return null;
};

/**
* Do report (pdf or png)
*
*/
export default async function horsemanReport({
  server,
  reportUrl,
  reportRes,
  reportType,
  reportDelay,
  reportFilePath,
  username,
  password,
  usernameSelector,
  passwordSelector,
  loginBtnSelector,
  log,
  pdfFormat = 'A4',
  pdfLandscape = true,
  authMode,
  authActive = false,
  authUsername,
  authPassword,
  selectorUsername,
  selectorPassword,
  selectorLoginBtn,
  phantomPath,
}) {
  let horseman;

  try {
    log.debug('horseman running ...');

    const { hostname } = url.parse(reportUrl);
    log.debug(`hostname: ${hostname}`);
    log.debug(`phantomjs path: ${phantomPath}`);
    log.debug(`kibi access control: ${!!server.plugins.kibi_access_control}`);

    horseman = await horsemanFactory({
      hostname,
      phantomPath,
      kibiAccessControl: !!server.plugins.kibi_access_control,
    });

    await horseman.viewport(reportRes.split('x')[0], reportRes.split('x')[1]);

    if (authActive && authMode === 'basic') {
      log.debug('basic authentication');
      await horseman.authentication(authUsername, authPassword);
    }

    await horseman.open(reportUrl);
    await horseman.wait(reportDelay);

    if (authActive) {
      await customSelectorAuth({
        horseman,
        selectorUsername,
        authUsername,
        selectorPassword,
        authPassword,
        selectorLoginBtn,
      });
    }
    await horseman.wait(reportDelay);

    if (reportType === 'pdf') {
      await horseman.pdf(reportFilePath, {
        width: reportRes.split('x')[0] + 'px',
        height: reportRes.split('x')[1] + 'px',
        margin: '1px',
        format: pdfFormat,
        orientation: pdfLandscape ? 'landscape' : 'portrait',
      });
    } else {
      await horseman.screenshot(reportFilePath);
    }

    await horseman.close();
    return new SuccessAndLog(log, 'successfully finished horseman report');
  } catch (err) {
    await horseman.close();
    throw new Error(`horseman report: ${err.message}`);
  }
};
