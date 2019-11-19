export default function appConfig(Joi) {
  return Joi.object({
    app_name: Joi.string().default('Sentinl'),
    enabled: Joi.boolean().default(true),
    sentinl: Joi.any().forbidden().error(new Error(
      'Option "sentinl.sentinl.results" was deprecated. Use "sentinl.es.results" instead!'
    )),
    api: Joi.object({
      type: Joi.string().valid('elasticsearchAPI', 'savedObjectsAPI').default('savedObjectsAPI'),
    }).default(),
    es: Joi.object({
      allow_no_indices: Joi.boolean().default(false),
      ignore_unavailable: Joi.boolean().default(false),
      default_index: Joi.string(),
      default_type: Joi.string().default('doc'),
      results: Joi.number().default(50),
      hosts: Joi.array().default([{ host: 'localhost', port: 9200, protocol: 'http'}]),
      protocol: Joi.string().default('http'),
      port: Joi.number().default(9200),
      timefield: Joi.string().default('@timestamp'),
      timezone: Joi.string().default('Europe/Amsterdam'),
      type: Joi.any().forbidden().error(new Error(
        'Option "sentinl.es.type" was deprecated. Use "sentinl.es.default_type" instead!'
      )),
      alarm_index: Joi.string().default('watcher_alarms'),
      rollover_index: Joi.boolean().default(false), // Use ES rollover index
      rollover_index_name: Joi.string().default("watcher-alarms"), // Use ES rollover index
      user_type: Joi.string().default('sentinl-user'), // if you change this, also change the corresponding object type name here ./server/mappings/sentinl.json
      watcher_type: Joi.string().default('sentinl-watcher'), // if you change this, also change the corresponding object type name here ./server/mappings/sentinl.json
      script_type: Joi.string().default('script'), // if you change this, also change the corresponding object type name here ./server/mappings/sentinl.json
      alarm_type: Joi.string().default('sentinl-alarm'),
      watcher: Joi.object({
        schedule_timezone: Joi.string().default('utc'), // local, utc
        trigger: Joi.number().default(3),
        throttle: Joi.number().default(1),
        recover: Joi.number().default(15000)
      }).default(),
    }).default(),
    settings: Joi.object({
      wizard: Joi.object({
        condition: Joi.object({
          query_type: Joi.string().default('count'),
          schedule_type: Joi.string().default('every'), // options: every, text
          over: Joi.object({
            type: Joi.string().default('all docs'),
          }).default(),
          last: Joi.object({
            n: Joi.number().default(15),
            unit: Joi.string().default('minutes'),
          }).default(),
          interval: Joi.object({
            n: Joi.number().default(1),
            unit: Joi.string().default('minutes'),
          }).default(),
        }).default(),
      }).default(),
      authentication: Joi.object({
        https: Joi.any().forbidden().error(new Error(
          'Option "sentinl.settings.authentication.https" was deprecated. Use "sentinl.es.protocol" instead!'
        )),
        verify_certificate: Joi.any().forbidden().error(new Error(
          'Option "sentinl.settings.authentication.verify_certificate" was deprecated.' +
          +'Use "sentinl.settings.authentication.cert.selfsigned" instead!'
        )),
        path_to_pem: Joi.any().forbidden().error(new Error(
          'Option "sentinl.settings.authentication.path_to_pem" was deprecated. Use "sentinl.settings.authentication.cert.pem" instead!'
        )),
        admin_username: Joi.any().forbidden().error(new Error(
          'Option "sentinl.settings.authentication.admin_username" was deprecated.' +
          +'Use "sentinl.settings.authentication.username" instead!'
        )),
        admin_sha: Joi.any().forbidden().error(new Error(
          'Option "sentinl.settings.authentication.admin_sha" was deprecated. Use "sentinl.settings.authentication.sha" instead!'
        )),
        mode: Joi.any().forbidden().error(new Error(
          'Option "sentinl.settings.authentication.mode" was deprecated. Use "sentinl.settings.authentication.enabled" instead!'
        )),
        user_index: Joi.any().forbidden().error(new Error(
          'Option "sentinl.settings.authentication.user_index" was deprecated. Users are saved in the default index!'
        )),
        user_type: Joi.any().forbidden().error(new Error(
          'Option "sentinl.settings.authentication.user_type" was deprecated. Use "sentinl.es.user_type" instead!'
        )),
        enabled: Joi.boolean().default(false),
        impersonate: Joi.boolean().default(false),
        username: Joi.string().default('sentinl'),
        password: Joi.string().default('password'),
        sha: Joi.string(),
        cert: Joi.object({
          selfsigned: Joi.boolean().default(true),
          pem: Joi.string(),
        }).default(),
        encryption: Joi.object({
          algorithm: Joi.string().default('AES-256-CBC'),
          key: Joi.string().default('b9726b04608ac48ecb0b6918214ade54'),
          iv_length: Joi.number().default(16)
        }).default(),
      }).default(),
      cluster: Joi.object({
        enabled: Joi.boolean().default(false),
        debug: Joi.boolean().default(false),
        name: Joi.string().default('sentinl'),
        priority_for_master: Joi.number().default(0),
        loop_delay: Joi.number().default(5),
        absent_time: Joi.number().default(15),
        absent_time_for_delete: Joi.number().default(86400),
        cert: Joi.object({
          selfsigned: Joi.boolean().default(true),
          valid: Joi.number().default(10),
          key: Joi.string().default(undefined),
          cert: Joi.string().default(undefined),
        }).default(),
        gun: Joi.object({
          port: Joi.number().default(9000),
          host: Joi.string().default('localhost'),
          cache: Joi.string().default('data.json'),
          peers: Joi.array(),
        }).default(),
        host: Joi.object({
          id: Joi.string().default('123'),
          name: Joi.string().default('trex'),
          node: Joi.string().default('hosts'),
          priority: Joi.number().default(0),
        }).default(),
      }).default(),
      email: Joi.object({
        active: Joi.boolean().default(false),
        host: Joi.string().default('localhost'),
        user: Joi.string(),
        password: Joi.string(),
        port: Joi.number().default(25),
        domain: Joi.string(),
        ssl: Joi.boolean().default(false),
        tls: Joi.boolean().default(false),
        sslopt: Joi.object({
          key: Joi.string(), // full system path
          cert: Joi.string(), // full system path
          ca: Joi.string(), // full system path
        }),
        tlsopt: Joi.object({
          key: Joi.string(), // full system path
          cert: Joi.string(), // full system path
          ca: Joi.string(), // full system path
        }),
        cert: Joi.any().forbidden().error(new Error(
          'Option "email.cert" was deprecated. Use "email.tlsopt" for TLS options and "email.sslopt" for SSL options!'
        )),
        authentication: Joi.array().default(['PLAIN', 'LOGIN', 'CRAM-MD5', 'XOAUTH2']),
        timeout: Joi.number().default(5000),
      }).default(),
      slack: Joi.object({
        active: Joi.boolean().default(false),
        webhook: Joi.string(),
        channel: Joi.string(),
      }).default(),
      ses: Joi.object({
        active: Joi.boolean().default(false),
        accessKeyId: Joi.string(),
        secretAccessKey: Joi.string(),
        region: Joi.string(),
      }).default(),
      webhook: Joi.object({
        active: Joi.boolean().default(false),
        use_https: Joi.boolean().default(false),
        method: Joi.string().default('POST'),
        host: Joi.string(),
        port: Joi.number(),
        path: Joi.string().default(':/{{payload.watcher_id}'),
        body: Joi.string().default('{{payload.watcher_id}}{payload.hits.total}}'),
        params: Joi.object()
      }).default(),
      report: Joi.object({
        action: Joi.object({
          priority: Joi.string().default('info'),
          subject: Joi.string().default('Report'),
          body: Joi.string().default('Look for the report in the attachment.'),
          snapshot: Joi.object({
            screenshot_full_page: Joi.boolean().default(true),
            screenshot_type: Joi.string().default('png'),
            screenshot_quality: Joi.number().default(100),
            screenshot_clip: Joi.object({
              x: Joi.number(),
              y: Joi.number(),
              width: Joi.number(),
              height: Joi.number(),
            }).default(),
            screenshot_omit_background: Joi.boolean().default(false),
            pdf_landscape: Joi.boolean().default(true),
            pdf_format: Joi.string().default('A3'),
            pdf_scale: Joi.number().default(1),
            pdf_display_header_footer: Joi.boolean().default(false),
            pdf_header_template: Joi.string(),
            pdf_footer_template: Joi.string(),
            pdf_print_background: Joi.boolean().default(false),
            pdf_page_ranges: Joi.string(),
            pdf_width: Joi.string(),
            pdf_height: Joi.string(),
            pdf_prefer_css_page_size: Joi.boolean().default(false),
            pdf_margin: Joi.object({
              top: Joi.string(),
              right: Joi.string(),
              bottom: Joi.string(),
              left: Joi.string(),
            }).default(),
            res: Joi.string().default('1280x900'),
            url: Joi.string().default('http://google.com'),
            type: Joi.string().default('png'),
            params: Joi.object({
              delay: Joi.number().default(5000),
            }).default(),
          }).default(),
          selectors: Joi.object({
            collapse_navbar_selector: Joi.string(),
          }),
          auth: Joi.object({
            mode: Joi.string().default('basic'), // basic, customselector, xpack, searchguard
            active: Joi.boolean().default(false),
            username: Joi.string(),
            password: Joi.string(),
            selector_login_btn: Joi.string(),
            selector_password: Joi.string(),
            selector_username: Joi.string(),
          }).default(),
        }).default(),
        active: Joi.boolean().default(true),
        engine: Joi.string().default('puppeteer'),
        executable_path: Joi.any().forbidden().error(new Error(
          'Option "report.executable_path" was deprecated. The path is handled automatically!'
        )),
        css_selectors: Joi.object({
          collapse_navbar_selector: Joi.string().default('div.global-nav-link--close.global-nav-link.global-nav-link > a'),
        }).default(),
        auth: Joi.object({
          username: Joi.string(),
          password: Joi.string(),
          modes: Joi.array().default(['basic', 'customselector', 'xpack', 'searchguard']),
          css_selectors: Joi.object({
            searchguard: Joi.object({
              username: Joi.string().default('#username'),
              password: Joi.string().default('#password'),
              login_btn: Joi.string().default('button[type=submit]'),
            }).default(),
            xpack: Joi.object({
              username: Joi.string().default('#username'),
              password: Joi.string().default('#password'),
              login_btn: Joi.string().default('button[type=submit]'),
            }).default(),
          }).default(),
        }).default(),
        ignore_https_errors: Joi.boolean().default(true),
        puppeteer: Joi.object({
          browser_path: Joi.string(),
          chrome_args: Joi.array().default(['--no-sandbox', '--disable-setuid-sandbox']),
          chrome_headless: Joi.boolean().default(true),
          chrome_devtools: Joi.boolean().default(false),
        }).default(),
        search_guard: Joi.any().forbidden().error(new Error(
          'Option "report.search_guard" was deprecated. Authenticatiobn is set per watcher!'
        )),
        simple_authentication: Joi.any().forbidden().error(new Error(
          'Option "report.simple_authentication" was deprecated. Authenticatiobn is set per watcher!'
        )),
        tmp_path: Joi.any().forbidden().error(new Error(
          'Option "report.tmp_path" is not needed anymore. Just delete it from config!'
        )),
        authentication: Joi.object({
          enabled: Joi.any().forbidden().error(new Error(
            'Option "report.authentication.enabled" was deprecated. Enable per watcher instead: ' +
            'watcher._source.actions[name].report.auth.active=true'
          )),
          mode: Joi.object({
            searchguard: Joi.any().forbidden().error(new Error(
              'Option "report.authentication.mode.searchguard" was deprecated. Enable mode per watcher instead: ' +
              'watcher._source.actions[name].report.auth.mode="searchguard". Options: searchguard, xpack, basic, customselector.'
            )),
            xpack: Joi.any().forbidden().error(new Error(
              'Option "report.authentication.mode.xpack" was deprecated. Enable mode per watcher instead: ' +
              'watcher._source.actions[name].report.auth.mode="xpack". Options: searchguard, xpack, basic, customselector.'
            )),
            basic: Joi.any().forbidden().error(new Error(
              'Option "report.authentication.mode.basic" was deprecated. Enable mode per watcher instead: ' +
              'watcher._source.actions[name].report.auth.mode="basic". Options: searchguard, xpack, basic, customselector.'
            )),
            custom: Joi.any().forbidden().error(new Error(
              'Option "report.authentication.mode.custom" was deprecated. Enable mode per watcher instead: ' +
              'watcher._source.actions[name].report.auth.mode="customselector". Options: searchguard, xpack, basic, customselector.'
            )),
          }).default(),
          custom: Joi.object({
            username_input_selector: Joi.any().forbidden().error(new Error(
              'Option "report.authentication.custom.username_input_selector" was deprecated. Put selector per watcher instead.' +
              'For example, watcher._source.actions[name].report.auth.selector_username="#user".'
            )),
            password_input_selector: Joi.any().forbidden().error(new Error(
              'Option "report.authentication.custom.password_input_selector" was deprecated. Put selector per watcher instead.' +
              'For example, watcher._source.actions[name].report.auth.selector_password="#pass".'
            )),
            login_btn_selector: Joi.any().forbidden().error(new Error(
              'Option "report.authentication.custom.login_btn_selector" was deprecated. Put selector per watcher instead.' +
              'For example, watcher._source.actions[name].report.auth.selector_login_btn=".btn-lg".'
            )),
          }).default(),
        }).default(),
        file: Joi.object({
          pdf: Joi.object({
            format: Joi.any().forbidden().error(new Error(
              'Option "report.file.pdf.format" was deprecated. Set delay per watcher instead: ' +
              'watcher._source.actions[name].report.snapshot.pdf_format="A4"'
            )),
            landscape: Joi.any().forbidden().error(new Error(
              'Option "report.file.pdf.landscape" was deprecated. Set format per watcher instead: ' +
              'watcher._source.actions[name].report.snapshot.pdf_landscape=true'
            )),
          }).default(),
          screenshot: Joi.any().forbidden().error(new Error(
            'Option "report.file.screenshot" was deprecated. Set resolution per watcher,' +
            ' for example watcher._source.actions[name].report.snapshot.res="1920x1080"'
          )),
        }).default(),
        timeout: Joi.any().forbidden().error(new Error(
          'Option "report.timeout" was deprecated. Set timeout per watcher instead: ' +
          'watcher._source.actions[name].report.snapshot.params.delay=5000'
        )),
      }).default(),
      pushapps: Joi.any().forbidden().error(new Error('Option "pushapps" was deprecated.'))
    }).default()
  }).default();
}
