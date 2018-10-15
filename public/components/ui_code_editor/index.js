import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { uiModules } from 'ui/modules';
import UiCodeEditor from './ui_code_editor';

const module = uiModules.get('apps/sentinl');
module.directive('uiCodeEditor', function () {
  return {
    restrict: 'E',
    scope: {
      value: '=',
      mode: '@',
      maxLines: '=',
      minLines: '=',
      isReadOnly: '=',
      debounce: '=',
      onValueChange: '&'
    },
    controller: function ($scope, $element, $timeout) {
      function renderComponent() {
        render(
          <UiCodeEditor
            value={$scope.value}
            mode={$scope.mode}
            maxLines={$scope.maxLines}
            minLines={$scope.minLines}
            isReadOnly={$scope.isReadOnly}
            debounce={$scope.debounce}
            onValueChange={(value) => {
              $scope.onValueChange({ value });
            }}
          ></UiCodeEditor>,
          $element[0]
        );
      };

      renderComponent();

      $scope.$watch('value', () => {
        renderComponent();
      });

      $scope.$on('$destroy', () => unmountComponentAtNode($element[0]));
    }
  };
});
