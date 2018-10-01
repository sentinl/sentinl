import { uiModules } from 'ui/modules';
import { Notifier } from 'ui/notify/notifier';
import routes from 'ui/routes';
import SentinlError from '../../lib/sentinl_error';

import template from './watcher_advanced.html';
import controller from './watcher_advanced';

routes
  .when('/watcher/raw/:id/edit')
  .when('/watcher/raw/:type/new')
  .defaults(/watcher\/raw\/(:id\/edit|:type\/new)/, {
    template,
    controller,
    controllerAs: 'watcherAdvanced',
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

        if (!watcherId) {
          return watcherService.new('advanced').catch(function (err) {
            notify.error(new SentinlError('Create new watcher', err));
            kbnUrl.redirect('/');
          });
        }

        return watcherService.get(watcherId).catch(function (err) {
          notify.error(new SentinlError('Get watcher', err));
          kbnUrl.redirect('/');
        });
      },
    },
  });
