// Angular Core
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
} from '@angular/core'

// CDK
import {
    ArrayDataSource
} from '@angular/cdk/collections'
import {
    CdkDragDrop,
    moveItemInArray,
} from '@angular/cdk/drag-drop'
import {
    NestedTreeControl
} from '@angular/cdk/tree'

// SVG Icons
import {DomSanitizer} from '@angular/platform-browser'
import {MatIconRegistry} from '@angular/material/icon'

// RXJS
import {Observable, Subject, Subscriber} from 'rxjs'

// External
import {Stratus} from '@stratusjs/runtime/stratus'
import _ from 'lodash'
import {keys} from 'ts-transformer-keys'

// Components
import {RootComponent} from '@stratusjs/angular/core/root.component'

// Services
import {Registry} from '@stratusjs/angularjs/services/registry'
import {cookie} from '@stratusjs/core/environment'

// Core Classes
import {EventManager} from '@stratusjs/core/events/eventManager'

// AngularJS Classes
import {
    Collection
} from '@stratusjs/angularjs/services/collection'
import {
    Model
} from '@stratusjs/angularjs/services/model'

// Force Dependent Services
// tslint:disable-next-line:no-duplicate-imports
import '@stratusjs/angularjs/services/registry'
// tslint:disable-next-line:no-duplicate-imports
import '@stratusjs/angularjs/services/collection'
// tslint:disable-next-line:no-duplicate-imports
import '@stratusjs/angularjs/services/model'
import {RefreshInterface} from '@stratusjs/angular/core/refresh.interface'

// Data Types
export interface NodeMeta {
    id: number
    expanded: boolean
    component?: RefreshInterface
}

export interface NodeMetaMap {
    [key: number]: NodeMeta
}

export interface Node {
    id: number
    model: any
    children: Node[]
    meta: NodeMeta
}

export interface NodeMap {
    [key: number]: Node
}

export interface KeyMap {
    [key: string]: boolean
}

export interface ElementMap {
    [key: string]: HTMLElement
}

// export interface Model {
//     completed: boolean;
//     data: object;
// }

// Local Setup
const installDir = '/assets/1/0/bundles'
const systemDir = '@stratusjs/angular'
const moduleName = 'tree'

// Directory Template
const localDir = `${installDir}/${boot.configuration.paths[`${systemDir}/*`].replace(/[^/]*$/, '')}`

/**
 * @title Tree with Nested Drag & Drop
 */
@Component({
    selector: `sa-${moduleName}`,
    templateUrl: `${localDir}/${moduleName}/${moduleName}.component.html`,
    // templateUrl: `${systemDir}/${moduleName}/${moduleName}.component.html`,
    // FIXME: This doesn't work, as it seems Angular attempts to use a System.js import instead of their own, so it will
    // require the steal-css module
    // styleUrls: [
    //     `${localDir}/${moduleName}/${moduleName}.component.css`
    // ],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class TreeComponent extends RootComponent { // implements OnInit

    // Basic Component Settings
    title = moduleName + '_component'
    uid: string

    // Registry Attributes
    @Input() target: string
    @Input() targetSuffix: string
    @Input() id: number
    @Input() manifest: boolean
    @Input() decouple: boolean
    @Input() direct: boolean
    @Input() api: object
    @Input() urlRoot: string

    // Component Attributes
    @Input() type: string
    @Input() property: string

    // Dependencies
    _ = _

    // Stratus Data Connectivity
    registry = new Registry()
    fetched: Promise<boolean|Collection|Model>
    data: any
    collection: any
    model: any

    // Observable Connection
    dataSub: Observable<[]>
    onChange = new Subject()
    subscriber: Subscriber<any>
    unsettled = false

    // Click Handling
    isSingleClick: boolean
    dblClickWait = 500

    // Drag & Drop
    dropLists: string[] = []
    // dropLists: HTMLElement[] = []
    dropListIdMap: KeyMap = {}
    dropListMap: ElementMap = {}
    expandedNodeSet = new Set<string>()
    dragging = false
    expandTimeout: any
    expandDelay = 1000

    // Tree Specific
    tree: Node[]
    treeMap: NodeMap
    metaMap: NodeMetaMap
    dataSource: ArrayDataSource<Node>
    // treeControl = new NestedTreeControl <any> (node => this.getChildren(node))
    treeControl = new NestedTreeControl<any>((node: Node) => node.children || [])

    // Methods
    // hasChild = (index: number, node: any) => this.getChildren(node).length > 0;
    // hasChild = (index: number, node: any) => node.children && node.children.length > 0

    constructor(
        public iconRegistry: MatIconRegistry,
        public sanitizer: DomSanitizer,
        private ref: ChangeDetectorRef,
        private elementRef: ElementRef
    ) {
        // Chain constructor
        super()

        // Initialization
        this.uid = _.uniqueId(`sa_${moduleName}_component_`)
        Stratus.Instances[this.uid] = this

        // SVG Icons
        iconRegistry.addSvgIcon(
            'delete',
            sanitizer.bypassSecurityTrustResourceUrl('/Api/Resource?path=@SitetheoryCoreBundle:images/icons/actionButtons/delete.svg')
        )

        // TODO: Assess & Possibly Remove when the System.js ecosystem is complete
        // Load Component CSS until System.js can import CSS properly.
        Stratus.Internals.CssLoader(`${localDir}/${moduleName}/${moduleName}.component.css`)

        // Hydrate Root App Inputs
        this.hydrate(elementRef, sanitizer, keys<TreeComponent>())

        // Data Connections
        this.fetchData()
            .then(data => {
                if (!data || !(data instanceof EventManager)) {
                    console.warn('Unable to bind data from Registry!')
                    return
                }
                // Manually render upon data change
                // this.ref.detach()
                const onDataChange = () => {
                    if (this.unsettled || !data.completed) {
                        return
                    }
                    this.dataDefer(this.subscriber)
                    this.refresh()
                }
                data.on('change', onDataChange)
                onDataChange()
            })

        // Handling Pipes with Promises
        this.dataSub = new Observable((subscriber: Subscriber<any>) => this.dataDefer(subscriber))

        // Initialize Drop List Map
        this.dropListIdMap[`${this.uid}_parent_drop_list`] = true
        this.trackDropLists()
    }

    // async ngOnInit() {
    //     console.info('tree.ngOnInit')
    // }

    public refresh() {
        if (!this.ref) {
            console.error('ref not available:', this)
            return
        }
        // TODO: Refresh treeNodeComponents through a map
        _.forEach(this.metaMap, (meta: NodeMeta) => {
            if (!meta.component || !('refresh' in meta.component)) {
                return
            }
            // console.log('refreshing meta:', meta.component)
            meta.component.refresh()
        })
        this.ref.detach()
        this.ref.detectChanges()
        this.ref.reattach()
    }

    public remove(model: any) {
        // const models = this.dataRef()
        // if (!models || !models.length) {
        //     return
        // }
        // // TODO: Handle Multi-Level Targeting
        // const index: number = models.indexOf(model)
        // if (index === -1) {
        //     return
        // }
        // models.splice(index, 1)
        // this.model.trigger('change')
    }

    public removeNode(list: Node[], node: Node): boolean {
        const index: number = list.indexOf(node)
        if (index === -1) {
            return false
        }
        list.splice(index, 1)
        return true
    }

    public nodeIsEqual(node: Node | null, other: Node | null): boolean {
        if (!node || !other) {
            return node === other
        }
        return node.id === other.id
    }

    // Data Connections
    public async fetchData() {
        if (this.fetched) {
            return this.fetched
        }
        return this.fetched = this.registry.fetch(
            Stratus.Select(this.elementRef.nativeElement),
            this
        )
    }

    private dataDefer(subscriber: Subscriber<any>) {
        this.subscriber = subscriber
        const tree = this.dataRef(true)
        if (tree && tree.length) {
            subscriber.next(tree)
            return
        }
        setTimeout(() => this.dataDefer(subscriber), 200)
    }

    private dataRef(force: boolean = false): Node[] {
        if (!this.collection) {
            return []
        }
        if (!force && this.tree && this.tree.length > 0) {
            return this.tree
        }
        // TODO: Break away from the registry here...  It's not responsive enough.
        let models = this.collection.models
        if (!models || !_.isArray(models) || !models.length) {
            return []
        }
        models = _.sortBy(models, ['data.priority'])
        // Convert Collection Models to Nested Tree to optimize references
        this.metaMap = this.metaMap || {}
        this.treeMap = {}
        this.tree = []
        _.forEach(models, (model: any) => {
            const modelId = _.get(model, 'data.id')
            const parentId = _.get(model, 'data.nestParent.id')
            this.dropListIdMap[`${this.uid}_node_${modelId}_drop_list`] = true
            if (!_.has(this.metaMap, modelId)) {
                this.metaMap[modelId] = {
                    id: modelId,
                    expanded: false
                }
            }
            if (!_.has(this.treeMap, modelId)) {
                this.treeMap[modelId] = {
                    id: modelId,
                    model,
                    children: [],
                    meta: this.metaMap[modelId]
                }
            }
            this.treeMap[modelId].model = model
            this.treeMap[modelId].meta = this.metaMap[modelId]
            if (parentId) {
                if (!_.has(this.treeMap, parentId)) {
                    this.treeMap[parentId] = {
                        id: parentId,
                        model: null,
                        children: [],
                        meta: null
                    }
                }
                this.treeMap[parentId].children.push(
                    this.treeMap[modelId]
                )
            } else {
                this.tree.push(
                    this.treeMap[modelId]
                )
            }
        })
        this.trackDropLists()
        return this.tree
    }

    private trackDropLists() {
        this.dropLists = []
        _.forEach(this.dropListIdMap, (value: boolean, key: string) => {
            if (!value) {
                return
            }
            const cached = key in this.dropListMap
            const element = cached ? this.dropListMap[key] : document.getElementById(key)
            if (!element) {
                return
            }
            this.dropLists.push(key)
            // this.dropLists.push(element)
            if (cached) {
                return
            }
            this.dropListMap[key] = element
        })
    }

    private setExpanded(expanded: boolean): void {
        if (!this.metaMap || !_.size(this.metaMap)) {
            return
        }
        _.forEach(this.metaMap, (nodeMeta: NodeMeta) => {
            nodeMeta.expanded = expanded
        })
        this.refresh()
    }

    public setExpandedClick(expanded: boolean): void {
        this.isSingleClick = true
        setTimeout(() => {
            if (!this.isSingleClick) {
                return
            }
            this.setExpanded(expanded)
        }, this.dblClickWait)
    }

    public setExpandedDblClick(expanded: boolean): void {
        this.isSingleClick = false
        this.setExpanded(expanded)
    }

    /**
     * Experimental - opening tree nodes as you drag over them
     */
    // public onDragStart() {
    //     this.dragging = true
    // }
    //
    // public onDragEnd() {
    //     this.dragging = false
    // }
    //
    // public onDragHover(node: Node) {
    //     if (this.dragging) {
    //         clearTimeout(this.expandTimeout)
    //         this.expandTimeout = setTimeout(() => {
    //             this.treeControl.expand(node)
    //         }, this.expandDelay)
    //     }
    // }
    //
    // public onDragHoverEnd() {
    //     if (this.dragging) {
    //         clearTimeout(this.expandTimeout)
    //     }
    // }

    // public get connectedDropListsIds(): string[] {
    //     // We reverse ids here to respect items nesting hierarchy
    //     return this.getIdsRecursive(this.parentItem).reverse()
    // }

    public onDragDrop(event: CdkDragDrop<any>) {
        // ignore drops outside of the tree
        if (!event.isPointerOverContainer) {
            return
        }
        // if (!this.dataSource) {
        //     return
        // }

        // console.log('onDragDrop:', event)

        // Gather Target (Dropped) Node
        const targetNode: Node | null = event.item.data
        if (!targetNode) {
            return
        }

        // Determine Parents
        const parentNode: Node | null = event.container.data
        const pastParentNode: Node | null = event.previousContainer.data

        // Determine Placement
        const tree: Node[] | null = parentNode ? parentNode.children : this.dataRef()
        if (!tree) {
            return
        }

        // Disable Listeners
        this.unsettled = true

        // Debug Data
        const dropDebug = false
        if (cookie('env') && dropDebug) {
            console.group('onDragDrop()')
            _.forEach(
                [
                    `model drop: ${targetNode.model.get('name')}`,
                    `list shift: ${event.container.element.nativeElement.id} -> ${event.previousContainer.element.nativeElement.id}`,
                    `index change: ${event.previousIndex} -> ${event.currentIndex}`,
                    `current priority: ${targetNode.model.get('priority')}`,
                ],
                (message) => console.log(message)
            )
        }

        // Handle Parent Change
        if (!this.nodeIsEqual(parentNode, pastParentNode)) {
            if (parentNode) {
                parentNode.children.push(targetNode)
            }
            if (pastParentNode) {
                this.removeNode(pastParentNode.children, targetNode)
            }
            const parentPatch = {}
            if (parentNode) {
                [
                    'id',
                    'name'
                ].forEach((key) => {
                    const value = _.get(parentNode, `model.data.${key}`)
                    if (!value) {
                        return
                    }
                    _.set(parentPatch, key, value)
                })
            }
            targetNode.model.set('nestParent', !parentNode ? parentNode : parentPatch)
            // console.log(`new parent: ${targetNode.model.get('nestParent.name') || null}`)
        }

        // Set Priority
        moveItemInArray(tree, event.previousIndex, event.currentIndex)
        let priority = 0
        _.forEach(tree, (node: Node) => {
            if (!node.model || !node.model.set) {
                return
            }
            node.model.set('priority', priority++)
        })

        // Debug Data
        if (cookie('env') && dropDebug) {
            console.log('new priority:', targetNode.model.get('priority'))
            console.groupEnd()
        }

        // Handle Propagation
        // let settledModel = false
        // targetNode.model.on('complete', () => {
        //     if (settledModel) {
        //         return
        //     }
        //     settledModel = true
        //
        //     // update pipe
        //     // this.subscriber.next(tree)
        //     // this.ref.detectChanges()
        //
        //     // propagate change
        //     // this.collection.throttleTrigger('change')
        // })

        // Start XHR
        targetNode.model.save()

        // Enable Listeners
        this.unsettled = false

        // update pipe
        // this.subscriber.next(tree)
        // this.ref.detectChanges()

        // propagate change
        // this.collection.throttleTrigger('change')
    }

    // private canBeDropped(event: CdkDragDrop<any, any>): boolean {
    //     const movingNode: any = event.item.data
    //
    //     return event.previousContainer.id !== event.container.id
    //         && this.isNotSelfDrop(event)
    //         && !this.hasChild(movingNode)
    // }

    // private isNotSelfDrop(event: CdkDragDrop<any> | CdkDragEnter<any> | CdkDragExit<any>): boolean {
    //     console.log('isNotSelfDrop:', event.item.data, event.item.data)
    //     return !_.isEqual(event.item.data, event.item.data)
    // }

    // getChildren(model: any): any[] {
    //     if (!model) {
    //         return [];
    //     }
    //     // TODO: Instead of a filter, like this, it would be better to search the tree
    //     return _.filter(this.dataRef(), function (child) {
    //         const modelId = _.get(model, 'data.id');
    //         const parentId = _.get(child, 'data.nestParent.id');
    //         return modelId && parentId && modelId === parentId;
    //     })
    // }
}
