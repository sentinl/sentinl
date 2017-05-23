import newWatcherMenu from '../templates/new-watcher-top-nav.html';
import { app } from '../app.module';

app.service('NavMenu', ['kbnUrl', function (kbnUrl) {
  return {
    getTopNav: function (view) {
      const nav = [
        {
          key: 'about',
          description: 'About',
          run: function () { kbnUrl.change('/about'); },
          testId: 'sentinlAbout'
        }
      ];

      if (view === 'watchers') {
        nav.unshift({
          key: 'new',
          description: 'Create new watcher',
          template: newWatcherMenu,
          testId: 'sentinlNewWatcher'
        });
        return nav;
      }

      return nav;
    },
    getTabs: function (path = '#/') {
      return {
        currentPath: path.includes('#/') ? path : `#/${path}`,
        list: [
          { display: 'Watchers', url: '#/'},
          { display: 'Alarms', url: '#/alarms'},
          { display: 'Reports', url: '#/reports'}
        ]
      };
    }
  };
}]);
