import uiModules from 'ui/modules';
import chrome from 'ui/chrome';

uiModules
.get('api/sentinl', [])
.controller('ConfirmMessageController', function ($scope, $modalInstance, action) {

  $scope.yes = function () {
    $modalInstance.close('yes');
  };

  $scope.no = function () {
    $modalInstance.dismiss('no');
  };

});
