/* global $ */

class PopOver {
  constructor($compile) {
    this.restrict = 'A';
    this.transclude = true;
    this.template = '<span ng-transclude class="pop-over-container"></span>';
    this.$compile = $compile;
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
        content: this.$compile(html)(scope),
        title: popOverTitle || '',
        placement: popOverPlacement || 'bottom',
        trigger: popOverTrigger || 'click',
        html: true,
      });
    });
  }
}

export default PopOver;
