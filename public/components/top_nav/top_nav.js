import template from './top_nav.html';

class TopNav {
  constructor() {
    this.template = template;
    this.restrict = 'E';
    this.scope = {
      topNavMenu: '=menu',
      tabsMenu: '=tabs',
    };
  }
}

export default TopNav;
