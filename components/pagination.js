//     Stratus.Components.Pagination.js 1.0

//     Copyright (c) 2016 by Sitetheory, All Rights Reserved
//
//     All information contained herein is, and remains the
//     property of Sitetheory and its suppliers, if any.
//     The intellectual and technical concepts contained herein
//     are proprietary to Sitetheory and its suppliers and may be
//     covered by U.S. and Foreign Patents, patents in process,
//     and are protected by trade secret or copyright law.
//     Dissemination of $scope information or reproduction of $scope
//     material is strictly forbidden unless prior written
//     permission is obtained from Sitetheory.
//
//     For full details and documentation:
//     http://docs.sitetheory.io

// Stratus Pagination Component
// ----------------------

// Define AMD, Require.js, or Contextual Scope
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['stratus', 'underscore', 'angular', 'angular-material'], factory);
    } else {
        factory(root.Stratus, root._);
    }
}(this, function (Stratus, _) {
    // This component intends to handle binding and
    // full pagination for the scope's collection.
    Stratus.Components.Pagination = {
        controller: function ($scope) {
            $scope.pages = [];
            $scope.startPage = 0;
            $scope.endPage = 0;
            $scope.collection = $scope.$parent.collection;
            $scope.meta = $scope.$parent.collection.meta;
            $scope.$watch('meta.attributes.pageCurrent', function (newValue) {
                if ($scope.meta.get('pageTotal') <= 10) {
                    // less than 10 total pages so show all
                    $scope.startPage = 1;
                    $scope.endPage = $scope.meta.get('pageTotal');
                } else {
                    // more than 10 total pages so calculate start and end pages
                    if ($scope.meta.get('pageCurrent') <= 6) {
                        $scope.startPage = 1;
                        $scope.endPage = 10;
                    } else if ($scope.meta.get('pageCurrent') + 4 >= $scope.meta.get('pageTotal')) {
                        $scope.startPage = $scope.meta.get('pageTotal') - 9;
                        $scope.endPage = $scope.meta.get('pageTotal');
                    } else {
                        $scope.startPage = $scope.meta.get('pageCurrent') - 5;
                        $scope.endPage = $scope.meta.get('pageCurrent') + 4;
                    }
                }
                if (!isNaN($scope.startPage) && !isNaN($scope.endPage)) {
                    $scope.pages = _.range($scope.startPage, $scope.endPage + 1);
                }
            });
        },
        template: '<ul ng-if="meta.attributes.pageTotal > 1" class="pagination">\
                    <li ng-show="startPage > 1" ng-class="{disabled:meta.attributes.pageCurrent == 1}">\
                        <a ng-click="meta.attributes.pageCurrent == 1 || page(1)">First</a>\
                    </li>\
                    <li ng-class="{disabled:meta.attributes.pageCurrent == 1}">\
                        <a ng-click="meta.attributes.pageCurrent == 1 || collection.page(meta.attributes.pageCurrent - 1)">Previous</a>\
                    </li>\
                    <li ng-repeat="page in pages" ng-class="{active:meta.attributes.pageCurrent == page}">\
                        <a ng-click="collection.page(page)">{{ page }}</a>\
                    </li>\
                    <li ng-class="{disabled:meta.attributes.pageCurrent == meta.attributes.pageTotal}">\
                        <a ng-click="meta.attributes.pageCurrent == meta.attributes.pageTotal || collection.page(meta.attributes.pageCurrent + 1)">Next</a>\
                    </li>\
                    <li ng-show="endPage < meta.attributes.pageTotal" ng-class="{disabled:meta.attributes.pageCurrent == meta.attributes.pageTotal}">\
                        <a ng-click="meta.attributes.pageCurrent == meta.attributes.pageTotal || collection.page(meta.attributes.pageTotal)">Last</a>\
                    </li>\
                </ul>\
                <span ng-show="false" class="paginatorTotal customFontSecondary smallLabel">({{ meta.attributes.countTotal }} Results)</span>\
                <md-progress-linear ng-if="collection.paginate" md-mode="indeterminate"></md-progress-linear>'
    };
}));