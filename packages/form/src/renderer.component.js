var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Component, } from '@angular/core';
import { Stratus } from '@stratusjs/runtime/stratus';
import { RootComponent } from '../../angular/src/core/root.component';
const packageName = 'form';
const componentName = 'renderer';
const selectorName = `${packageName}-${componentName}`;
const systemDir = `@stratusjs/${packageName}`;
const localDir = `${Stratus.BaseUrl}${boot.configuration.paths[`${systemDir}/*`].replace(/[^/]*$/, '').replace(/angular\/dist\/$/, 'form/src/')}`;
let FormRendererComponent = class FormRendererComponent extends RootComponent {
    ngOnInit() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('FormRenderer inited', this);
        });
    }
    ngAfterViewInit() {
        console.log('FormRenderer inited', this);
    }
};
FormRendererComponent = __decorate([
    Component({
        selector: `sa-${selectorName}`,
        templateUrl: `${localDir}/${componentName}.component.html`
    })
], FormRendererComponent);
export { FormRendererComponent };

//# sourceMappingURL=renderer.component.js.map
