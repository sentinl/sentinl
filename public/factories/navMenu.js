import chrome from 'ui/chrome';

import newWatcherMenu from '../templates/new-watcher-top-nav.html';
import { app } from '../app.module';

const impactLogo = require('plugins/sentinl/sentinl-white-logo.svg');
const smallLogo = require('plugins/sentinl/sentinl.svg');

app.factory('navMenu', ['kbnUrl', function (kbnUrl) {
  return {
    setKbnLogo: function (isOpen) {
      if (isOpen) {
        chrome.setBrand({
          logo: `url(${impactLogo}) left no-repeat`,
        })
        .setNavBackground('#222222');
      } else {
        chrome.setBrand({
          logo: `url(${smallLogo}) left no-repeat`
        })
        .setNavBackground('#222222');
      }
    },
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
