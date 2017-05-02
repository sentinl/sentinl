import uiModules from 'ui/modules';
import watcherNewAction from './new-action.html';

uiModules
.get('api/sentinl', [])
.directive('newAction', function () {
  function actionDirective(scope, element, attrs) {

    scope.action = {
      types: {
        webhook: {},
        email: {},
        email_html: {},
        report: {},
        slack: {},
        console: {}
      }
    };

    scope.addAction = function (type) {

      const throttle = {
        hours: 0,
        mins: 0,
        secs: 1
      };

      if (type === 'webhook') {
        const title = `New webhook action ${Math.random().toString(36).slice(2)}`;
        scope.watcher._source.actions[title] = {
          _title: title,
          _throttle: throttle,
          throttle_period: '1s',
          webhook: {
            _edit: false,
            _proxy: false,
            method: 'POST',
            host: '',
            port: 9200,
            proxy: false,
            path: '',
            body: ''
          }
        };
      }

      if (type === 'email') {
        const title = `New email action ${Math.random().toString(36).slice(2)}`;
        scope.watcher._source.actions[title] = {
          _title: title,
          _throttle: throttle,
          throttle_period: '1s',
          email: {
            _edit: false,
            to: '',
            from: '',
            subject: '',
            body: ''
          }
        };
      }

      if (type === 'email_html') {
        const title = `New HTML email action ${Math.random().toString(36).slice(2)}`;
        scope.watcher._source.actions[title] = {
          _title: title,
          _throttle: throttle,
          throttle_period: '1s',
          email_html: {
            _edit: false,
            to: '',
            from: '',
            subject: '',
            body: '',
            html: ''
          }
        };
      }

      if (type === 'report') {
        const title = `New report action ${Math.random().toString(36).slice(2)}`;
        scope.watcher._source.report = true;
        scope.watcher._source.actions[title] = {
          _title: title,
          _throttle: throttle,
          throttle_period: '1s',
          report: {
            _edit: false,
            to: '',
            from: '',
            subject: '',
            body: '',
            snapshot: {
              res: '1280x900',
              url: 'http://www.google.com',
              path: '/tmp/',
              params: {
                delay: 5000
              }
            }
          }
        };
      }

      if (type === 'slack') {
        const title = `New slack action ${Math.random().toString(36).slice(2)}`;
        scope.watcher._source.actions[title] = {
          _title: title,
          _throttle: throttle,
          throttle_period: '1s',
          slack: {
            _edit: false,
            channel: '',
            message: '',
            stateless: false
          }
        };
      }

      if (type === 'console') {
        const title = `New console action ${Math.random().toString(36).slice(2)}`;
        scope.watcher._source.actions[title] = {
          _title: title,
          _throttle: throttle,
          throttle_period: '1s',
          console: {
            _edit: false,
            message: '',
          }
        };
      }


    };
  };

  return {
    restrict: 'E',
    template: watcherNewAction,
    scope: true,
    link: actionDirective
  };
});
