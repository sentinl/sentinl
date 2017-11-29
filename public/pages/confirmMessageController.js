/*global angular*/
const ConfirmMessageController = function ($scope, $uibModalInstance) {

  $scope.yes = function () {
    $uibModalInstance.close('yes');
  };

  $scope.no = function () {
    $uibModalInstance.dismiss('no');
  };
};

ConfirmMessageController.$nject = ['$scope', '$uibModalInstance'];
export default angular.module('apps/sentinl.confirmMessage', []).controller('ConfirmMessageController', ConfirmMessageController);
