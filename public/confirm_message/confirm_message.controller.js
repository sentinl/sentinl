const confirmMessageController = function ($scope, $uibModalInstance) {

  $scope.yes = function () {
    $uibModalInstance.close('yes');
  };

  $scope.no = function () {
    $uibModalInstance.dismiss('no');
  };
};

confirmMessageController.$nject = ['$scope', '$uibModalInstance'];
export default confirmMessageController;
