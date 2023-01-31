/**
 * @source https://github.com/formio/angular/blob/master/projects/angular-formio/src/components/formio/formio.component.ts
 */
// NgZone
import {
    Component,
    // NgZone,
    OnInit,
    Optional,
    OnChanges,
    ViewEncapsulation, ElementRef,
} from '@angular/core'
// import { FormioAppConfig } from '../../formio.config'
import { Formio, Form } from 'formiojs'
import { FormioBaseComponent } from '../../FormioBaseComponent'
import { CustomTagsService } from '../../custom-component/custom-tags.service'
import {Stratus} from '@stratusjs/runtime/stratus'
import {DomSanitizer} from '@angular/platform-browser'

// Environment
const packageName = 'form'
const moduleName = 'formio'
const componentName = 'formio'
const systemDir = `@stratusjs/${packageName}`
// Path to -this- folder
const localDir = `${Stratus.BaseUrl}${boot.configuration.paths[`${systemDir}/*`].replace(/[^/]*$/, '').replace(/angular\/dist\/$/, `${packageName}/src/components/${moduleName}/`)}`


/* tslint:disable */
@Component({
    // selector: 'formio',
    selector: `sa-${packageName}-${componentName}`,
    // templateUrl: './formio.component.html',
    templateUrl: `${localDir}/${componentName}.component.html`,
    // styleUrls: ['../../../../../node_modules/formiojs/dist/formio.form.min.css'],
    encapsulation: ViewEncapsulation.None,
})
/* tslint:enable */
export class FormioComponent extends FormioBaseComponent implements OnInit, OnChanges {
    constructor(
        protected sanitizer: DomSanitizer,
        protected elementRef: ElementRef,
        // private ngZone: NgZone, // FIXME ngZone doesn't seem possible
        // @Optional() public customTags?: CustomTagsService,
        public customTags: CustomTagsService,
    ) {
        // super(ngZone, config, customTags)
        // super(ngZone, customTags)
        super(sanitizer, elementRef, customTags)
        // if (this.config) {
        // Formio.setBaseUrl(this.config.apiUrl)
        Formio.setBaseUrl('')
        // Formio.setProjectUrl(this.config.appUrl)
        Formio.setProjectUrl('')
        /*} else {
            console.warn('You must provide an AppConfig within your application!')
        }*/
        console.log('FormioComponent loaded')
    }

    getRenderer() {
        return this.renderer || Form
    }
}
