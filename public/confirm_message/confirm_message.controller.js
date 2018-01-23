function confirmMessageController($scope, $uibModalInstance) {
  'ngInject';

  $scope.yes = function () {
    $uibModalInstance.close('yes');
  };

  $scope.no = function () {
    $uibModalInstance.dismiss('no');
  };
};

export default confirmMessageController;
