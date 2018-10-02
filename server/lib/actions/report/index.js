import Log from '../../log';
import getConfiguration from '../../get_configuration';
import reportFactory from './report_factory';
import { defaultsDeep, get } from 'lodash';
import { renderMustacheEmailSubjectAndText } from '../helpers';
import apiClient from '../../api_client';
import ActionError from '../../errors/action_error';

export default async function reportAction({
  server,
  action,
  watcherTitle,
  esPayload,
  actionName,
  emailClient,
}) {
  try {
    const config = getConfiguration(server);
    const log = new Log(config.app_name, server, 'report');
    const client = apiClient(server, 'elasticsearchAPI');

    action.report = defaultsDeep(action.report, config.settings.report.action);

    let browserPath = server.plugins.sentinl.phantomjs_path;
    if (config.settings.report.engine === 'puppeteer') {
      browserPath = server.plugins.sentinl.chrome_path;
    }

    const { subject, text } = renderMustacheEmailSubjectAndText(actionName, action.subject, action.body, esPayload);

    let authSelectorUsername = action.report.auth.selector_username;
    let authSelectorPassword = action.report.auth.selector_password;
    let authSelectorLoginBtn = action.report.auth.selector_login_btn;

    if (action.report.auth.active) {
      if (!config.settings.report.auth.modes.includes(action.report.auth.mode)) {
        throw new Error('wrong auth mode, available modes: ' + config.settings.report.auth.modes.toString());
      }

      if (action.report.auth.mode === 'xpack') {
        authSelectorUsername = config.settings.report.auth.css_selectors.xpack.username;
        authSelectorPassword = config.settings.report.auth.css_selectors.xpack.password;
        authSelectorLoginBtn = config.settings.report.auth.css_selectors.xpack.login_btn;
      }

      if (action.report.auth.mode === 'searchguard') {
        authSelectorUsername = config.settings.report.auth.css_selectors.searchguard.username;
        authSelectorPassword = config.settings.report.auth.css_selectors.searchguard.password;
        authSelectorLoginBtn = config.settings.report.auth.css_selectors.searchguard.login_btn;
      }
    }

    const options = {
      investigateAccessControl: server.plugins.investigate_access_control,
      server,
      browserPath,
      actionName,
      actionLevel: action.report.priority,
      watcherTitle,
      esPayload,
      engineName: config.settings.report.engine,
      reportUrl: action.report.snapshot.url,
      fileName: action.report.snapshot.name,
      fileType: action.report.snapshot.type,
      nodePath: server.plugins.sentinl.kibana_node_path,
      viewPortWidth: action.report.snapshot.res.split('x')[0],
      viewPortHeight: action.report.snapshot.res.split('x')[1],
      delay: action.report.snapshot.params.delay,
      pdfLandscape: action.report.snapshot.pdf_landscape,
      pdfFormat: action.report.snapshot.pdf_format,
      isStateless: action.report.stateless,
      emailSubject: subject,
      emailText: text,
      emailFrom: action.report.from,
      emailTo: action.report.to,
      emailClient,
      authActive: action.report.auth.active,
      authMode: action.report.auth.mode,
      authUsername: action.report.auth.username,
      authPassword: action.report.auth.password,
      authSelectorUsername,
      authSelectorPassword,
      authSelectorLoginBtn,
      ignoreHTTPSErrors: config.settings.report.ignore_https_errors,
      phantomBluebirdDebug: config.settings.report.horseman.phantom_bluebird,
      chromeHeadless: config.settings.report.puppeteer.chrome_headless,
      chromeDevtools: config.settings.report.puppeteer.chrome_devtools,
      chromeArgs: config.settings.report.puppeteer.chrome_args,
      collapseNavbarSelector: get(action.report, 'selectors.collapse_navbar_selector'),
    };

    const attachment = await reportFactory(options);

    try {
      if (!options.isStateless) {
        client.logAlarm({
          actionName,
          watcherTitle,
          level: options.actionLevel,
          message: options.emailText,
          isReport: true,
          attachment,
        });
      }

      await emailClient.send({
        text: options.emailText,
        from: options.emailFrom,
        to: options.emailTo,
        subject: options.emailSubject,
        attachment,
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
