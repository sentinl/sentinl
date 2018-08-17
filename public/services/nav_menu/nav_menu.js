import { forEach, filter, includes } from 'lodash';
import uiChrome from 'ui/chrome';

import template from './nav_menu.html';

class NavMenu {

  constructor($rootScope, kbnUrl) {
    this.$rootScope = $rootScope;
    this.kbnUrl = kbnUrl;
  }

  getTopNav(view) {
    const nav = [
      {
        key: 'about',
        description: 'About',
        run: () => { this.kbnUrl.change('/about'); },
        testId: 'sentinlAbout'
      }
    ];

    if (view === 'watchers') {
      nav.unshift({
        key: 'new',
        description: 'Create new watcher',
        template,
        testId: 'sentinlNewWatcher'
      });
      return nav;
    }

    if (view === 'editor') {
      const editorMenu = [
        {
          key: 'Cancel',
          description: 'Cancel editor',
          run: () => { this.$rootScope.$broadcast('navMenu:cancelEditor'); },
          testId: 'cancelEditor'
        },
        {
          key: 'Save',
          description: 'Save editor',
          run: () => { this.$rootScope.$broadcast('navMenu:saveEditor'); },
          testId: 'saveEditor'
        }
      ];
      forEach(editorMenu, (menu) => nav.unshift(menu));
      return nav;
    }
    return nav;
  }

  getTabs(path = '#/', tmpTabs = null) {
    const tabMenu = {
      currentPath: path.includes('#/') ? path : `#/${path}`,
      list: [
        { display: 'Watchers', url: '#/'},
        { display: 'Alarms', url: '#/alarms'},
        { display: 'Reports', url: '#/reports'}
      ]
    };

    if (tmpTabs) {
      forEach(tmpTabs, (tab) => tabMenu.list.push({ display: tab.name, url: tab.url }));
    } else {
      tabMenu.list = filter(tabMenu.list, (tab) => includes(['Watchers', 'Alarms', 'Reports'], tab.display));
    }
    return tabMenu;
  }
}

export default NavMenu;
