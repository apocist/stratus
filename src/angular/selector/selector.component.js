System.register(["@angular/core", "@angular/forms", "@angular/cdk/drag-drop", "rxjs", "@angular/platform-browser", "@angular/material/icon", "stratus", "lodash"], function (exports_1, context_1) {
    "use strict";
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata = (this && this.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var core_1, forms_1, drag_drop_1, rxjs_1, platform_browser_1, icon_1, Stratus, _, localDir, SelectorComponent;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (forms_1_1) {
                forms_1 = forms_1_1;
            },
            function (drag_drop_1_1) {
                drag_drop_1 = drag_drop_1_1;
            },
            function (rxjs_1_1) {
                rxjs_1 = rxjs_1_1;
            },
            function (platform_browser_1_1) {
                platform_browser_1 = platform_browser_1_1;
            },
            function (icon_1_1) {
                icon_1 = icon_1_1;
            },
            function (Stratus_1) {
                Stratus = Stratus_1;
            },
            function (_1) {
                _ = _1;
            }
        ],
        execute: function () {
            localDir = '/assets/1/0/bundles/sitetheorystratus/stratus/src/angular';
            SelectorComponent = class SelectorComponent {
                constructor(iconRegistry, sanitizer) {
                    this.title = 'selector-dnd';
                    this.selectCtrl = new forms_1.FormControl();
                    this.registry = new Stratus.Data.Registry();
                    this.url = '/Api/Content?q=value&options["showRouting"]';
                    this.target = 'Content';
                    this.uid = _.uniqueId('s2_selector_component_');
                    Stratus.Instances[this.uid] = this;
                    this._ = _;
                    this.sanitizer = sanitizer;
                    iconRegistry.addSvgIcon('delete', sanitizer.bypassSecurityTrustResourceUrl('/Api/Resource?path=@SitetheoryCoreBundle:images/icons/actionButtons/delete.svg'));
                    this.fetchModel();
                    this.selectedModels = new rxjs_1.Observable((observer) => this.selectedModelDefer(observer));
                }
                drop(event) {
                    const models = this.selectedModelRef();
                    if (!models || !models.length) {
                        return;
                    }
                    drag_drop_1.moveItemInArray(models, event.previousIndex, event.currentIndex);
                    let priority = 0;
                    _.each(models, (model) => model.priority = priority++);
                }
                remove(model) {
                }
                fetchModel() {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (!this.fetched) {
                            this.fetched = this.registry.fetch(Stratus.Select('#widget-edit-entity'), this);
                        }
                        return this.fetched;
                    });
                }
                selectedModelDefer(observer) {
                    const models = this.selectedModelRef();
                    if (models && models.length) {
                        observer.next(models);
                        return;
                    }
                    setTimeout(() => this.selectedModelDefer(observer), 500);
                }
                selectedModelRef() {
                    if (!this.model) {
                        return [];
                    }
                    const models = this.model.get("version.modules");
                    if (!models || !_.isArray(models)) {
                        return [];
                    }
                    return models;
                }
                findImage(model) {
                    const mime = _.get(model, 'version.images[0].mime');
                    if (mime === undefined) {
                        return '';
                    }
                    if (mime.indexOf('image') !== -1) {
                        return _.get(model, 'version.images[0].src');
                    }
                    else if (mime.indexOf('video') !== -1) {
                        return _.get(model, 'version.images[0].meta.thumbnail_small');
                    }
                    return '';
                }
            };
            SelectorComponent = __decorate([
                core_1.Component({
                    selector: 's2-selector',
                    templateUrl: `${localDir}/selector/selector.component.html`,
                    styleUrls: [
                        `${localDir}/selector/selector.component.css`
                    ],
                }),
                __metadata("design:paramtypes", [icon_1.MatIconRegistry, platform_browser_1.DomSanitizer])
            ], SelectorComponent);
            exports_1("SelectorComponent", SelectorComponent);
        }
    };
});
