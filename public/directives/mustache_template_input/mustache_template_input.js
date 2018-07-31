import template from './mustache_template_input.html';
import mustache from 'mustache';
import sanitizeHtml from 'sanitize-html';

import {forEach} from 'lodash';

class mustacheTemplateInputController {
  constructor($scope, $sce) {
    this.$scope = $scope;
    this.$sce = $sce;
    this.language = this.language || this.$scope.language || 'text';
    this.content = this.content || this.$scope.content || '';
    this.unvalidatedInput = this.content;
    this.injectedData = this.injectedData || this.$scope.injectedData;
    this.aceOptions = this.aceOptions || this.$scope.aceOptions;

    this.htmlSantizerOptions = {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        'abbr', 'acronym', 'cite', 'col', 'colgroup', 'del', 'footer', 'h1', 'h2', 'header',
        'img', 'mark', 'q', 'section', 'small', 'span', 'sub', 'sup', 'tfoot', 'u'
      ]),
      allowedAttributes: sanitizeHtml.defaults.allowedAttributes
    };

    forEach(this.htmlSantizerOptions.allowedTags, tag => {
      this.htmlSantizerOptions.allowedAttributes[tag] = (sanitizeHtml.defaults.allowedAttributes[tag] || []).concat('style');
    });
  }

  render(template) {
    this.content = (this.language.toLowerCase() === 'html') ? sanitizeHtml(template, this.htmlSantizerOptions) : template;
    return this.$sce.trustAsHtml(mustache.render(this.content, this.injectedData));
  }
}

function mustacheTemplateInput() {
  return {
    template,
    restrict: 'E',
    transclude: true,
    scope: {
      language: '@',
      content: '=',
      injectedData: '=',
      aceOptions: '&',
    },
    controller: mustacheTemplateInputController,
    controllerAs: 'mustacheTemplateInput',
    bindToController: {
      language: '@',
      content: '=',
      injectedData: '=',
      aceOptions: '&',
    },
  };
}

export default mustacheTemplateInput;
