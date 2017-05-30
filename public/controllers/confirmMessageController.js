import { app } from '../app.module';

app.controller('ConfirmMessageController', function ($scope, $modalInstance) {

  $scope.yes = function () {
    $modalInstance.close('yes');
  };

  $scope.no = function () {
    $modalInstance.dismiss('no');
  };

});
