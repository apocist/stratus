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
import {safeUniqueId} from '@stratusjs/core/misc'

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
        protected ngZone: NgZone,
        private locationStrategy: LocationStrategy,
        @Optional() public customTags?: CustomTagsService,
    ) {
        super(sanitizer, elementRef, ngZone, customTags)
        this.uid = safeUniqueId('sa', packageName, componentName, 'component')
        Stratus.Instances[this.uid] = this

        // console.log('setting baseUrl to', this.locationStrategy.getBaseHref())
        Formio.setBaseUrl(this.locationStrategy.getBaseHref())
        // Formio.setProjectUrl('')
        console.log('FormioComponent loaded', this)
    }

    getRenderer() {
        return this.renderer || Form
    }
}
