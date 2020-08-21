import puppeteer from 'puppeteer';
import { ActionError } from '../../errors';
import getConfiguration from '../../get_configuration';
import Log from '../../log';
import { isEmpty, get } from 'lodash';

export default async function puppeteerReport({
  browserPath,
  filePath,
  action,
  server
}) {
  let browser;
  let page;
  const config = getConfiguration(server);
  const log = new Log(config.app_name, server, 'report');
  const timeout = +action.report.snapshot.params.delay;
  const viewPortWidth = +action.report.snapshot.res.split('x')[0];
  const viewPortHeight = +action.report.snapshot.res.split('x')[1];
  const ignoreHTTPSErrors = config.settings.report.ignore_https_errors;
  const chromeHeadless = config.settings.report.puppeteer.chrome_headless;
  const chromeDevtools = config.settings.report.puppeteer.chrome_devtools;
  const chromeArgs = config.settings.report.puppeteer.chrome_args;

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

  try {
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

    if (action.report.auth.active && action.report.auth.mode === 'basic') { // for test: http://httpbin.org/basic-auth/user/passwd (username: user, password: passwd)
      await page.setExtraHTTPHeaders({
        Authorization: `Basic ${new Buffer(`${action.report.auth.username}:${action.report.auth.password}`).toString('base64')}`,
      });
    }

    await page.goto(action.report.snapshot.url, { timeout });
    await page.waitFor(timeout);

    try {
      if (action.report.auth.active && action.report.auth.mode !== 'basic') { // for test: http://testing-ground.scraping.pro/login (username: admin, password: 12345)
        await page.waitForSelector(authSelectorUsername, { timeout, visible: true });
        await page.type(authSelectorUsername, action.report.auth.username);
        await page.waitForSelector(authSelectorPassword, { timeout, visible: true });
        await page.type(authSelectorPassword, action.report.auth.password);
        await page.waitForSelector(authSelectorLoginBtn, { timeout, visible: true });
        await page.click(authSelectorLoginBtn);
        await page.waitFor(timeout);
      }
    } catch (err) {
      log.error('login form', err);
    }

    try {
      if (collapseNavbarSelector) {
        await page.waitForSelector(collapseNavbarSelector, { timeout, visible: true });
        await page.click(collapseNavbarSelector);
        await page.waitFor(timeout);
      }
    } catch (err) {
      log.error('collapse navbar', err);
    }

    if (action.report.snapshot.type === 'pdf') {
      const options = {
        path: filePath,
        format: action.report.snapshot.pdf_format,
        landscape: action.report.snapshot.pdf_landscape,
        scale: action.report.snapshot.pdf_scale,
        displayHeaderFooter: action.report.snapshot.pdf_display_header_footer,
        headerTemplate: action.report.snapshot.pdf_header_template,
        footerTemplate: action.report.snapshot.pdf_footer_template,
        printBackground: action.report.snapshot.pdf_print_background,
        pageRanges: action.report.snapshot.pdf_page_ranges,
        preferCSSPageSize: action.report.snapshot.pdf_prefer_css_page_size,
      };

      if (!isEmpty(action.report.snapshot.pdf_margin)) {
        options.margin = action.report.snapshot.pdf_margin;
      }

      ['pdf_width', 'pdf_height'].forEach(key => {
        if (action.report.snapshot[key]) {
          options[key.split('_')[1]] = action.report.snapshot[key];
        }
      });

      await page.pdf(options);
    } else {
      const options = {
        path: filePath,
        type: action.report.snapshot.screenshot_type,
        omitBackground: action.report.snapshot.screenshot_omit_background,
        fullPage: action.report.snapshot.screenshot_full_page
      };

      if (!isEmpty(action.report.snapshot.screenshot_clip)) {
        options.clip = action.report.snapshot.screenshot_clip;
      }

      if (action.report.snapshot.screenshot_type !== 'png') {
        options.quality = action.report.snapshot.screenshot_quality;
      }

      await page.screenshot(options);
    }

    await browser.close();
    return filePath;
  } catch (err) {
    if (browser) {
      await browser.close();
    }
    if (err.toString().includes('timeout during .waitFor()') || err.toString().includes('is not a valid selector')) {
      throw new ActionError('invalid CSS selector', err);
    } else {
      throw new ActionError('puppeteer work', err);
    }
  }
}
