/**
 * @source https://github.com/formio/angular/blob/master/projects/angular-formio/src/components/formio/formio.component.ts
 */
import {
    Component,
    NgZone,
    OnInit,
    Optional,
    OnChanges,
    ViewEncapsulation, ElementRef,
} from '@angular/core'
import { LocationStrategy } from '@angular/common'
import { Formio, Form } from 'formiojs'
import { FormioBaseComponent } from '../../FormioBaseComponent'
import { CustomTagsService } from '../../custom-component/custom-tags.service'
import {Stratus} from '@stratusjs/runtime/stratus'
import {DomSanitizer} from '@angular/platform-browser'

// Environment
const packageName = 'form'
// const moduleName = 'formio'
const componentName = 'formio'
const systemDir = `@stratusjs/${packageName}`
// Path to -this- folder
const localDir = `${Stratus.BaseUrl}${boot.configuration.paths[`${systemDir}/*`].replace(/[^/]*$/, '').replace(/angular\/dist\/$/, `${packageName}/src/components/${componentName}/`)}`

@Component({
    selector: `sa-${packageName}-${componentName}`,
    templateUrl: `${localDir}/${componentName}.component.html`,
    // styleUrls: ['../../../../../node_modules/formiojs/dist/formio.form.min.css'],
    encapsulation: ViewEncapsulation.None,
})
export class FormioComponent extends FormioBaseComponent implements OnInit, OnChanges {
    constructor(
        protected sanitizer: DomSanitizer,
        protected elementRef: ElementRef,
        protected ngZone: NgZone, // FIXME ngZone doesn't seem possible
        private locationStrategy: LocationStrategy,
        @Optional() public customTags?: CustomTagsService,
        // public customTags: CustomTagsService,
    ) {
        // super(ngZone, config, customTags)
        // super(ngZone, customTags)
        super(sanitizer, elementRef, ngZone, customTags)
        // if (this.config) {
        // Formio.setBaseUrl(this.config.apiUrl)
        // Formio.setBaseUrl('https://client.davis.sitetheory.io/') // FIXME get the current domain
        // console.log('setting baseUrl to', this.locationStrategy.getBaseHref())
        Formio.setBaseUrl(this.locationStrategy.getBaseHref())
        // Formio.setProjectUrl(this.config.appUrl)
        // Formio.setProjectUrl('')
        /*} else {
            console.warn('You must provide an AppConfig within your application!')
        }*/
        console.log('FormioComponent loaded', this)
    }

    getRenderer() {
        return this.renderer || Form
    }
}
