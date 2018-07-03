/* global $ */

let self; // global var because 'link' method creates its own scope (this)

class PopOver {
  constructor($compile) {
    self = this;
    self.restrict = 'A';
    self.transclude = true;
    self.template = '<span ng-transclude class="pop-over-container"></span>';
    self.$compile = $compile;
  }

  link(scope, element, attrs) {
    $(document).ready(() => {
      window.PoIsOpen = false;
      const {popOverTemplate, popOverTitle, popOverPlacement, popOverTrigger} = attrs;

      let html = popOverTemplate || '<div>no template was defined</div>';
      if (!popOverTemplate || !popOverTemplate.length) {
        html = $(element).siblings('.pop-over-content').contents();
      }

      $(element).popover({
        content: self.$compile(html)(scope),
        title: popOverTitle || '',
        placement: popOverPlacement || 'bottom',
        trigger: popOverTrigger || 'click',
        html: true,
      });
    });
  }
}

export default PopOver;
