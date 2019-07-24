// Angular Core
import {ChangeDetectorRef, Component, Output} from '@angular/core';
import {FormControl} from '@angular/forms';

// CDK
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

// External
import {Observable, Subject, Subscriber} from 'rxjs';
import {map, startWith} from 'rxjs/operators';

// SVG Icons
import {DomSanitizer, ɵDomSanitizerImpl} from '@angular/platform-browser';
import {MatIconRegistry} from '@angular/material/icon';

import * as Stratus from 'stratus';
import * as _ from 'lodash';
import {SubjectSubscriber} from 'rxjs/internal/Subject';

const localDir = '/assets/1/0/bundles/sitetheorystratus/stratus/src/angular';
const systemDir = '@stratus/angular';
const moduleName = 'selector';

// export interface Model {
//     completed: boolean;
//     data: object;
// }

/**
 * @title AutoComplete Selector with Drag&Drop Sorting
 */
@Component({
    // selector: 's2-selector-component',
    selector: 's2-selector',
    templateUrl: `${localDir}/${moduleName}/${moduleName}.component.html`,
    // FIXME: This doesn't work, as it seems Angular attempts to use a System.js import instead of their own, so it will
    // require the steal-css module
    // styleUrls: [
    //     `${localDir}/${moduleName}/${moduleName}.component.css`
    // ],
})

export class SelectorComponent {

    // Basic Component Settings
    title = 'selector-dnd';
    uid: string;

    // Dependencies
    _: any;
    sanitizer: DomSanitizer;
    selectCtrl = new FormControl();

    // Stratus Data Connectivity
    registry = new Stratus.Data.Registry();
    fetched: any;
    data: any;
    collection: any;
    // @Output() model: any;
    model: any;

    // Observable Connection
    dataSub: Observable<[]>;
    onChange = new Subject();
    subscriber: Subscriber<any>;
    // Note: It may be better to LifeCycle::tick(), but this works for now

    // API Endpoint for Selector
    // TODO: Avoid hard-coding this...
    url = '/Api/Content?q=value&options["showRouting"]';
    target = 'Content';

    // API Connectivity for Selector
    // filteredModels: Observable<[]>;
    // filteredModels: any;

    constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer, private ref: ChangeDetectorRef) {

        // Initialization
        this.uid = _.uniqueId('s2_selector_component_');
        Stratus.Instances[this.uid] = this;

        // Hoist Context
        const that = this;

        // Dependencies
        this._ = _;
        this.sanitizer = sanitizer;

        // SVG Icons
        iconRegistry.addSvgIcon(
            'delete',
            sanitizer.bypassSecurityTrustResourceUrl('/Api/Resource?path=@SitetheoryCoreBundle:images/icons/actionButtons/delete.svg')
        );

        // TODO: Assess & Possibly Remove when the System.js ecosystem is complete
        // Load Component CSS until System.js can import CSS properly.
        Stratus.Internals.CssLoader(`${localDir}/${moduleName}/${moduleName}.component.css`);

        // Data Connections
        this.fetchData()
            .then((data: any) => {
                if (!data.on) {
                    console.warn('Unable to bind data from Registry!');
                    return;
                }
                // Manually render upon model change
                ref.detach();
                data.on('change', () => {
                    // that.onDataChange(ref);
                    that.dataDefer(that.subscriber);
                    ref.detectChanges();
                });
                // that.onDataChange(ref);
                that.dataDefer(that.subscriber);
                ref.detectChanges();
            });

        // Handling Pipes with Promises
        this.dataSub = new Observable((subscriber) => this.dataDefer(subscriber));

        // AutoComplete Binding
        // this.filteredModels = this.selectCtrl.valueChanges
        //     .pipe(
        //         startWith(''),
        //         map(value => this._filterModels(value))
        //     );

        // console.info('constructor!');
    }

    // ngOnInit(): void {
    //     console.info('ngOnInit!');
    // }

    // ngDoCheck(): void {
    //     console.info('ngDoCheck:', this.dataSub);
    // }

    drop(event: CdkDragDrop<string[]>) {
        const models = this.dataRef();
        if (!models || !models.length) {
            return;
        }
        moveItemInArray(models, event.previousIndex, event.currentIndex);
        let priority = 0;
        _.each(models, (model) => model.priority = priority++);
        this.model.trigger('change');
    }

    remove(model: any) {
        const models = this.dataRef();
        if (!models || !models.length) {
            return;
        }
        const index: number = models.indexOf(model);
        if (index === -1) {
            return;
        }
        models.splice(index, 1);
        // this.prioritize();
        this.model.trigger('change');
    }

    // Data Connections
    async fetchData(): Promise<any> {
        if (!this.fetched) {
            this.fetched = this.registry.fetch(Stratus.Select('#widget-edit-entity'), this);
        }
        return this.fetched;
    }

    dataDefer(subscriber: Subscriber<any>) {
        this.subscriber = subscriber;
        const models = this.dataRef();
        if (models && models.length) {
            subscriber.next(models);
            return;
        }
        setTimeout(() => this.dataDefer(subscriber), 500);
    }

    dataRef(): any {
        if (!this.model) {
            return [];
        }
        const models = _.get(this.model, 'data.version.modules');
        if (!models || !_.isArray(models)) {
            return [];
        }
        return models;
    }

    // selectedModel (observer: any) : any {
    //     if (!this.data) {
    //         this.fetchData().then(function (data: any) {
    //             observer.next(data)
    //         });
    //     }
    //     // data.on('change', () => observer.next(that.dataRef()));
    //     observer.next()
    // }

    // async selectedModelFetch(observer: any): Promise<[]> {
    //     const that = this;
    //     return new Promise(function (resolve, reject) {
    //         if (that.model) {
    //             resolve(that.dataRef());
    //             return;
    //         }
    //         that.fetchData()
    //             .then(function (data: any) {
    //                 if (!data.completed) {
    //                     console.error('still waiting on XHR!');
    //                     // return;
    //                 }
    //                 resolve(that.dataRef());
    //             })
    //             .catch(function (err: any) {
    //                 console.error("unable to fetch model:", err);
    //                 reject(err)
    //             });
    //     });
    // }

    // private _filterModels(value: string): any {
    //     // return await this.collection.filterAsync(value);
    //     // return await [];
    //     return [];
    // }

    onDataChange(ref: ChangeDetectorRef) {
        // that.prioritize();
        this.dataDefer(this.subscriber);
        ref.detectChanges();
    }

    prioritize() {
        const models = this.dataRef();
        if (!models || !models.length) {
            return;
        }
        let priority = 0;
        _.each(models, (model) => model.priority = priority++);
    }

    findImage(model: any) {
        const mime = _.get(model, 'version.images[0].mime');
        if (mime === undefined) {
            return '';
        }
        if (mime.indexOf('image') !== -1) {
            return _.get(model, 'version.images[0].src');
        } else if (mime.indexOf('video') !== -1) {
            return _.get(model, 'version.images[0].meta.thumbnail_small');
        }
        return '';
    }
}