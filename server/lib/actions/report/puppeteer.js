import puppeteer from 'puppeteer';
import {delay} from 'bluebird';
import {includes} from 'lodash';
import SuccessAndLog from '../../messages/success_and_log';

const customSelectorAuth = async function ({page, selectorUsername, authUsername, selectorPassword, authPassword, selectorLoginBtn}) {
  try {
    await page.type(selectorUsername, authUsername);
  } catch (err) {
    throw new Error(`type in username input with CSS selector "${selectorPassword}"`);
  }
  try {
    await page.type(selectorPassword, authPassword);
  } catch (err) {
    throw new Error(`type in password input with CSS selector "${selectorPassword}"`);
  }
  try {
    await page.click(selectorLoginBtn);
  } catch (err) {
    throw new Error(`click login btn with CSS selector "${selectorLoginBtn}"`);
  }
  return null;
};

export default async function puppeteerReport({
  server,
  reportUrl,
  reportRes,
  reportType,
  reportDelay,
  reportFilePath,
  log,
  chromePath,
  chromeHeadless = true,
  chromeDevtools = false,
  pdfFormat = 'A4',
  pdfLandscape = true,
  authActive = false,
  authMode, // basic, customselector, xpack, searchguard
  authUsername,
  authPassword,
  selectorUsername,
  selectorPassword,
  selectorLoginBtn,
}) {
  let browser;

  try {
    log.debug('puppeteer running ...');
    log.debug(`chrome path: ${chromePath}`);

    const options = {
      headless: chromeHeadless,
      devtools: chromeDevtools,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      ignoreHTTPSErrors: true,
    };

    if (chromePath) {
      options.executablePath = chromePath;
    }

    browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    page.setViewport({
      width: +reportRes.split('x')[0],
      height: +reportRes.split('x')[0],
    });

    if (authActive && authMode === 'basic') {
      log.debug('basic authentication');
      await page.setExtraHTTPHeaders({
        Authorization: `Basic ${new Buffer(`${authUsername}:${authPassword}`).toString('base64')}`,
      });
    }

    await page.goto(reportUrl, {waitUntil: 'networkidle0'});
    await delay(reportDelay);

    if (authActive) {
      await customSelectorAuth({
        page,
        selectorUsername,
        authUsername,
        selectorPassword,
        authPassword,
        selectorLoginBtn,
      });
    }
    await delay(reportDelay);

    if (reportType === 'pdf') {
      await page.pdf({
        path: reportFilePath,
        format: pdfFormat,
        landscape: pdfLandscape,
      });
    } else {
      await page.screenshot({
        path: reportFilePath,
        type: reportType,
      });
    }

    await browser.close();
    return new SuccessAndLog(log, 'successfully finished puppeteer report');
  } catch (err) {
    await browser.close();
    throw new Error(`puppeteer report: ${err.message}`);
  }
};
