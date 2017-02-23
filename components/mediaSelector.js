//     Stratus.Components.mediaSelector.js 1.0

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

// Stratus Media Selector Component
// ----------------------

// Define AMD, Require.js, or Contextual Scope
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([
            'stratus',
            'jquery',
            'angular',
            'jquery-cookie',
            'angular-file-upload',
            'stratus.services.registry',
            'angular-material',
            'stratus.components.search',
            'stratus.components.pagination'
        ], factory);
    } else {
        factory(root.Stratus, root.$);
    }
}(this, function (Stratus, $) {
    // We need to ensure the ng-file-upload is registered
    Stratus.Modules.ngFileUpload = true;

    // This component intends to handle binding of an
    // item array into a particular attribute.
    Stratus.Components.MediaSelector = {
        bindings: {
            ngModel: '='
        },
        controller: function ($scope, $http, $attrs, $parse, $element, Upload, $compile, registry, $mdPanel, $q) {
            Stratus.Instances[_.uniqueId('media_selector')] = $scope;

            // load component css
            Stratus.Internals.CssLoader(Stratus.BaseUrl + 'sitetheorystratus/stratus/components/mediaSelector' + (Stratus.Environment.get('production') ? '.min' : '') + '.css');

            // use stratus collection locally
            $scope.registry = new registry();

            // fetch media collection and hydrate to $scope.collection
            $scope.registry.fetch('Media', $scope);

            // set media library to false
            $scope.showLibrary = false;
            $scope.showDragDropLibrary = false;
            $scope.draggedFiles = [];

            // $scope.log = '';
            $scope.files = [];

            // initialise library class to plus
            $scope.showLibraryClass = 'fa fa-plus-square-o';
            $scope.dragDropClass = 'fa fa-plus';

            $scope.zoomView = function (event) {
                $scope.mediaDetail = event;
                var position = $mdPanel.newPanelPosition()
                    .absolute()
                    .center();
                var config = {
                    attachTo: angular.element(document.body),

                    // controller: 'mediaZoomView',
                    // controllerAs: 'ctrl',
                    scope: $scope,
                    disableParentScroll: this.disableParentScroll,
                    templateUrl: 'mediaDetail.html',
                    hasBackdrop: true,
                    panelClass: 'media-dialog',
                    position: position,
                    trapFocus: true,
                    zIndex: 150,
                    clickOutsideToClose: true,
                    escapeToClose: true,
                    focusOnOpen: true
                };
                $mdPanel.open(config);
            };

            // function called when is uploaded or drag/dropped
            $scope.uploadFiles = function (files) {
                // hide if media library is opened on click
                $scope.showLibrary = false;

                var position = $mdPanel.newPanelPosition()
                    .absolute()
                    .center();
                var config = {
                    attachTo: angular.element(document.body),

                    // controller: 'mediaZoomView',
                    // controllerAs: 'ctrl',
                    scope: $scope,
                    disableParentScroll: this.disableParentScroll,
                    templateUrl: 'uploadedFiles.html',
                    hasBackdrop: true,
                    panelClass: 'media-dialog',
                    position: position,
                    trapFocus: true,
                    zIndex: 150,
                    clickOutsideToClose: true,
                    escapeToClose: true,
                    focusOnOpen: true
                };
                $mdPanel.open(config);

                // check if media library already opened, then load media library
                if ($scope.dragDropClass === 'fa fa-minus') {
                    $scope.showDragDropLibrary = true;

                    // $scope.uploadMedia();
                }
            };

            // upload directly to media library
            $scope.uploadToLibrary = function (files) {
                var promises = [];
                angular.forEach(files, function (file) {
                    promises.push($scope.saveMedia(file));
                });
                $q.all(promises).then(function (data) {
                    $scope.uploadMedia();
                });
            };

            // open libary div when clicked on upper browse div
            $scope.openLibrary = function () {
                // show library media
                if ($scope.showLibraryClass === 'fa fa-plus-square-o') {
                    $scope.showLibraryClass = 'fa fa-minus-square-o';
                    $scope.showLibrary = true;
                    $scope.showDragDropLibrary = false;
                    $scope.dragDropClass = 'fa fa-plus';
                    if ($scope.dragDropClass === 'fa fa-plus') {
                        $scope.dragDropClass = 'fa fa-minus';
                    } else {
                        $scope.dragDropClass = 'fa fa-plus';
                    }

                    // switch to registry controls
                    $scope.uploadMedia();
                } else if ($scope.showLibraryClass === 'fa fa-minus-square-o') {
                    $scope.showLibraryClass = 'fa fa-plus-square-o';
                    $scope.showLibrary = false;
                }
            };

            // open media library when clicked on plus icon
            $scope.mediaLibrary = function () {
                if ($scope.dragDropClass === 'fa fa-plus') {
                    $scope.dragDropClass = 'fa fa-minus';

                    // hide if library opened above
                    $scope.showLibrary = false;

                    // show media library div
                    $scope.showDragDropLibrary = true;

                    // load media library
                    $scope.uploadMedia();
                } else if ($scope.dragDropClass === 'fa fa-minus') {
                    $scope.dragDropClass = 'fa fa-plus';
                    $scope.showDragDropLibrary = false;
                }
            };

            // common function to load media library from collection
            $scope.uploadMedia = function () {
                // switch to registry controls
                $scope.collection.fetch();
            };

            // check if ng-model value changes
            $scope.$watch('files', function (files) {
                if (files != null) {
                    // make files array for not multiple to be able to be used in ng-repeat in the ui
                    if (!angular.isArray(files)) {
                        $timeout(function () {
                            $scope.files = files = [files];
                        });
                        return;
                    }
                    for (var i = 0; i < files.length; i++) {
                        $scope.errorMsg = null;
                        (function (f) {
                            $scope.saveMedia(f);
                        })(files[i]);

                    }
                }
            });

            // common function to save media to server
            $scope.saveMedia = function (file) {
                file.upload = Upload.upload({
                    url: 'https://app.sitetheory.io:3000/?session=' + $.cookie('SITETHEORY'),
                    data: {
                        file: file
                    }
                });
                file.upload.then(function (response) {
                    file.result = response.data;
                    $scope.draggedFiles.push(response.data);

                   // $scope.uploadMedia();
                }, function (response) {
                    if (response.status > 0)
                        $scope.errorMsg = response.status + ': ' + response.data;
                });
                file.upload.progress(function (evt) {
                    file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                });
            };
        },
        templateUrl: Stratus.BaseUrl + 'sitetheorystratus/stratus/components/mediaSelector' + (Stratus.Environment.get('production') ? '.min' : '') + '.html'
    };
}));
