import {
    AfterViewInit,
    Component,
    OnInit,
} from '@angular/core'
// import {DomSanitizer} from '@angular/platform-browser'
// import {keys} from 'ts-transformer-keys'
import {Stratus} from '@stratusjs/runtime/stratus'
// import {GoogleMap, MapInfoWindow, MapMarker} from '@angular/google-maps'
// import {debounce, isArray, isBoolean, isEmpty, isFunction, isNumber, isString} from 'lodash'
// import {isJSON, safeUniqueId} from '@stratusjs/core/misc'
import {RootComponent} from '../../angular/src/core/root.component'

// Environment
const packageName = 'form'
const componentName = 'renderer'
const selectorName = `${packageName}-${componentName}`
const systemDir = `@stratusjs/${packageName}`
const localDir = `${Stratus.BaseUrl}${boot.configuration.paths[`${systemDir}/*`].replace(/[^/]*$/, '').replace(/angular\/dist\/$/, 'form/src/')}`


/**
 * @title AutoComplete Selector with Drag&Drop Sorting
 */
@Component({
    // selector: 'sa-selector-component',
    selector: `sa-${selectorName}`,
    templateUrl: `${localDir}/${componentName}.component.html`
    // FIXME: This doesn't work, as it seems Angular attempts to use a System.js import instead of their own, so it will
    // require the steal-css module
    // styleUrls: [
    //     `${localDir}/${moduleName}.component.css`
    // ],
    // changeDetection: ChangeDetectionStrategy.OnPush // Detect changes only once
})

export class FormRendererComponent extends RootComponent implements OnInit, AfterViewInit { // implements OnInit, OnChanges

    /** Loads when this component Inits */
    async ngOnInit() {
        console.log('FormRenderer inited', this)
    }

    /** Loads when this component renders */
    ngAfterViewInit() {
        console.log('FormRenderer inited', this)
    }
}
