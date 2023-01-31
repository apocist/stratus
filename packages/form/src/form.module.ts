/**
 * @source https://raw.githubusercontent.com/formio/angular/master/projects/angular-formio/src/formio.module.ts
 */
import {StratusPackage} from '@stratusjs/angular/app.module'
import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormioComponent } from './components/formio/formio.component'
// import { FormBuilderComponent } from './components/formbuilder/formbuilder.component'
// import { FormioAlerts } from './components/alerts/formio.alerts'
// import { ParseHtmlContentPipe } from './components/alerts/parse-html-content.pipe'
// import { FormioAlertsComponent } from './components/alerts/formio.alerts.component'
// import { FormioLoaderComponent } from './components/loader/formio.loader.component'
import { CustomTagsService } from './custom-component/custom-tags.service'
import { FormioBaseComponent } from './FormioBaseComponent'


@NgModule({
    // These determine what exists as a component within Angular system.
    declarations: [
        FormioComponent,
        FormioBaseComponent,
        // FormBuilderComponent,
        // FormioLoaderComponent,
        // FormioAlertsComponent,
        // ParseHtmlContentPipe
    ],
    // This determines what is accessible via DOM as a component. These must be listed in `declarations`. (required in stratus)
    entryComponents: [
        FormioComponent
    ],
    imports: [
        CommonModule
    ],
    exports: [
        FormioComponent,
        // FormBuilderComponent,
        // FormioLoaderComponent,
        // FormioAlertsComponent
    ],
    providers: [
        // FormioAlerts,
        CustomTagsService
    ]
})
export class FormModule {}
export const FormPackage: StratusPackage = {
    stratusModule: FormModule,
    stratusComponents: {
        'sa-form-formio': FormioComponent
    }
}
