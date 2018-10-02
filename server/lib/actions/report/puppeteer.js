import puppeteer from 'puppeteer';
import ActionError from '../../errors/action_error';

export default async function puppeteerReport({
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
  ignoreHTTPSErrors,
  chromeArgs = ['--no-sandbox', '--disable-setuid-sandbox'],
  chromeHeadless = true,
  chromeDevtools = false,
  collapseNavbarSelector,
}) {
  let browser;
  let page;

  try {
    try {
      delay = +delay;
      viewPortWidth = +viewPortWidth;
      viewPortHeight = +viewPortHeight;
      authActive = String(authActive) === 'true';
      ignoreHTTPSErrors = String(ignoreHTTPSErrors) === 'true';
      chromeHeadless = String(chromeHeadless) === 'true';
      chromeDevtools = String(chromeDevtools) === 'true';
    } catch (err) {
      throw new ActionError('sanitize args', err);
    }

    browser = await puppeteer.launch({
      headless: chromeHeadless,
      devtools: chromeDevtools,
      ignoreHTTPSErrors,
      args: chromeArgs,
      executablePath: browserPath,
    });

    page = await browser.newPage();

    await page.setViewport({
      width: viewPortWidth,
      height: viewPortHeight,
    });

    if (authActive && authMode === 'basic') { // for test: http://httpbin.org/basic-auth/user/passwd (username: user, password: passwd)
      await page.setExtraHTTPHeaders({
        Authorization: `Basic ${new Buffer(`${authUsername}:${authPassword}`).toString('base64')}`,
      });
    }

    await page.goto(reportUrl, { timeout: delay });

    try {
      if (authActive && authMode !== 'basic') { // for test: http://testing-ground.scraping.pro/login (username: admin, password: 12345)
        await page.waitForSelector(authSelectorUsername, { timeout: delay });
        await page.type(authSelectorUsername, authUsername);
        await page.waitForSelector(authSelectorPassword, { timeout: delay });
        await page.type(authSelectorPassword, authPassword);
        await page.waitForSelector(authSelectorLoginBtn, { timeout: delay });
        await page.click(authSelectorLoginBtn);
        await page.waitFor(delay);
      }
    } catch (err) {
      throw new ActionError('login form', err);
    }

    try {
      if (!!collapseNavbarSelector) {
        await page.waitForSelector(collapseNavbarSelector, { timeout: delay });
        await page.click(collapseNavbarSelector);
        await page.waitFor(delay / 2);
      }
    } catch (err) {
      throw new ActionError('collapse navbar', err);
    }

    if (fileType === 'pdf') {
      await page.pdf({
        path: filePath,
        format: pdfFormat,
        landscape: pdfLandscape,
      });
    } else {
      await page.screenshot({
        path: filePath,
        type: fileType,
      });
    }

    await browser.close();
    return filePath;
  } catch (err) {
    if (browser) {
      await browser.close();
    }
    err = err.toString();
    if (err.includes('timeout during .waitFor()') || err.includes('is not a valid selector')) {
      throw new ActionError('invalid CSS selector', err);
    } else {
      throw new ActionError('puppeteer work', err);
    }
  }
}
