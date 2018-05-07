import puppeteer from 'puppeteer';
import mustache from 'mustache';
import moment from 'moment';
import url from 'url';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { delay } from 'bluebird';
import { includes, isObject } from 'lodash';
import getConfiguration from '../../get_configuration';
import logHistory from '../../log_history';
import uuid from 'uuid/v4';
import Log from '../../log';

class Authenticator {
  static async kibana(page, user, pass, appName = 'xpack', timeout = 5000) {
    try {
      await page.type('#username', user, {delay: timeout / 50});
      await page.type('#password', pass, {delay: timeout / 50});

      if (appName === 'xpack') {
        await page.click('.kuiButton');
      } else {
        await page.click('.btn-login');
      }

      await delay(timeout);
      await page.click('.global-nav-link--close');
      await delay(timeout);
    } catch (err) {
      throw new Error(`fail to authenticate via Search Guard, user: ${user}: ${err.message}`);
    }
  }

  static async custom(page, user, pass, userSelector, passSelector, loginBtnSelector, timeout = 5000) {
    try {
      await page.type(userSelector, user, {delay: timeout / 50});
      await page.type(passSelector, pass, {delay: timeout / 50});
      await page.click(loginBtnSelector);
      await delay(timeout);
    } catch (err) {
      throw new Error(`fail to authenticate via custom auth, user: ${user}: ${err.message}`);
    }
  }

  static async basic(page, user, pass, encoding = 'base64') {
    try {
      const headers = new Map();
      headers.set('Authorization', `Basic ${new Buffer(`${user}:${pass}`).toString(encoding)}`);
      await page.setExtraHTTPHeaders(headers);
      return page;
    } catch (err) {
      throw new Error(`fail to set basic auth headers, user: ${user}, ${err.message}`);
    }
  }
}

class Reporter {
  constructor(config, action) {
    this.config = this.initConfig(config, action);
  }

  initConfig(config, action) {
    config.authentication = action.snapshot.params.authentication || config.authentication;
    config.authentication.username = action.snapshot.params.username;
    config.authentication.password = action.snapshot.params.password;
    config.file.screenshot.width = action.snapshot.res.split('x')[0] || config.file.screenshot.width;
    config.file.screenshot.height = action.snapshot.res.split('x')[1] || config.file.screenshot.height;
    config.file.pdf = action.snapshot.params.pdf || config.file.pdf;
    config.timeout = action.snapshot.params.delay || config.timeout;
    return config;
  }

  async openPage(url, executablePath) {
    this.url = url;

    try {
      const options = {
        headless: this.config.debug.headless,
        devtools: this.config.debug.devtools,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ignoreHTTPSErrors: true,
      };

      if (executablePath) {
        options.executablePath = executablePath;
      }

      this.browser = await puppeteer.launch(options);
      this.page = await this.browser.newPage();
      this.page.setViewport({
        width: +this.config.file.screenshot.width,
        height: +this.config.file.screenshot.height,
      });
    } catch (err) {
      throw new Error(`fail to open headless chrome, ${err.message}`);
    }

    if (this.config.authentication.enabled && this.config.authentication.mode.basic) {
      this.page = await Authenticator.basic(this.page, this.authentication.username, this.authentication.password);
    }

    try {
      await this.page.goto(url, {waitUntil: 'networkidle0'});
    } catch (err) {
      throw new Error(`fail to go to url: ${url}`);
    }

    if (this.config.authentication.enabled) {
      const {mode, username, password} = this.config.authentication;
      await this.authenticate(mode, username, password, this.config.timeout);
    } else {
      await delay(this.config.timeout);
    }
  }

  async authenticate(mode, user, pass, timeout) {
    if (mode.searchguard) {
      await Authenticator.kibana(this.page, user, pass, 'searchguard', timeout);
    }

    if (mode.xpack) {
      await Authenticator.kibana(this.page, user, pass, 'xpack', timeout);
    }

    if (mode.custom) {
      const userSelector = this.config.authentication.custom.username_input_selector;
      const passSelector = this.config.authentication.custom.password_input_selector;
      const loginBtnSelector = this.config.authentication.custom.login_btn_selector;
      await Authenticator.custom(this.page, user, pass, userSelector, passSelector, loginBtnSelector, timeout);
    }
  }

  async screenshot(type = 'png') {
    const {width, height} = this.config.file.screenshot;
    try {
      await this.page.setViewport({width: +width, height: +height});
      return await this.page.screenshot({type});
    } catch (err) {
      throw new Error(`fail to do a screenshot, url: ${this.url}, ${err.message}`);
    }
  }

  async pdf() {
    const {format, landscape} = this.config.file.pdf;
    try {
      return await this.page.pdf({format, landscape});
    } catch (err) {
      throw new Error(`fail to do a PDF doc, url: ${this.url}, ${err.message}`);
    }
  }

  async end() {
    try {
      await this.browser.close();
    } catch (err) {
      throw new Error(`fail to close headless chrome, ${err.message}`);
    }
  }
}

const createReportFileName = function (filename, type = 'png') {
  if (!filename) {
    return `report-${uuid()}-${moment().format('DD-MM-YYYY-h-m-s')}.${type}`;
  }
  return filename + '.' + type;
};

const createReportAttachment = function (filename, file, type = 'png') {
  let filetype = `image/${type}`;
  let data = '<html><img src=\'cid:my-report\' width=\'100%\'></html>';
  if (type === 'pdf') {
    filetype = 'application/pdf';
    data = '<html><p>Find PDF report in the attachment.</p></html>';
  }

  return [
    {
      data,
      alternative: true
    },
    {
      data: file.toString('base64'),
      type: filetype,
      name: filename,
      encoded: true,
      headers: {
        'Content-ID': '<my-report>',
      }
    }
  ];
};

/**
* Execute report action
*
* @param {object} server - Kibana hapi server
* @param {object} email - instance of emailjs server
* @param {object} task - watcher
* @param {object} action - current watcher action
* @param {string} actionName - name of the action
* @param {object} payload - ES response
*/
export default async function doReport(server, email, task, action, actionName, payload) {
  let config = getConfiguration(server);
  const log = new Log(config.app_name, server, 'report_action');
  config = config.settings.report;

  if (!config.active) {
    throw new Error('Reports Disabled: Action requires Email Settings!');
  }

  if (!action.snapshot.url.length) {
    log.info('Report Disabled: No URL Settings!');
  }

  let formatterSubject = action.subject;
  if (!formatterSubject || !formatterSubject.length) {
    formatterSubject = `SENTINL: ${actionName}`;
  }

  let formatterText = action.body;
  if (!formatterText || !formatterText.length) {
    formatterText = 'Series Report {{payload._id}}: {{payload.hits.total}}';
  }

  let priority = action.priority;
  if (!priority || !priority.length) {
    priority = 'INFO';
  }

  const subject = mustache.render(formatterSubject, { payload });
  const text = mustache.render(formatterText, { payload });
  log.debug(`report email subject: ${subject}, body: ${text}`);

  const filename = createReportFileName(action.snapshot.name, action.snapshot.type);

  try {
    const report = new Reporter(config, action);
    await report.openPage(action.snapshot.url, config.executable_path);

    let file;
    if (action.snapshot.type !== 'pdf') {
      file = await report.screenshot(action.snapshot.type);
    } else {
      file = await report.pdf();
    }

    await report.end();

    log.debug(`report action is sending email, watcher ${task._id}, text ${text}`);
    const attachment = createReportAttachment(filename, file, action.snapshot.type);

    try {
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
          title: task._source.title,
          actionType: actionName,
          level: priority,
          payload: {},
          report: true,
          message: text,
          object: attachment,
        });
      } catch (err) {
        if (!action.stateless) {
          return await logHistory({
            server,
            title: task._source.title,
            actionType: actionName,
            message: isObject(err) ? JSON.stringify(err) : err,
          });
        }

        throw new Error(`fail to save report in Elasticsearch: ${err.message}`);
      }
    }

    log.debug('stateless report does not save data to Elasticsearch');
    return {message: 'stateless report does not save data to Elasticsearch'};
  } catch (err) {
    throw new Error(`fail to execute report: ${err.message}`);
  }
}
