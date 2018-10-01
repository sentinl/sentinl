import { uiModules } from 'ui/modules';
import { Notifier } from 'ui/notify/notifier';
import routes from 'ui/routes';
import { assign } from 'lodash';
import SentinlError from '../../lib/sentinl_error';

import './services/wizard_helper';
import './services/watcher_wizard_es_service';
import './components/threshold_watcher_wizard';
import './components/title_panel_watcher_wizard';
import './components/title_panel_watcher_wizard/components/watcher_wizard_human_schedule';
import './components/title_panel_watcher_wizard/components/watcher_wizard_every_schedule';
import './components/title_panel_watcher_wizard/components/watcher_wizard_add_index';
import './components/condition_panel_watcher_wizard';
import './components/condition_panel_watcher_wizard/services/watcher_wizard_chart_service';
import './components/condition_panel_watcher_wizard/components/dd_watcher_agg_type';
import './components/condition_panel_watcher_wizard/components/dd_watcher_agg_field';
import './components/condition_panel_watcher_wizard/components/dd_watcher_agg_over';
import './components/condition_panel_watcher_wizard/components/dd_watcher_agg_time';
import './components/condition_panel_watcher_wizard/components/dd_watcher_agg_interval';
import './components/condition_panel_watcher_wizard/components/dd_watcher_agg_threshold';
import './components/action_panel_watcher_wizard';
import './components/action_panel_watcher_wizard/components/watcher_wizard_add_action';
import './components/action_panel_watcher_wizard/components/watcher_wizard_email_action';
import './components/action_panel_watcher_wizard/components/watcher_wizard_email_html_action';
import './components/action_panel_watcher_wizard/components/watcher_wizard_report_action';
import './components/action_panel_watcher_wizard/components/watcher_wizard_console_action';
import './components/action_panel_watcher_wizard/components/watcher_wizard_webhook_action';
import './components/action_panel_watcher_wizard/components/watcher_wizard_slack_action';
import './components/action_panel_watcher_wizard/components/watcher_wizard_elastic_action';
import './components/impersonation_panel_watcher_wizard';
import './components/input_advanced_panel_watcher_wizard';

import template from './watcher_wizard.html';
import controller from './watcher_wizard';

routes
  .when('/watcher/:id/wizard')
  .when('/watcher/:type/new')
  .defaults(/watcher\/(:id\/wizard|:type\/new)/, {
    template,
    controller,
    controllerAs: 'watcherWizard',
    bindToController: true,
    resolve: {
      watcher: function ($injector) {
        const $route = $injector.get('$route');
        const kbnUrl = $injector.get('kbnUrl');
        const config = $injector.get('sentinlConfig');
        const watcherService = $injector.get('watcherService');
        const getNotifier = $injector.get('getNotifier');
        const notify = getNotifier.create({ location: 'Watcher' });
        const watcherId = $route.current.params.id;

        let spyBtnWatcher;
        try {
          if (window.localStorage.sentinl_saved_query && !!window.localStorage.sentinl_saved_query.length) {
            spyBtnWatcher = JSON.parse(window.localStorage.sentinl_saved_query);
            delete window.localStorage.sentinl_saved_query;
          }
        } catch (err) {
          notify.error(new SentinlError('Parse spy button watcher', err));
          kbnUrl.redirect('/');
        }

        if (!watcherId) {
          return watcherService.new('wizard').then(function (watcher) {
            if (spyBtnWatcher) {
              assign(watcher, spyBtnWatcher);
            }
            return watcher;
          }).catch(function (err) {
            notify.error(new SentinlError('Create new watcher', err));
            kbnUrl.redirect('/');
          });
        }

        return watcherService.get(watcherId).then(function (watcher) {
          watcher._edit = true;
          return watcher;
        }).catch(function (err) {
          notify.error(new SentinlError('Get watcher', err));
          kbnUrl.redirect('/');
        });
      },
    },
  });
