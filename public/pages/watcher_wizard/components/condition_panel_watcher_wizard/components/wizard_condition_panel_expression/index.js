import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { uiModules } from 'ui/modules';
import WizardConditionPanelExpression from './wizard_condition_panel_expression';

const module = uiModules.get('apps/sentinl');
module.directive('wizardConditionPanelExpression', function () {
  return {
    restrict: 'E',
    scope: {
      chartQueryParams: '=',
      indexTextFields: '=',
      indexDateFields: '=',
      indexNumericFields: '=',
      onChange: '=',
    },
    controller: function ($scope, $element, $timeout) {
      function renderComponent() {
        render(
          <WizardConditionPanelExpression
            indexNumericFields={$scope.indexNumericFields}
            indexDateFields={$scope.indexDateFields}
            indexTextFields={$scope.indexTextFields}
            chartQueryParams={$scope.chartQueryParams}
            onChange={(params) => { // don't do this 'onChange={$scope.onChange}', it prevents React component update
              $scope.onChange(params);
            }}
          ></WizardConditionPanelExpression>,
          $element[0]
        );
      };

      renderComponent();

      $scope.$watchGroup([
        'indexNumericFields',
        'indexDateFields',
      ], renderComponent);

      $scope.$watch('chartQueryParams', renderComponent, true);
      $scope.$on('$destroy', () => unmountComponentAtNode($element[0]));
    }
  };
});
