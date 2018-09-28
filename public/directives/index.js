/* global angular */

import popOver from './pop_over';
import mustacheTemplateInput from './mustache_template_input';

export default angular.module('apps/sentinl.directives', [
  popOver.name,
  mustacheTemplateInput.name
]);
