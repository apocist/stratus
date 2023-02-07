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
import { assign, clone, isEmpty, isString, isUndefined } from 'lodash'
import {Observable, ObservableInput, Subject, Subscriber, Subscription, timer} from 'rxjs'
import {catchError, debounce} from 'rxjs/operators'
import { CustomTagsService } from '../../custom-component/custom-tags.service'
import {RootComponent} from '../../../../angular/src/core/root.component' // use the direct path
import {DomSanitizer} from '@angular/platform-browser'
import {LocationStrategy} from '@angular/common'
import {keys} from 'ts-transformer-keys'
import {isJSON, safeUniqueId} from '@stratusjs/core/misc'
import {Registry} from '@stratusjs/angularjs/services/registry'
import {Collection} from '@stratusjs/angularjs/services/collection'
import {Model} from '@stratusjs/angularjs/services/model'
import {EventBase} from '../../../../core/src/events/eventBase' // use the direct path
import {EventManager} from '../../../../core/src/events/eventManager' // use the direct path


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
    template: '<div #builder></div>',
    // styleUrls: ['../../../../../node_modules/formiojs/dist/formio.builder.min.css'],
    encapsulation: ViewEncapsulation.None
})
export class FormBuilderComponent extends RootComponent implements OnInit, OnChanges, OnDestroy {
    // Stratus Data Connectivity
    registry = new Registry()
    fetched: Promise<boolean|Collection|Model>
    data: any
    collection?: EventBase
    // @Output() model: any;
    @Input() model?: Model
    @Input() property: string

    // Observable Connection
    dataSub: Observable<[]>
    onChange = new Subject()
    subscriber: Subscriber<any>
    incomingData = ''
    outgoingData = ''

    public initialized: boolean
    public ready: Promise<object>
    public readyResolve: any
    public formio: any // Formio not fully typed
    public builder: FormBuilder
    public componentAdding = false
    private refreshSubscription: Subscription
    @Input() schema: string // Setup to allow formSchema on creation. Then schema only outputs
    @Input() form?: FormioForm // Input form...as object.. TODO use schema on load and convert to FormioForm
    @Input() options?: FormioOptions
    @Input() formbuilder?: any // FormBuilder as class
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
        this.uid = safeUniqueId('sa', packageName, componentName, 'component')
        Stratus.Instances[this.uid] = this

        // TODO update this.builder.helpLinks: string (it's set to formio)

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

        this.initDataConnectivity()

        // FIXME we need to translate this.form into any object if its a string
        console.log('FormBuilderComponent loaded', this)
    }
    initVariables() {
        if (
            isUndefined(this.form) && !isEmpty(this.schema) &&
            isJSON(this.schema)
        ) {
            this.form = JSON.parse(this.schema)
        } else if(isUndefined(this.form)) {
            // Make some kind of default form to not break everything
            this.form = {components: []}
        }
        if (isString(this.form)) {
            console.warn('formbuilder::form provided as "string", invalid parameter. Did you mean to use schema?', this.form)
        }
    }

    ngOnInit() {
        Utils.Evaluator.noeval = this.noeval

        if (this.refreshNow) {
            console.log('running refreshNow on event', this.refreshNow)
            this.refreshSubscription = this.refreshNow.subscribe(() => {
                this.ngZone.runOutsideAngular(() => {
                    this.initVariables()
                    this.buildForm(this.form)
                })
            })
        } else {
            // If refreshNow isn't set, we need some kind of way to instantiate
            this.ngZone.runOutsideAngular(() => {
                this.initVariables()
                // FIXME need to provide some form options?
                this.buildForm(this.form)
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

        this.initialized = true
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
                    this.schema = JSON.stringify(instance.schema)
                    this.change.emit({
                        type: 'addComponent',
                        builder: instance,
                        form: instance.schema,
                        schema: this.schema,
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
                this.schema = JSON.stringify(instance.schema)
                this.change.emit({
                    type: this.componentAdding ? 'addComponent' : 'saveComponent',
                    builder: instance,
                    form: instance.schema,
                    schema: this.schema,
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
                this.schema = JSON.stringify(instance.schema)
                this.change.emit({
                    type: 'updateComponent',
                    builder: instance,
                    form: instance.schema,

                    schema: this.schema,
                    component
                })
            })
        })
        instance.on('removeComponent', (component: any, parent: any, path: any, index: number) => {
            this.ngZone.run(() => {
                this.schema = JSON.stringify(instance.schema)
                this.change.emit({
                    type: 'deleteComponent',
                    builder: instance,
                    form: instance.schema,
                    schema: this.schema,
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
        this.schema = JSON.stringify(instance.schema)
        return instance
    }

    setDisplay(display: string, prevDisplay?: string) {
        if (display && display !== prevDisplay) {
            this.builder.setDisplay(display)
        }
    }

    buildForm(form: FormioForm, prevForm?: FormioForm) {
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

    rebuildForm(form: FormioForm, options?: object) {
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

    /////////////////////
    // Data connectivity functionality
    /////////////

    initDataConnectivity() {
        this.fetchData()
            .then(data => {
                if (!data || !(data instanceof EventManager)) {
                    console.warn('Unable to bind data from Registry!')
                    return
                }
                // Manually render upon model change
                // this.ref.detach();
                const onDataChange = () => {
                    if (!data.completed) {
                        return
                    }
                    // this.onDataChange();
                    this.dataDefer(this.subscriber)
                    // TODO: Add a debounce so we don't attempt to update multiple times while the model is changing.
                    // this.refresh()
                    // FIXME: Somehow this doesn't completely work...  It gets data from the model
                    // when it is changed, but won't propagate it when the form event changes the data.
                }
                data.on('change', onDataChange)
                onDataChange()
            })

        // Declare Observable with Subscriber (Only Happens Once)
        // TODO: Test if the observable is necessary in any way...
        this.dataSub = new Observable(subscriber => {
            // if (this.dev) {
                console.warn(`[observable] creating subscriber on ${this.uid}`, subscriber)
            // }
            return this.dataDefer(subscriber)
        })
        this.dataSub.pipe(
            // debounceTime(250),
            debounce(() => timer(250)),
            catchError(this.handleDataError)
        ).subscribe(evt => {
            // While the editor is focused, we skip debounce updates to avoid cursor glitches
            /*if (this.focused) {
                if (this.dev) {
                    console.warn(`[subscriber] waiting on updates due to focus on ${this.uid}`)
                }
                return
            }*/
            // TODO: This may need to only work on blur and not focus, unless it is the initialization value
            /*const dataControl = this.form.get('dataString') // FIXME two different forms and FormBuilders
            if (dataControl.value === evt) {
                // In the case of data being edited by the code view or something else,
                // we need to refresh the UI, as long as it has been initialized.
                if (this.initialized) {
                    this.refresh().then()
                }
                return
            }
            dataControl.patchValue(evt)
            // Note: A refresh may be necessary if things become less responsive
            this.refresh()*/ // This may not be doing the right refresh
        })
    }

    fetchData() {
        if (this.fetched) {
            return this.fetched
        }
        return this.fetched = this.registry.fetch(
            Stratus.Select(this.elementRef.nativeElement),
            this
        )
    }

    // Ensures Data is populated before hitting the Subscriber
    dataDefer(subscriber: Subscriber<any>) {
        this.subscriber = this.subscriber || subscriber
        if (!this.subscriber) {
            // if (this.dev) {
                console.warn(`[defer] debouncing due to empty subscriber on ${this.uid}`)
            // }
            setTimeout(() => {
                // if (this.dev) {
                    console.warn(`[defer] debounced subscriber returned on ${this.uid}`)
                // }
                this.dataDefer(subscriber)
            }, 250)
            return
        }
        const prevString = clone(this.incomingData)
        const dataString = this.dataRef()
        // ensure changes have occurred
        if (prevString === dataString) {
            return
        }
        if (!dataString && (!this.data || !this.data.completed)) {
            // if (this.dev) {
                console.warn(`[defer] debouncing subscriber due to unavailable data on ${this.uid}`, this.data)
            // }
            setTimeout(() => {
                // if (this.dev) {
                    console.warn(`[defer] debounced subscriber returned on ${this.uid}`)
                // }
                this.dataDefer(subscriber)
            }, 250)
            return
        }
        // if (this.dev) {
            console.warn(`[subscriber] new value submitted on ${this.uid}:`, dataString)
        // }
        this.subscriber.next(dataString)
        // TODO: Add a returned Promise to ensure async/await can use this defer directly.
    }

    dataRef(): string {
        if (!this.model) {
            return ''
        }
        return this.incomingData = this.normalizeIn(
            this.model.get(this.property)
        )
    }

    normalizeIn(data?: string): string {
        // Normalize non-string values to strings.
        if (!data || !isString(data)) {
            return ''
        }
        return data
    }
    normalizeOut(data?: string): string {
        // Normalize null values to empty strings to maintain consistent typing.
        if (data === null) {
            return ''
        }
        if (!isString(data)) {
            // TODO: look into either piping the data here to remove `fr-original-style`
            return data
        }
        return data
    }

    handleDataError(err: ObservableInput<any>): ObservableInput<any> {
        console.error(err)
        return err
    }
}
