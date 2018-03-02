import template from './new_action.html';

function newAction($rootScope) {
  'ngInject';

  function actionDirective(scope, element, attrs) {

    scope.action = {
      addAction: {
        isOpen: false
      },
      types: {
        webhook: {},
        email: {},
        'email html': {},
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
          $$title: title,
          $$throttle: throttle,
          throttle_period: '1s',
          webhook: {
            $$edit: false,
            $$proxy: false,
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
          $$title: title,
          $$throttle: throttle,
          throttle_period: '1s',
          email: {
            $$edit: false,
            to: '',
            from: '',
            subject: '',
            body: ''
          }
        };
      }

      if (type === 'email html') {
        const title = `New HTML email action ${Math.random().toString(36).slice(2)}`;
        scope.watcher._source.actions[title] = {
          $$title: title,
          $$throttle: throttle,
          throttle_period: '1s',
          email_html: {
            $$edit: false,
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
          $$title: title,
          $$throttle: throttle,
          throttle_period: '1s',
          report: {
            $$edit: false,
            to: '',
            from: '',
            subject: '',
            body: '',
            save: true,
            snapshot: {
              res: '1280x900',
              url: 'http://www.google.com',
              path: '/tmp/',
              type: 'png',
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
          $$title: title,
          $$throttle: throttle,
          throttle_period: '1s',
          slack: {
            $$edit: false,
            channel: '',
            message: '',
            stateless: false
          }
        };
      }

      if (type === 'console') {
        const title = `New console action ${Math.random().toString(36).slice(2)}`;
        scope.watcher._source.actions[title] = {
          $$title: title,
          $$throttle: throttle,
          throttle_period: '1s',
          console: {
            $$edit: false,
            message: '',
          }
        };
      }

      $rootScope.$broadcast('newAction:added');

    };
  };

  return {
    restrict: 'E',
    template,
    scope: true,
    link: actionDirective
  };
};

export default newAction;
