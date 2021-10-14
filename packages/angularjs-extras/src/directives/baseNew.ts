// BaseNew Directive
// -----------------

// Runtime
import _ from 'lodash'
import {
    Stratus
} from '@stratusjs/runtime/stratus'
import {
    IAttributes,
    IScope,
    INgModelController,
    // IParseService
} from 'angular'

// Angular 1 Modules
import 'angular-material'

// Stratus Core
import {cookie} from '@stratusjs/core/environment'
import {LooseObject} from '@stratusjs/core/misc'

// Environment
const min = !cookie('env') ? '.min' : ''
const name = 'baseNew'
const localPath = '@stratusjs/angularjs-extras/src/directives'

// This directive intends to provide basic logic for extending
// the Stratus Auto-Loader for various contextual uses.
Stratus.Directives.BaseNew = (
    // $parse: IParseService
) => ({
    restrict: 'A',
    require: 'ngModel',
    scope: {
        stratusBaseNew: '='
    },
    link: (
        $scope: IScope & LooseObject,
        $element: JQLite & {elementId?: string},
        $attrs: IAttributes,
        ngModel: INgModelController
    ) => {
        // Initialize
        $scope.uid = _.uniqueId(_.snakeCase(name) + '_')
        Stratus.Instances[$scope.uid] = $scope
        $scope.elementId = $element.elementId || $scope.uid
        $scope.initialized = false

        // Inject CSS
        Stratus.Internals.CssLoader(
            `${Stratus.BaseUrl}${Stratus.BundlePath}${localPath}${name}${min}.css`
        ).then(() => $scope.initialized = true)

        // Begin
        console.log(`${name} directive:`, {$scope, $element, $attrs, ngModel})
    },
    template: '<div id="{{ elementId }}" class="no-template"></div>',
    // templateUrl: `${Stratus.BaseUrl}${Stratus.BundlePath}${localPath}${name}${min}.html`
})
