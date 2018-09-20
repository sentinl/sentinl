import { uiModules } from 'ui/modules';
import { Notifier } from 'ui/notify/notifier';
import routes from 'ui/routes';

import './components/search_filter';

import template from './custom_watcher.html';
import controller from './custom_watcher';

routes
  .when('/watcher/custom/:id/edit')
  .when('/watcher/custom/:type/new')
  .defaults(/watcher\/custom\/(:id\/edit|:type\/new)/, {
    template,
    controller,
    bindToController: true,
    controllerAs: 'customWatcher',
    resolve: {
      watcher: function ($route, kbnUrl, watcherFactory, sentinlConfig) {
        const watcherService = watcherFactory.get(sentinlConfig.api.type);
        const notifier = new Notifier({ location: 'Watcher' });

        const type = $route.current.params.type;

        if (type) {
          try {
            if (window.localStorage.sentinl_saved_query && window.localStorage.sentinl_saved_query.length) {
              const watcher = JSON.parse(window.localStorage.sentinl_saved_query);
              delete window.localStorage.sentinl_saved_query;
              watcher.custom = { type };
              return watcher;
            } else {
              return watcherService.new('advanced')
                .then(watcher => {
                  watcher.custom.type = type;
                  return watcher;
                });
            }
          } catch (err) {
            notifier.error(`Could not parse watcher created from dashboard: ${err.toString()}`);
            kbnUrl.redirect('/');
          }
        } else {
          return watcherService
            .get($route.current.params.id)
            .catch(function (err) {
              notifier.error(err);
              kbnUrl.redirect('/');
            });
        }
      },
      watcherTemplate: function ($route, kbnUrl, savedScripts, watcherFactory, sentinlConfig) {
        const watcherService = watcherFactory.get(sentinlConfig.api.type);
        const notifier = new Notifier({ location: 'Watcher' });

        if ($route.current.params.type) {
          return savedScripts.find()
            .then(scripts => scripts.hits.find(script => script.id === $route.current.params.type))
            .then(script => {
              const watcherTemplate = eval(script.scriptSource); // eslint-disable-line no-eval
              watcherTemplate.title = script.title;
              watcherTemplate.id = script.id;
              return watcherTemplate;
            })
            .catch(function (err) {
              notifier.error(err);
              kbnUrl.redirect('/');
            });
        } else {
          return watcherService.get($route.current.params.id)
            .then(watcher => {
              return savedScripts.find()
                .then(scripts => scripts.hits.find(script => script.title === watcher.custom.type))
                .then(script => {
                  const watcherTemplate = eval(script.scriptSource); // eslint-disable-line no-eval
                  watcherTemplate.title = script.title;
                  watcherTemplate.id = script.id;
                  return watcherTemplate;
                })
                .catch(function (err) {
                  notifier.error(err);
                  kbnUrl.redirect('/');
                });
            });
        }
      }
    }
  });
