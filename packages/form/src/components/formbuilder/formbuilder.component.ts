/**
 * @source https://github.com/formio/angular/blob/master/projects/angular-formio/src/components/formbuilder/formbuilder.component.ts
 */
import {Stratus} from '@stratusjs/runtime/stratus'
import {
    Component,
    Input,
    OnInit,
    OnChanges,
    OnDestroy,
    ViewEncapsulation,
    Optional,
    ElementRef,
    ViewChild,
    EventEmitter,
    Output,
    NgZone
} from '@angular/core'
import {
    FormioForm,
    FormioOptions
} from '../../formio.common'
import { Formio, FormBuilder, Utils } from 'formiojs'
import { assign } from 'lodash'
import { Observable, Subscription } from 'rxjs'
import { CustomTagsService } from '../../custom-component/custom-tags.service'
import {RootComponent} from '../../../../angular/src/core/root.component'
import {DomSanitizer} from '@angular/platform-browser'
import {LocationStrategy} from '@angular/common'
import {keys} from 'ts-transformer-keys'

// Environment
const packageName = 'form'
// const moduleName = 'formio'
const componentName = 'formbuilder'
const systemDir = `@stratusjs/${packageName}`
// Path to -this- folder
const localDir = `${Stratus.BaseUrl}${boot.configuration.paths[`${systemDir}/*`].replace(/[^/]*$/, '').replace(/angular\/dist\/$/, `${packageName}/src/components/${componentName}/`)}`
// Path to FormIo
// formio.builder.css
// const formioCssPath = `${Stratus.BaseUrl}${boot.configuration.paths.formiojs.replace(/formio\.full\/$/, 'formio.builder')}.css`
const formioCssPath = `${Stratus.BaseUrl}${boot.configuration.paths.formiojs}.css` // formio.full.css

@Component({
    selector: `sa-${packageName}-${componentName}`,
    // templateUrl: `${localDir}/${componentName}.component.html`,
    template: '<div #builder></div>',
    // styleUrls: ['../../../../../node_modules/formiojs/dist/formio.builder.min.css'],
    encapsulation: ViewEncapsulation.None
})
export class FormBuilderComponent extends RootComponent implements OnInit, OnChanges, OnDestroy {
    public ready: Promise<object>
    public readyResolve: any
    public formio: any
    public builder: FormBuilder
    public componentAdding = false
    private refreshSubscription: Subscription
    @Input() form?: FormioForm
    @Input() options?: FormioOptions
    @Input() formbuilder?: any
    @Input() noeval ? = false
    @Input() refreshNow?: Observable<void>
    @Input() rebuild?: Observable<object>
    @Output() change?: EventEmitter<object>
    @ViewChild('builder', { static: true }) builderElement?: ElementRef

    constructor(
        protected sanitizer: DomSanitizer,
        protected elementRef: ElementRef,
        protected ngZone: NgZone, // FIXME ngZone doesn't seem possible
        private locationStrategy: LocationStrategy,
        @Optional() public customTags?: CustomTagsService,
    ) {
        super()

        this.hydrate(elementRef, sanitizer, keys<FormBuilderComponent>())
        // Stratus.Internals.CssLoader(`${formioCssPath}`)
        Promise.all([
            Stratus.Internals.CssLoader(`${formioCssPath}`),
            Stratus.Internals.CssLoader(`${localDir}${componentName}.component.css`)
        ])
            .then(() => {
                // this.styled = true
            })
            .catch(() => {
                console.error('CSS Failed to load for Component:', this)
                // this.styled = false
            })

        // console.log('setting baseUrl to', this.locationStrategy.getBaseHref())
        Formio.setBaseUrl(this.locationStrategy.getBaseHref())
        // Formio.setProjectUrl(this.locationStrategy.getBaseHref())
        // TODO run Formio.saveProject({stuff:'here'})

        this.change = new EventEmitter()
        this.ready = new Promise((resolve: any) => {
            this.readyResolve = resolve
        })

        // FIXME we need to translate this.form into any object if its a string
        console.log('FormBuilderComponent loaded', this)
    }

    ngOnInit() {
        Utils.Evaluator.noeval = this.noeval

        if (this.refreshNow) {
            console.log('running refreshNow on event', this.refreshNow)
            this.refreshSubscription = this.refreshNow.subscribe(() => {
                this.ngZone.runOutsideAngular(() => {
                    this.buildForm(this.form)
                })
            })
        } else {
            // If refreshNow isn't set, we need some kind of way to instantiate
            this.ngZone.runOutsideAngular(() => {
                // this.buildForm(this.form)
                // FIXME need to provide some form options
                this.buildForm({components: []})
            })
        }

        if (this.rebuild) {
            // console.log('running rebuild', this.rebuild)
            this.rebuild.subscribe((options) => {
                this.ngZone.runOutsideAngular(() => {
                    this.rebuildForm(this.form, options)
                })
            })
        }
    }

    setInstance(instance: any) {
        this.formio = instance
        instance.off('addComponent')
        instance.off('saveComponent')
        instance.off('updateComponent')
        instance.off('removeComponent')
        instance.on('addComponent', (component: any, parent: any, path: any, index: number, isNew: boolean) => {
            this.ngZone.run(() => {
                if (isNew) {
                    this.componentAdding = true
                } else {
                    this.change.emit({
                        type: 'addComponent',
                        builder: instance,
                        form: instance.schema,
                        component,
                        parent,
                        path,
                        index
                    })
                    this.componentAdding = false
                }
            })
        })
        instance.on('saveComponent', (component: any, original: any, parent: any, path: any, index: number, isNew: boolean) => {
            this.ngZone.run(() => {
                this.change.emit({
                    type: this.componentAdding ? 'addComponent' : 'saveComponent',
                    builder: instance,
                    form: instance.schema,
                    component,
                    originalComponent: original,
                    parent,
                    path,
                    index,
                    isNew: isNew || false
                })
                this.componentAdding = false
            })
        })
        instance.on('updateComponent', (component: any) => {
            this.ngZone.run(() => {
                this.change.emit({
                    type: 'updateComponent',
                    builder: instance,
                    form: instance.schema,
                    component
                })
            })
        })
        instance.on('removeComponent', (component: any, parent: any, path: any, index: number) => {
            this.ngZone.run(() => {
                this.change.emit({
                    type: 'deleteComponent',
                    builder: instance,
                    form: instance.schema,
                    component,
                    parent,
                    path,
                    index
                })
            })
        })
        this.ngZone.run(() => {
            this.readyResolve(instance)
        })
        return instance
    }

    setDisplay(display: string, prevDisplay?: string) {
        if (display && display !== prevDisplay) {
            (this.builder as any).setDisplay(display)
        }
    }

    buildForm(form: any, prevForm?: any) {
        // console.log('buildForm ran')
        if (!form || !this.builderElement || !this.builderElement.nativeElement) {
            console.warn('formbuilder::buildForm had no object, cannot continue')
            return
        }

        if (this.builder) {
            this.setDisplay(form.display, prevForm?.display)
            this.setInstance(this.builder.instance)
            this.builder.form = form
            this.builder.instance.form = form
            return this.builder.instance
        }

        return this.rebuildForm(form)
    }

    rebuildForm(form: any, options?: object) {
        // console.log('rebuildForm ran')
        const Builder = this.formbuilder || FormBuilder
        const extraTags = this.customTags ? this.customTags.tags : []
        this.builder = new Builder(
            this.builderElement.nativeElement,
            form,
            assign({
                icons: 'fontawesome',
                sanitizeConfig: {
                    addTags: extraTags
                }
            }, options || this.options || {})
        )
        return this.builder.ready.then(instance => this.setInstance(instance))
    }

    ngOnChanges(changes: any) {
        Utils.Evaluator.noeval = this.noeval

        if (changes.form && changes.form.currentValue) {
            this.ngZone.runOutsideAngular(() => {
                this.buildForm(changes.form.currentValue || {components: []}, changes.form.previousValue)
            })
        }
    }

    ngOnDestroy() {
        if (this.refreshSubscription) {
            this.refreshSubscription.unsubscribe()
        }

        if (this.formio) {
            this.formio.destroy()
        }
    }
}
