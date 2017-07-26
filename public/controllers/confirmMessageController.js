import { app } from '../app.module';

app.controller('ConfirmMessageController', function ($scope, $uibModalInstance) {

  $scope.yes = function () {
    $uibModalInstance.close('yes');
  };

  $scope.no = function () {
    $uibModalInstance.dismiss('no');
  };

});
