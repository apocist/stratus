/* tslint:disable:no-inferrable-types */
import {
    // ChangeDetectionStrategy,
    // ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
    OnInit
} from '@angular/core'
import {DomSanitizer} from '@angular/platform-browser'
import {
    MatDialog
} from '@angular/material/dialog'
import {isEmpty, snakeCase} from 'lodash'
import {keys} from 'ts-transformer-keys'
import {
    Stratus
} from '@stratusjs/runtime/stratus'
import {Model, ModelOptions} from '@stratusjs/angularjs/services/model'
// import {cookie} from '@stratusjs/core/environment'
import {safeUniqueId} from '@stratusjs/core/misc'
import {
    StripePaymentMethodComponent,
    StripePaymentMethodDialogData
} from './payment-method.component'
import {StripeComponent} from './stripe.service'
import {PaymentMethodCreateParams} from '@stripe/stripe-js'

// Local Setup
// const min = !cookie('env') ? '.min' : ''
const packageName = 'stripe'
const componentName = 'setup-intent'
// const localDir = `${Stratus.BaseUrl}${Stratus.DeploymentPath}@stratusjs/${packageName}/src/`

@Component({
    selector: `sa-${packageName}-${componentName}`,
    // templateUrl: `${localDir}/${parentModuleName}/${moduleName}.component.html`,
    template: '<button mat-raised-button (click)="addPaymentMethod($event)" [disabled]="newPaymentMethodPending || newPaymentMethodPrompt" [textContent]="addCardButtonText"></button>',
})
export class StripeSetupIntentComponent extends StripeComponent implements OnInit {

    // Basic Component Settings
    title = `${packageName}_${componentName}_component`

    // States
    styled = false
    initialized = false
    newPaymentMethodPrompt = false
    newPaymentMethodPending = false

    // Registry Attributes
    @Input() urlRoot: string = '/Api'
    @Input() paymentMethodApiPath: string = 'PaymentMethod'

    // Component Attributes
    @Input() addCardButtonText: string = 'Add Payment Method'
    @Input() detailedBillingInfo?: boolean
    @Input() defaultBillingInfo?: PaymentMethodCreateParams.BillingDetails

    constructor(
        private elementRef: ElementRef,
        private sanitizer: DomSanitizer,
        public dialog: MatDialog,
    ) {
        // Chain constructor
        super()

        // Initialization
        this.uid = safeUniqueId('sa', snakeCase(this.title))
        Stratus.Instances[this.uid] = this
        this.elementId = this.elementId || this.uid

        // Load Component CSS until System.js can import CSS properly.
        /*Stratus.Internals.CssLoader(`${localDir}${componentName}.component${min}.css`)
            .then(() => {
                this.styled = true
            })
            .catch(() => {
                console.error('CSS Failed to load for Component:', this)
                this.styled = false
            })*/

        // Hydrate Root App Inputs
        this.hydrate(this.elementRef, this.sanitizer, keys<StripeSetupIntentComponent>())
    }

    ngOnInit() {
        this.initialized = true
    }


    async addPaymentMethod(ev?: any) {
        if (ev) {
            ev.preventDefault()
            // ev.stopPropagation()
        }
        if (!this.newPaymentMethodPending && !this.newPaymentMethodPrompt) {
            // console.log('Stratus', Stratus)
            // console.log('running addPaymentMethod', this)
            let clientSecret = ''
            let publishKey = ''
            let formMessage = ''
            this.newPaymentMethodPending = true

            const apiOptions: ModelOptions = {
                target: this.paymentMethodApiPath
            }
            if (this.urlRoot) {
                apiOptions.urlRoot = this.urlRoot
            }

            const model = new Model(apiOptions)
            model.data.setupIntent = true
            await model.save()
            // console.log('model', model)
            if (
                Object.prototype.hasOwnProperty.call(model, 'meta') &&
                Object.prototype.hasOwnProperty.call(model.meta, 'data')
            ) {
                if (
                    Object.prototype.hasOwnProperty.call(model.meta.data, 'clientSecret') &&
                    Object.prototype.hasOwnProperty.call(model.meta.data, 'publishKey') &&
                    !isEmpty(model.meta.data.clientSecret) &&
                    !isEmpty(model.meta.data.publishKey)
                ) {
                    clientSecret = model.meta.data.clientSecret
                    publishKey = model.meta.data.publishKey
                }
                if (
                    Object.prototype.hasOwnProperty.call(model.meta.data, 'formMessage') &&
                    !isEmpty(model.meta.data.formMessage)
                ) {
                    formMessage = model.meta.data.formMessage
                }
            }
            // TODO check status
            // console.log('did returned checks')

            if (
                !isEmpty(clientSecret) &&
                !isEmpty(publishKey)
            ) {
                // console.log('got client and publish, will make an input')
                this.newPaymentMethodPrompt = true
                this.inputPaymentMethod(clientSecret, publishKey, formMessage, ev)
            }

            this.newPaymentMethodPending = false
        }
    }

    inputPaymentMethod(clientSecret: string, publishKey: string, formMessage?: string, ev?: any) {
        if (ev) {
            ev.preventDefault()
            // ev.stopPropagation()
        }
        formMessage = formMessage || ''

        this.newPaymentMethodPrompt = true
        // testing opening a dialog
        const dialogRef = this.dialog.open(StripePaymentMethodComponent, {
            width: '1000px',
            data: {
                clientSecret,
                publishKey,
                formMessage,
                urlRoot: this.urlRoot,
                paymentMethodApiPath: this.paymentMethodApiPath,
                detailedBillingInfo: this.detailedBillingInfo,
                defaultBillingInfo: this.defaultBillingInfo
            } as StripePaymentMethodDialogData
        })

        dialogRef.afterClosed().subscribe((result: StripePaymentMethodDialogData) => {
            this.newPaymentMethodPrompt = false
            if (!result || isEmpty(result)) {
                return
            }

            // Display output if one exists
            if (
                // this.dev &&
                result
            ) {
                // console.log('payment dialog result:', result)
            }
        })
    }

}
